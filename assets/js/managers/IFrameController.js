/**
 * @module IFrameController
 * @description Singleton viewport engine for RWD Window.
 *
 * Owns all iframe/viewport sizing logic. Decoupled from other modules via
 * AppState and EventBus — it reads dimensions from state and writes back via
 * `state.updateViewport()`. The only direct DOM touches are style assignments
 * driven by `state:viewportChanged`.
 *
 * Initialization sequence:
 * 1. Constructor wires up state subscriptions immediately.
 * 2. `app:managers:init` → `#initializeManager()` caches UIManager + elements.
 * 3. `app:ready` → `#initializeFromState()` measures the container and fits.
 */
import config from '../../../config.json' with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import UIManager from './UIManager.js';
import { showToast } from '../Utils.js';

let instance = null;

export class IFrameController {
    /** @type {number} Absolute minimum viewport width. */
    MIN_WIDTH = 320;
    /** @type {number} Absolute maximum viewport width. */
    MAX_WIDTH = 1920;
    /** @type {number} Absolute minimum viewport height. */
    MIN_HEIGHT = 640;
    /** @type {number} Absolute maximum viewport height. */
    MAX_HEIGHT = 1080;

    // ==================== PRIVATE FIELDS ====================

    /**
     * @private
     * @type {{ minWidth:number, maxWidth:number, minHeight:number, maxHeight:number }}
     */
    #defaults = {
        minWidth: config.app.clamping.minWidth || this.MIN_WIDTH,
        maxWidth: config.app.clamping.maxWidth || this.MAX_WIDTH,
        minHeight: config.app.clamping.minHeight || this.MIN_HEIGHT,
        maxHeight: config.app.clamping.maxHeight || this.MAX_HEIGHT,
    };

    /** @private @type {Object<string, Element|null>} Cached DOM element references. */
    #elements = {};

    /** @private @type {ReturnType<typeof setTimeout>|null} Debounce timer for window resize. */
    #debounceTimer = null;

    /** @type {UIManager|null} Public reference to the UIManager singleton. */
    UIManager = null;

    // ==================== SINGLETON CONSTRUCTOR ====================

    constructor() {
        if (instance) {
            throw new Error('IFrameController is a singleton. Use IFrameController.getInstance() instead.');
        }

        instance = this;

        // Wire up state subscriptions before managers initialize
        this.#setupStateSubscriptions();

        bus.on('app:managers:init', () => this.#initializeManager());
        bus.on('app:ready', () => this.#initializeFromState());
    }

    /**
     * Return the shared IFrameController instance, creating it on first call.
     * @returns {IFrameController}
     */
    static getInstance() {
        if (!instance) instance = new IFrameController();
        return instance;
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Cache UIManager reference + DOM elements, then set up event listeners.
     * Emits `iframeController:ready` when complete.
     * @private
     */
    #initializeManager() {
        this.UIManager = UIManager.getInstance();
        this.#elements.iframe = this.UIManager.iFrame;

        this.#defaults = {
            minWidth: config.app.clamping.minWidth || this.MIN_WIDTH,
            maxWidth: config.app.clamping.maxWidth || this.MAX_WIDTH,
            minHeight: config.app.clamping.minHeight || this.MIN_HEIGHT,
            maxHeight: config.app.clamping.maxHeight || this.MAX_HEIGHT,
        };

        this.#setupEventListeners();

        bus.emit('iframeController:ready', {});
    }

    /**
     * Subscribe to bus and state events that drive viewport updates.
     * Called immediately from the constructor so state reactivity is available
     * before `app:managers:init` fires.
     * @private
     */
    #setupStateSubscriptions() {
        bus.on('state:viewportChanged', ({ value }) => this.#applyViewportFromState(value));
        bus.on('state:activeBreakpointChanged', ({ value }) => this.#applyBreakpointFromState(value));

        // Breakpoint activated — update viewport width
        bus.on('breakpoint:activated', (payload) => {
            const { targetWidth } = payload || {};
            if (typeof targetWidth !== 'number' || isNaN(targetWidth)) return;
            state.updateViewport(targetWidth, state.getViewport().height);
        });

        bus.on('viewport:fit', () => { this.#fitToContainer(); });
        bus.on('input:stepChanged', ({ target, direction, step }) => {
            this.#handleInputStepChanged(target, direction, step);
        });
        bus.on('input:stepCommit', ({ target }) => this.#handleInputStepCommit(target));
    }

    /**
     * Apply the initial viewport on startup, respecting any persisted state.
     *
     * - `fit` mode (or no persistence): measure the container and fit as before.
     * - `manual` / `device` mode: measure container ceilings first so clamping is
     *   correct, then re-apply the persisted viewport dimensions directly.
     *
     * The module docstring note "3. `app:ready` → measures the container and fits"
     * remains true for the default (fit) path.
     * @private
     */
    #initializeFromState() {
        if (!this.UIManager?.viewport) {
            console.warn('[IFrameController] UIManager.viewport not available for initialization');
            return;
        }

        const mode = state.getMode();

        if (mode !== 'fit') {
            // Update clamping ceilings from the live container before applying
            // persisted dimensions so values are bounded correctly.
            if (this.UIManager.appWindow) {
                const rect = this.UIManager.appWindow.getBoundingClientRect();
                state.setContainerWidth(Math.floor(rect.width));
                state.setContainerHeight(Math.floor(rect.height));
            }

            // Remove the fit-button active class that UIFactory adds by default.
            if (this.UIManager?.fitBtn) this.UIManager.fitBtn.classList.remove('active');

            // Re-apply the persisted viewport (clamped to live container bounds).
            const viewport = state.getViewport();
            state.updateViewport(viewport.width, viewport.height);
            return;
        }

        this.#fitToContainer({ silent: true });
    }

    /**
     * Apply a viewport object from state to the DOM (size inputs + viewport element).
     * No-ops if UIManager is not yet initialized.
     *
     * @private
     * @param {{ width:number, height:number }} viewport
     */
    #applyViewportFromState(viewport) {
        if (!this.UIManager?.viewport) return;

        this.UIManager.viewport.style.width = `${viewport.width}px`;
        this.UIManager.viewport.style.height = `${viewport.height}px`;

        if (this.UIManager.widthInput) this.UIManager.widthInput.value = viewport.width;
        if (this.UIManager.heightInput) this.UIManager.heightInput.value = viewport.height;
    }

    /**
     * Resolve the target width from a breakpoint state change and apply it,
     * showing a toast with the breakpoint label (and a '(Min)' suffix when in
     * min-width mode).
     *
     * @private
     * @param {object|null} breakpointData
     */
    #applyBreakpointFromState(breakpointData) {
        if (!breakpointData) return;

        const { breakpoint, isMinMode, targetWidth } = breakpointData;
        let finalWidth = targetWidth;

        if (typeof finalWidth !== 'number' || isNaN(finalWidth)) {
            finalWidth = isMinMode ? breakpoint?.minWidth : breakpoint?.maxWidth;
        }

        if (typeof finalWidth !== 'number' || isNaN(finalWidth)) {
            console.warn('[IFrameController] Could not determine valid width from breakpoint data');
            return;
        }

        const currentHeight = state.getViewport().height || this.#defaults.minHeight;
        state.updateViewport(finalWidth, currentHeight);

        const label = breakpointData.label ?? breakpoint?.label;
        const suffix = isMinMode ? ' (Min)' : '';
        if (label) showToast(`${label}${suffix}`, { type: 'info', duration: 1500 });
    }

    /**
     * Return a debounced version of `fn` that resets on every call within `delay` ms.
     *
     * @private
     * @param {Function} fn
     * @param {number}   [delay=120]
     * @returns {Function}
     */
    #debounce(fn, delay = 120) {
        return (...args) => {
            clearTimeout(this.#debounceTimer);
            this.#debounceTimer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Enable or disable pointer events on the iframe.
     * Pointer events are disabled during drag operations to prevent the iframe
     * from absorbing mouse events.
     *
     * @private
     * @param {boolean} enabled
     */
    #enableIframePointerEvents(enabled) {
        if (this.#elements.iframe) {
            this.#elements.iframe.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    }

    /**
     * Clamp and apply a new width and/or height to state.
     * Switches mode to 'manual' and clears any active breakpoint when source
     * is 'manual' or 'drag'.
     *
     * @private
     * @param {number} width
     * @param {number} height
     * @param {'manual'|'drag'|string} [source='manual']
     */
    #setSize(width, height, source = 'manual') {
        const w = state.clampWidth(width);
        const h = state.clampHeight(height);

        state.updateViewport(w, h);

        if (source === 'manual' || source === 'drag') {
            state.setMode('manual');
            if (state.getActiveBreakpoint()) state.setActiveBreakpoint(null);
        }
    }

    /**
     * Measure `.app__window__view`, update the clamping ceilings in state, then
     * fit the viewport to fill all available space.
     *
     * Emits a "Fit to Container" toast unless `silent` is true (startup /
     * window-resize fits are silent).
     *
     * @private
     * @param {object}  [options={}]
     * @param {boolean} [options.silent=false] - Suppress the toast notification.
     */
    #fitToContainer({ silent = false } = {}) {
        if (!this.UIManager?.appWindow) return;

        const rect = this.UIManager.appWindow.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        // Keep clamp ceilings in sync with the real available space.
        state.setContainerWidth(width);
        state.setContainerHeight(height);

        state.setMode('fit');
        state.setActiveBreakpoint(null);
        state.updateViewport(width, height);

        this.#clearAllDeviceActiveStates();
        if (this.UIManager?.fitBtn) this.UIManager.fitBtn.classList.add('active');

        if (!silent) showToast('Fit to Container', { type: 'info', duration: 1200 });
    }

    /**
     * Remove the `.active` class from the fit button.
     * Called before applying a new active state to ensure mutual exclusivity.
     * @private
     */
    #clearAllDeviceActiveStates() {
        if (this.UIManager?.fitBtn) this.UIManager.fitBtn.classList.remove('active');
    }

    /**
     * Handle an `input:stepChanged` event by nudging the viewport by `step`
     * pixels in the given direction.
     *
     * @private
     * @param {'width'|'height'} target
     * @param {1|-1}             direction
     * @param {number}           step
     */
    #handleInputStepChanged(target, direction, step) {
        const current = state.getViewport();
        if (target === 'width') {
            this.#setSize(current.width + direction * step, current.height, 'manual');
        } else {
            this.#setSize(current.width, current.height + direction * step, 'manual');
        }
    }

    /**
     * Handle an `input:stepCommit` event by reading the raw input value and
     * applying it. '-' is treated as a fit-to-container shortcut.
     *
     * @private
     * @param {'width'|'height'} target
     */
    #handleInputStepCommit(target) {
        const inputEl = target === 'width'
            ? this.UIManager.widthInput
            : this.UIManager.heightInput;

        if (!inputEl) return;

        let val = inputEl.value.trim();
        if (val === '-') {
            this.#fitToContainer();
            return;
        }

        let num = parseInt(val);
        if (isNaN(num)) {
            inputEl.value = target === 'width'
                ? state.getViewport().width
                : state.getViewport().height;
            return;
        }

        if (target === 'width') {
            this.#setSize(num, state.getViewport().height, 'manual');
        } else {
            this.#setSize(state.getViewport().width, num, 'manual');
        }
    }

    /**
     * Attach resize handle mouse events and the debounced window resize handler.
     * @private
     */
    #setupEventListeners() {
        this.#setupResizeHandles();

        // Window resize — silent, not a user-initiated fit
        window.addEventListener('resize', this.#debounce(() => {
            if (state.getMode() === 'fit') this.#fitToContainer({ silent: true });
        }));
    }

    /**
     * Wire mousedown drag behaviour onto the left, right, and bottom resize
     * handles. Double-clicking any handle triggers a fit-to-container.
     *
     * Horizontal handles multiply delta by 2 so the visual centre stays fixed.
     * Pointer events on the iframe are disabled during the drag to prevent the
     * iframe from absorbing mouse events.
     *
     * @private
     */
    #setupResizeHandles() {
        const { left, right, bottom } = this.UIManager.resizeHandles || {};
        const viewport = this.UIManager.viewport;

        const startDrag = (e, onMove) => {
            e.preventDefault();
            this.#enableIframePointerEvents(false);
            viewport?.classList.add('is-dragging');

            let rafId = null;

            const onMouseMove = (moveEvent) => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => onMove(moveEvent));
            };
            const onMouseUp = () => {
                this.#enableIframePointerEvents(true);
                viewport?.classList.remove('is-dragging');
                if (rafId) cancelAnimationFrame(rafId);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        right?.addEventListener('mousedown', (e) => {
            const startX = e.clientX;
            const startWidth = state.getViewport().width;
            startDrag(e, (moveEvent) => {
                this.#setSize(startWidth + (moveEvent.clientX - startX) * 2, state.getViewport().height, 'drag');
            });
        });

        left?.addEventListener('mousedown', (e) => {
            const startX = e.clientX;
            const startWidth = state.getViewport().width;
            startDrag(e, (moveEvent) => {
                this.#setSize(startWidth - (moveEvent.clientX - startX) * 2, state.getViewport().height, 'drag');
            });
        });

        bottom?.addEventListener('mousedown', (e) => {
            const startY = e.clientY;
            const startHeight = state.getViewport().height;
            startDrag(e, (moveEvent) => {
                this.#setSize(state.getViewport().width, startHeight + (moveEvent.clientY - startY), 'drag');
            });
        });

        [left, right, bottom].forEach(handle => {
            handle?.addEventListener('dblclick', () => this.#fitToContainer());
        });
    }

    // ==================== PUBLIC API ====================

    /**
     * Fit the viewport to the container. Convenience wrapper for external callers.
     */
    static reset() {
        IFrameController.getInstance().#fitToContainer();
    }

    /**
     * Return the current viewport dimensions and mode from state.
     * @returns {{ width:number, height:number, mode:string }}
     */
    static getCurrentSize() {
        const viewport = state.getViewport();
        return {
            width: viewport.width,
            height: viewport.height,
            mode: state.getMode(),
        };
    }

    /**
     * Reset the singleton instance for unit tests.
     * Only active in test environments (NODE_ENV=test or import.meta.env.TEST).
     */
    static resetForTesting() {
        if (import.meta.env?.TEST || process.env.NODE_ENV === 'test') {
            instance = null;
        }
    }
}

export default IFrameController;
