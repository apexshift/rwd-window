/**
 * @module BreakpointManager
 * @description Singleton that manages responsive breakpoint definitions and their
 * corresponding device buttons in the masthead.
 *
 * Responsibilities:
 * - Load and validate breakpoints from `config.json`.
 * - Render a device button for each breakpoint via UIFactory.
 * - Handle single-click (max ↔ min width toggle) and double-click (fit) on buttons.
 * - Keep button `.active` states in sync with `state.activeBreakpoint`.
 * - Provide a passive range hint during manual/drag resize by highlighting the
 *   button whose `[minWidth, maxWidth]` range contains the current viewport width.
 *
 * @since 0.1.0
 */

import config from "../../../config.json" with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import { UIFactory } from '../core/UIFactory.js';
import UIManager from "./UIManager.js";

let instance = null;

export class BreakpointManager {
    /** @private @type {Array<{label:string, minWidth:number, maxWidth:number, icon:string}>} */
    #breakpoints = [];

    /** @private @type {Element|null} The device button container element. */
    #buttonContainer = null;

    constructor() {
        if (instance) throw new Error('BreakpointManager is a singleton.');
        instance = this;

        this.#setupSubscriptions();
    }

    /**
     * Return the shared BreakpointManager instance, creating it on first call.
     * @returns {BreakpointManager}
     */
    static getInstance() {
        if (!instance) instance = new BreakpointManager([]);
        return instance;
    }

    /**
     * Register all EventBus subscriptions.
     * Called from the constructor so subscriptions are active before any init event fires.
     * @private
     */
    #setupSubscriptions() {
        bus.on('app:managers:init', () => this.#loadAndInitialize());

        // Sync button active states when state changes
        bus.on('state:activeBreakpointChanged', ({ value }) => this.#syncActiveButtonVisuals(value));

        // Clear device highlights when fit mode is entered — drag may have set a
        // visual active state without touching state.activeBreakpoint (already null)
        bus.on('state:modeChanged', ({ value }) => {
            if (value === 'fit') this.#syncActiveButtonVisuals(null);
        });

        // Highlight the matching breakpoint range button during manual/drag resize
        bus.on('state:viewportChanged', ({ value }) => this.#syncButtonVisualsForWidth(value.width));

        bus.on('app:ready', () => this.#initializeUI());
    }

    /**
     * Parse breakpoints from config, validate each entry, and signal readiness.
     * Emits `config:error` on failure, leaving `#breakpoints` as an empty array.
     * @private
     */
    #loadAndInitialize() {
        try {
            const raw = config.ui_controls.breakpoints || [];
            this.#breakpoints = raw.map(bp => ({
                label: bp.label,
                minWidth: Number(bp.minWidth ?? bp['min-width']),
                maxWidth: Number(bp.maxWidth ?? bp['max-width']),
                icon: bp.icon
            })).filter(bp => bp.label && !isNaN(bp.minWidth) && !isNaN(bp.maxWidth));

            bus.emit('breakpoints:loaded', { count: this.#breakpoints.length });
            bus.emit('breakpoints:ready', {});
        } catch (err) {
            console.error('Breakpoint config load failed:', err);
            bus.emit('config:error', { type: 'breakpoints', message: err.message });
            this.#breakpoints = [];
        }
    }

    /**
     * Create and append a device button for each breakpoint into the container
     * element provided by UIManager. No-ops if the container is unavailable.
     * @private
     */
    #initializeUI() {
        const UI = UIManager.getInstance();
        this.#buttonContainer = UI.deviceContainer;

        if (!this.#buttonContainer) {
            console.warn('Device button container not found via UIManager.');
            return;
        }

        this.#breakpoints.forEach((bp, index) => {
            const button = UIFactory.createDeviceButton(bp, index);
            button.addEventListener('click', (e) => this.#handleBreakpointClick(bp, e));
            button.addEventListener('dblclick', (e) => { e.stopImmediatePropagation(); this.#resetToFit(); });
            this.#buttonContainer.appendChild(button);
        });

        // Sync button active state from persisted state now that buttons exist.
        const activeBp = state.getActiveBreakpoint();
        if (activeBp) {
            this.#syncActiveButtonVisuals(activeBp);
        } else {
            this.#syncButtonVisualsForWidth(state.getViewport().width);
        }
    }

    /**
     * Handle a click on a breakpoint button.
     *
     * - Double-click (detail ≥ 2) delegates to `#resetToFit`.
     * - First click sets max-width mode.
     * - Second click on the same breakpoint toggles to min-width mode (and vice versa).
     *
     * @private
     * @param {{ label:string, minWidth:number, maxWidth:number }} breakpoint
     * @param {MouseEvent} event
     */
    #handleBreakpointClick(breakpoint, event) {
        if (event?.detail >= 2) {
            this.#resetToFit();
            return;
        }

        const current = state.getActiveBreakpoint();
        const isSame = current && current.label === breakpoint.label;
        const isMinMode = isSame ? !(current.isMinMode || false) : false;
        const targetWidth = isMinMode ? breakpoint.minWidth : breakpoint.maxWidth;

        state.setMode('device');
        state.setActiveBreakpoint({ ...breakpoint, isMinMode, targetWidth });
        this.#syncActiveButtonVisuals({ ...breakpoint, isMinMode });

        bus.emit('breakpoint:activated', { breakpoint, isMinMode, targetWidth });
    }

