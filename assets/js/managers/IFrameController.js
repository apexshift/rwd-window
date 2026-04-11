import config from '../../../config.json' with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import UIManager from './UIManager.js';

/**
 * IFrameController - Singleton
 * Central viewport engine. Decoupled via AppState + EventBus.
 */
let instance = null;

export class IFrameController {
    MIN_WIDTH = 320;
    MAX_WIDTH = 1920;
    MIN_HEIGHT = 640;
    MAX_HEIGHT = 1080;
    
    // ==================== PRIVATE FIELDS ====================
    #defaults = {
        minWidth: config.app.clamping.minWidth || this.MIN_WIDTH,
        maxWidth: config.app.clamping.maxWidth || this.MAX_WIDTH,
        minHeight: config.app.clamping.minHeight || this.MIN_HEIGHT,
        maxHeight: config.app.clamping.maxHeight || this.MAX_HEIGHT,
    };

    #elements = {};
    #debounceTimer = null;   // for the window resize debounce

    UIManager = null;   // public reference to UIManager instance

    // ==================== SINGLETON CONSTRUCTOR ====================
    constructor() {
        if (instance) {
            throw new Error('IFrameController is a singleton. Use IFrameController.getInstance() instead.');
        }

        instance = this;

        // Setup subscriptions early for state reactivity
        this.#setupStateSubscriptions();
        
        // Listen for app manager initialization
        bus.on('app:managers:init', () => this.#initializeManager());
        
        // Listen for app ready to initialize from state
        bus.on('app:ready', () => this.#initializeFromState());
    }

    static getInstance() {
        if (!instance) instance = new IFrameController();
        return instance;
    }

    // ==================== PRIVATE METHODS (All declared here) ====================

    #initializeManager() {
        // Get UIManager instance now that UI is ready
        this.UIManager = UIManager.getInstance();

        // Cache element references from UIManager
        this.#elements.iframe    = this.UIManager.iFrame;
        this.#elements.feedback  = this.UIManager.feedback;

        // Load defaults from config
        this.#defaults = {
            minWidth: config.app.clamping.minWidth || this.MIN_WIDTH,
            maxWidth: config.app.clamping.maxWidth || this.MAX_WIDTH,
            minHeight: config.app.clamping.minHeight || this.MIN_HEIGHT,
            maxHeight: config.app.clamping.maxHeight || this.MAX_HEIGHT,
        };

        // Setup event listeners for user interactions  
        this.#setupEventListeners();
        
        bus.emit('iframeController:ready', {});
    }

    #setupStateSubscriptions() {
        // Central state subscriptions for reactive updates
        bus.on('state:viewportChanged', ({ value }) => this.#applyViewportFromState(value));
        bus.on('state:modeChanged', ({ value }) => this.#applyModeFromState(value));
        bus.on('state:activeBreakpointChanged', ({ value }) => this.#applyBreakpointFromState(value));

        // Handle breakpoint activation
        bus.on('breakpoint:activated', (payload) => {
            const { targetWidth } = payload || {};
            if (typeof targetWidth !== 'number' || isNaN(targetWidth)) return;

            const currentHeight = state.getViewport().height;
            state.updateViewport(targetWidth, currentHeight);
            this.#updateFeedback();
        });

        // Handle user input events
        bus.on('viewport:fit', () => { this.#fitToContainer(); });
        bus.on('input:stepChanged', ({ target, direction, step }) => {  
            this.#handleInputStepChanged(target, direction, step);
        });
        bus.on('input:stepCommit', ({ target }) => this.#handleInputStepCommit(target));
    }

    #initializeFromState() {
        if (!this.UIManager?.viewport) {
            console.warn('[IFrameController] UIManager.viewport not available for initialization');
            return;
        }

        // Always start by fitting to the real available space rather than applying
        // any previously stored (potentially stale) dimensions from state.
        this.#fitToContainer();
    }

    #applyViewportFromState(viewport) {
        if (!this.UIManager?.viewport) return;

        this.UIManager.viewport.style.width = `${viewport.width}px`;
        this.UIManager.viewport.style.height = `${viewport.height}px`;

        if (this.UIManager.widthInput) this.UIManager.widthInput.value = viewport.width;
        if (this.UIManager.heightInput) this.UIManager.heightInput.value = viewport.height;

        this.#updateFeedback();
    }

    #applyModeFromState() {
        this.#updateFeedback();
    }

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
        this.#updateFeedback();
    }

    #debounce(fn, delay = 120) {
        return (...args) => {
            clearTimeout(this.#debounceTimer);
            this.#debounceTimer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    #enableIframePointerEvents(enabled) {
        if (this.#elements.iframe) {
            this.#elements.iframe.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    }

    #setSize(width, height, source = 'manual') {
        const w = state.clampWidth(width);
        const h = state.clampHeight(height);

        state.updateViewport(w, h);

        if (source === 'manual' || source === 'drag') {
            state.setMode('manual');
            if (state.getActiveBreakpoint()) state.setActiveBreakpoint(null);
        }

        this.#updateFeedback();
    }

    #updateFeedback() {
        if (!this.#elements.feedback) return;

        const mode = state.getMode();
        const activeBp = state.getActiveBreakpoint();
        const text = mode === 'fit'
            ? 'Fit to Container'
            : (activeBp ? `${activeBp.label}${activeBp.isMinMode ? ' (Min)' : ''}` : 'Custom');

        this.#elements.feedback.textContent = text;
    }

    #fitToContainer() {
        if (!this.UIManager?.appWindow) return;

        const rect = this.UIManager.appWindow.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);

        state.setMode('fit');
        state.setActiveBreakpoint(null);
        state.updateViewport(width, height);

        this.#clearAllDeviceActiveStates();
        if (this.UIManager?.fitBtn) this.UIManager.fitBtn.classList.add('active');

        this.#updateFeedback();
    }

    #clearAllDeviceActiveStates() {
        if (this.UIManager?.fitBtn) this.UIManager.fitBtn.classList.remove('active');
    }

    #handleInputStepChanged(target, direction, step) {
        const current = state.getViewport();
        if (target === 'width') {
            this.#setSize(current.width + direction * step, current.height, 'manual');
        } else {
            this.#setSize(current.width, current.height + direction * step, 'manual');
        }
    }

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

    #setupEventListeners() {
        // fitBtn click and input blur/Enter are handled by UIManager via EventBus
        // (viewport:fit, input:stepCommit, input:stepChanged)

        // Resize handles
        this.#setupResizeHandles();

        // Window resize
        window.addEventListener('resize', this.#debounce(() => {
            if (state.getMode() === 'fit') this.#fitToContainer();
        }));
    }

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
    static reset() {
        IFrameController.getInstance().#fitToContainer();
    }

    static getCurrentSize() {
        const viewport = state.getViewport();
        return {
            width: viewport.width,
            height: viewport.height,
            mode: state.getMode(),
        };
    }

    static resetForTesting() {
        if (import.meta.env?.TEST || process.env.NODE_ENV === 'test') {
            instance = null;
        }
    }
}

export default IFrameController;