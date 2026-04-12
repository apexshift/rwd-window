/**
 * @module KeyboardManager
 * @description Singleton that owns all keyboard shortcut handling for RWD Window.
 *
 * Keyboard events are ignored when an `<input>` or `<textarea>` is focused so
 * that typing into the dimension inputs does not trigger viewport shortcuts.
 *
 * Supported shortcuts:
 * - `← →`           Resize width  (±1 / ±10 Shift / ±50 Ctrl/Cmd)
 * - `↑ ↓`           Resize height (±1 / ±10 Shift / ±50 Ctrl/Cmd)
 * - `1–9`           Quick-select breakpoint by index (second press toggles min/max)
 * - `Tab/Shift+Tab` Cycle breakpoints forward/backward
 * - `H`             Toggle between config minHeight and live container height
 * - `F`             Fit to container
 * - `Esc`           Clear current mode
 * - `?`             Toggle splash.html (keyboard reference) in the viewport iframe — restores previous src on second press
 *
 * @since 0.2.0
 */

import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import BreakpointManager from './BreakpointManager.js';
import { showToast } from '../Utils.js';

let instance = null;

export class KeyboardManager {
    /** @private @type {number} Zero-based index of the last activated breakpoint, or -1. */
    #lastActivatedIndex = -1;

    /**
     * The demo URL that was active before splash.html was loaded.
     * `null` means no previous state has been saved.
     * @private @type {string|null}
     */
    #previousDemo = null;

    constructor() {
        if (instance) throw new Error('KeyboardManager is a singleton.');
        instance = this;

        // Listen for app manager initialization
        bus.on('app:managers:init', () => this.#initializeManager());
    }

    /**
     * Return the shared KeyboardManager instance, creating it on first call.
     * @returns {KeyboardManager}
     */
    static getInstance() {
        if (!instance) instance = new KeyboardManager();
        return instance;
    }

    /**
     * Attach DOM and bus listeners, then signal readiness.
     * @private
     */
    #initializeManager() {
        this.#setupListeners();
        this.#setupEventBusListeners();
        bus.emit('keyboardManager:ready', {});
    }

    /**
     * Register the global `keydown` handler on `document`.
     * All shortcut dispatch lives here to keep the logic in one readable switch.
     * @private
     */
    #setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            switch (key) {
                case 'arrowright':
                    this.#resizeWidth(1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowleft':
                    this.#resizeWidth(-1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowup':
                    this.#resizeHeight(1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowdown':
                    this.#resizeHeight(-1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;

                case 'f':
                    this.#triggerFit();
                    e.preventDefault();
                    break;

                case 'escape':
                    this.#clearMode();
                    break;

                case 'tab':
                    if (shift) {
                        this.#cycleBreakpoint(-1);
                    } else {
                        this.#cycleBreakpoint(1);
                    }
                    e.preventDefault();
                    break;

                case 'h':
                    this.#toggleHeightClamp();
                    break;

                case '?':
                case '/':
                    if (shift || key === '?') this.#loadSplash();
                    break;

                default:
                    if (key >= '1' && key <= '9') {
                        const index = parseInt(key) - 1;
                        this.#selectBreakpointByIndex(index);
                    }
                    break;
            }
        });
    }

    /**
     * Subscribe to bus events that affect KeyboardManager's own state.
     * @private
     */
    #setupEventBusListeners() {
        bus.on('ui:helpClicked', () => this.#loadSplash());
    }

    /**
     * Adjust the viewport width by `delta` pixels via state.
     * @private
     * @param {number} delta - Signed pixel amount.
     */
    #resizeWidth(delta) {
        const current = state.getViewport();
        state.updateViewport(current.width + delta, current.height);
    }

    /**
     * Adjust the viewport height by `delta` pixels via state.
     * @private
     * @param {number} delta - Signed pixel amount.
     */
    #resizeHeight(delta) {
        const current = state.getViewport();
        state.updateViewport(current.width, current.height + delta);
    }

    /**
     * Emit `viewport:fit` so IFrameController performs a fit-to-container.
     * @private
     */
    #triggerFit() {
        bus.emit('viewport:fit', {});
    }

    /**
     * Reset the viewport mode to 'manual' and clear any active breakpoint.
     * @private
     */
    #clearMode() {
        state.setMode('manual');
        state.setActiveBreakpoint(null);
    }

    /**
     * Activate the breakpoint at `index`. A second press on the same index
     * toggles between max-width and min-width mode.
     *
     * @private
     * @param {number} index - Zero-based breakpoint index.
     */
    #selectBreakpointByIndex(index) {
        const bpManager = BreakpointManager.getInstance();
        const breakpoints = bpManager.getBreakpoints();
        if (index < 0 || index >= breakpoints.length) return;

        const bp = breakpoints[index];
        const isSameAsLast = this.#lastActivatedIndex === index;
        const isMinMode = isSameAsLast ? !(state.getActiveBreakpoint()?.isMinMode || false) : false;
        const targetWidth = isMinMode ? bp.minWidth : bp.maxWidth;

        state.setMode('device');
        state.setActiveBreakpoint({ ...bp, isMinMode, targetWidth });
        bus.emit('breakpoint:activated', { breakpoint: bp, isMinMode, targetWidth });

        this.#lastActivatedIndex = index;
    }

    /**
     * Move to the next (`direction = 1`) or previous (`direction = -1`) breakpoint,
     * wrapping around the ends of the list.
     *
     * @private
     * @param {1|-1} direction
     */
    #cycleBreakpoint(direction) {
        const bpManager = BreakpointManager.getInstance();
        const breakpoints = bpManager.getBreakpoints();
        if (breakpoints.length === 0) return;

        let currentIndex = this.#lastActivatedIndex;
        if (currentIndex === -1) currentIndex = 0;

        const nextIndex = (currentIndex + direction + breakpoints.length) % breakpoints.length;
        this.#selectBreakpointByIndex(nextIndex);
    }

    /**
     * Toggle the viewport height between `clamping.minHeight` and the live
     * container height (`clamping.maxHeight`). Shows a toast confirming the
     * new height.
     * @private
     */
    #toggleHeightClamp() {
        const current = state.getViewport();
        const clamping = state.getClamping();

        // Toggle between min and max height clamp
        const newHeight = current.height === clamping.minHeight
            ? clamping.maxHeight
            : clamping.minHeight;

        state.updateViewport(current.width, newHeight);
        showToast(`Height: ${newHeight}px`, { type: 'info' });
    }

    /**
     * Toggle the splash reference page in the viewport iframe.
     * - First call: saves the current demo URL and loads `./splash.html`.
     * - Second call: restores the previously saved demo URL.
     *
     * Triggered by the `?` key and the help button click (`ui:helpClicked`).
     * @private
     */
    #loadSplash() {
        const current = state.getCurrentDemo();
        if (current === './splash.html') {
            if (this.#previousDemo !== null) {
                state.setCurrentDemo(this.#previousDemo);
            }
            this.#previousDemo = null;
        } else {
            this.#previousDemo = current;
            state.setCurrentDemo('./splash.html');
        }
    }

    /**
     * Toggle the splash reference page in the viewport iframe (public API).
     * First call shows splash, second call restores the previous demo.
     */
    toggleHelp() {
        this.#loadSplash();
    }
}

export default KeyboardManager;