    /**
     * Reset the viewport to fit mode, clearing the active breakpoint.
     * @private
     */
    #resetToFit() {
        state.setMode('fit');
        state.setActiveBreakpoint(null);
        bus.emit('viewport:fit', {});
    }

    /**
     * Add `.active` to the button matching `activeBp.label` and remove it
     * from all other buttons. Pass `null` to clear all active states.
     *
     * @private
     * @param {{ label:string }|null} activeBp
     */
    #syncActiveButtonVisuals(activeBp) {
        document.querySelectorAll('.controls-group button').forEach(btn => btn.classList.remove('active'));
        if (!activeBp) return;
        const match = Array.from(document.querySelectorAll('.controls-group button'))
            .find(btn => btn.dataset.mode === activeBp.label);
        if (match) match.classList.add('active');
    }

    /**
     * During manual/drag resize, highlight the button whose range contains
     * `width`. Only active in 'manual' mode — ignored in 'fit' and 'device'.
     *
     * @private
     * @param {number} width - Current viewport width in pixels.
     */
    #syncButtonVisualsForWidth(width) {
        if (state.getMode() !== 'manual') return;
        const match = this.#breakpoints.find(bp => width >= bp.minWidth && width <= bp.maxWidth);
        this.#syncActiveButtonVisuals(match || null);
    }

    /**
     * Return a shallow copy of the loaded breakpoints array.
     * @returns {Array<{label:string, minWidth:number, maxWidth:number, icon:string}>}
     */
    getBreakpoints() { return [...this.#breakpoints]; }

    /**
     * Reset the singleton instance for unit tests.
     * Only active in test environments.
     */
    static resetForTesting() {
        if (import.meta.env?.TEST || process.env.NODE_ENV === 'test') {
            instance = null;
        }
    }

    /**
     * Expose selected private methods for unit testing.
     * Only intended for use in test files.
     *
     * @returns {{ resetToFit:Function, syncActiveButtonVisuals:Function, handleBreakpointClick:Function }}
     */
    static _test() {
        if (!instance) {
            instance = new BreakpointManager([]);
        }
        return {
            resetToFit: instance.#resetToFit.bind(instance),
            syncActiveButtonVisuals: instance.#syncActiveButtonVisuals.bind(instance),
            handleBreakpointClick: instance.#handleBreakpointClick.bind(instance)
        };
    }
}

export default BreakpointManager;
