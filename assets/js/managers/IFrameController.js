import config from '../../../config.json' with {type: "json"};
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import UIManager from './UIManager.js';

/**
 * IFrameController - Singleton
 * 
 * Central viewport engine. Now decoupled via AppState + EventBus.
 * All size/mode changes flow through central state.
 * Your drag, second-click, clamping, fit, and input logic fully preserved.
 * 
 * @since 0.0.1-beta (infrastructure refactor applied)
 */

let instance = null;

export class IFrameController {
  // ==================== DEFAULTS ====================
  #defaults = {
    minWidth: config.app.clamping.minWidth,
    maxWidth: config.app.clamping.maxWidth,
    minHeight: config.app.clamping.minHeight,
    maxHeight: config.app.clamping.maxHeight,
  };

  // ==================== DOM REFERENCES ====================
  #elements = {};

  #isDragging = false;

  #UI = null;

  // ==================== PRIVATE CONSTRUCTOR ====================
  constructor() {
    if (instance) {
      throw new Error('IFrameController is a singleton. Use IFrameController.getInstance() instead.');
    }

    this.#UI = UIManager.getInstance();

    this.#collectElements();
    this.#setupEventListeners();
    this.#initializeFromState();

    instance = this;

    // Subscribe to central state changes (decouples from other managers)
    bus.on('state:viewportChanged', ({ value }) => this.#applyViewportFromState(value));
    bus.on('state:modeChanged', ({ value }) => this.#applyModeFromState(value));
    bus.on('state:activeBreakpointChanged', ({ value }) => this.#applyBreakpointFromState(value));
    // Listen for explicit breakpoint activation from BreakpointManager (this is the important one)
    bus.on('breakpoint:activated', (payload) => {
      const { breakpoint, isMinMode, targetWidth } = payload || {};
      if (typeof targetWidth !== 'number' || isNaN(targetWidth)) return;

      const currentHeight = state.getViewport().height;
      state.updateViewport(targetWidth, currentHeight);
      this.#updateFeedback();
    });
    // Keyboard and other external fit requests
    bus.on('viewport:fit', () => { this.#fitToContainer(); });
    // Advanced width and height inputs
    bus.on('input:stepChanged', ({target, direction, step}) => { this.#handleInputStepChanged(target, direction, step); });
    bus.on('input:stepCommit', ({target}) => { this.#handleInputStepCommit(target); });
  }

  // ==================== SINGLETON ACCESS ====================
  static getInstance() {
    if (!instance) {
      instance = new IFrameController();
    }
    return instance;
  }

  // ==================== DOM COLLECTION ====================
  #collectElements() {

    console.log(this.#UI.Elements);

    this.#elements = { ...this.#elements, ...this.#UI.Elements };

    /* const UI = UIManager.getInstance();
    this.#elements.app_window = document.querySelector('.app__window__view');
    this.#elements.viewport = document.querySelector('.viewport');
    this.#elements.iframe = document.getElementById('viewport-target');
    this.#elements.feedback = document.querySelector('.app__masthead-feedback');


    this.#elements.widthInput = UI.getWidthInput();
    this.#elements.heightInput = UI.getHeightInput();
    this.#elements.fitBtn = UI.fitBtn;
    
    this.#elements.deviceButtons = document.querySelectorAll(
      '.controls-group button[data-mode]:not([data-mode="fit"])'
    );

    this.#elements.fileSelector = document.querySelector('#loader');

    this.#elements.resizeHandles.left   = document.querySelector('.viewport__rs.left');
    this.#elements.resizeHandles.right  = document.querySelector('.viewport__rs.right');
    this.#elements.resizeHandles.bottom = document.querySelector('.viewport__rs.bottom');
    */

    if (!this.#elements.app_window || !this.#elements.viewport || !this.#elements.iframe) {
      throw new Error('Critical elements missing: app_window_view or viewport or iframe');
    }
  }

  // ==================== INITIALIZATION FROM CENTRAL STATE ====================
  #initializeFromState() {
    const initialViewport = state.getViewport();
    this.#applyViewportFromState(initialViewport);
    this.#applyModeFromState(state.getMode());
  }

  #applyViewportFromState(viewport) {
    this.#elements.viewport.style.width = `${viewport.width}px`;
    this.#elements.viewport.style.height = `${viewport.height}px`;

    this.#elements.widthInput.value = viewport.width;
    this.#elements.heightInput.value = viewport.height;

    this.#updateFeedback();
  }

  #applyModeFromState(mode) {
    // Future: handle device mode via activeBreakpoint
    this.#updateFeedback();
  }

  #applyBreakpointFromState(breakpointData) {
    if (!breakpointData) return;

    const { breakpoint, isMinMode, targetWidth } = breakpointData;

    let finalWidth = targetWidth;

    // Fallback logic if targetWidth is missing
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

  // ==================== DEBOUNCE ====================
  #debounce(fn, delay = 16) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ==================== IFRAME POINTER EVENTS ====================
  #enableIframePointerEvents(enabled) {
    if (this.#elements.iframe) {
      this.#elements.iframe.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  // ==================== CORE SIZE LOGIC (now publishes to state) ====================
  #setSize(width, height, source = 'manual') {
    const w = state.clampWidth(width);
    const h = state.clampHeight(height);

    // Update central state → this triggers #applyViewportFromState via subscription
    state.updateViewport(w, h);

    if (source === 'manual' || source === 'drag') {
      state.setMode('manual');
      // Clear active breakpoint when user manually resizes
      if (state.getActiveBreakpoint()) state.setActiveBreakpoint(null);
    }

    this.#updateFeedback();
  }

  #updateFeedback() {
    const mode = state.getMode();
    const activeBp = state.getActiveBreakpoint();
    let text = mode === 'fit' 
      ? 'Fit to Container' 
      : (activeBp?.label || 'Custom');

    // TODO: enhance with second-click / min-mode once BreakpointManager is wired
    this.#elements.feedback.textContent = text;
  }

  #fitToContainer() {
    const rect = this.#elements.app_window.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    state.setMode('fit');
    state.setActiveBreakpoint(null);
    state.updateViewport(width, height);

    this.#clearAllDeviceActiveStates();
    if (this.#elements.fitBtn) this.#elements.fitBtn.classList.add('active');

    this.#updateFeedback();
  }

  #handleDeviceButtonClick(button) {
    // For now (hardcoded buttons): treat as before, but publish to state
    const minW = parseInt(button.dataset.minWidth) || this.#defaults.minWidth;
    const maxW = parseInt(button.dataset.maxWidth) || this.#defaults.maxWidth;

    const isSame = state.getActiveBreakpoint() && 
                   state.getActiveBreakpoint().label === button.dataset.mode;

    const isSecondClick = isSame ? !state.get('isSecondClick') : false; // temporary local flag until full breakpoint manager

    const targetWidth = isSecondClick ? minW : maxW;

    state.setMode('device');
    // In Stage 1 we'll store full breakpoint object
    state.updateViewport(targetWidth, state.getViewport().height);

    this.#clearAllDeviceActiveStates();
    button.classList.add('active');
    if (this.#elements.fitBtn) this.#elements.fitBtn.classList.remove('active');

    // Publish for other components
    bus.emit('device:buttonClicked', { button, isSecondClick });
  }

  #clearAllDeviceActiveStates() {
    this.#elements.deviceButtons.forEach(btn => btn.classList.remove('active'));
    if (this.#elements.fitBtn) this.#elements.fitBtn.classList.remove('active');
  }

  #handleInputStepChanged(target, direction, step) {
    const current = state.getViewport();
    if(target === 'width') {
      this.#setSize(current.width + direction * step, current.height, 'manual');
    } else {
      this.#setSize(current.width, current.height + direction * step, 'manual');
    }
  }

  #handleInputStepCommit(target) {
    const input = target === 'width' ? UIManager.getInstance().widthInput.querySelector('input') : UIManager.getInstance().heightInput.querySelector('input');
    if(!input) return;

    let val = input.value.trim();
    if(val === '-') {
      this.#fitToContainer();
      return;
    }

    let num = parseInt(val);
    if(isNaN(num)) {
      input.value = target === 'width' ? state.getViewport().width : state.getViewport().height;
      return;
    }

    if(target === 'width') {
      this.#setSize(num, state.getViewport().height, 'manual');
    } else {
      this.#setSize(state.getViewport().width, num, 'manual');
    }
  }

  // ==================== EVENT SETUP ====================
  #setupEventListeners() {
    // Fit / Reset
    this.#elements.fitBtn?.addEventListener('click', () => this.#fitToContainer());

    // Device buttons (still hardcoded for now)
    this.#elements.deviceButtons.forEach(btn => {
      btn.addEventListener('click', () => this.#handleDeviceButtonClick(btn));
    });

    // Width / Height inputs (blur + Enter)
    const handleWidthBlur = () => {
      let val = this.#elements.widthInput.value.trim();
      if (val === '-') { this.#fitToContainer(); return; }
      let width = parseInt(val);
      if (isNaN(width)) { this.#elements.widthInput.value = state.getViewport().width; return; }
      this.#setSize(width, state.getViewport().height, 'manual');
    };

    this.#elements.widthInput.addEventListener('blur', handleWidthBlur);
    this.#elements.widthInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.#elements.widthInput.blur(); });

    const handleHeightBlur = () => {
      let val = this.#elements.heightInput.value.trim();
      if (val === '-') {
        const fullH = Math.floor(this.#elements.app_window.getBoundingClientRect().height);
        this.#setSize(state.getViewport().width, fullH, 'manual');
        return;
      }
      let height = parseInt(val);
      if (isNaN(height)) { this.#elements.heightInput.value = state.getViewport().height; return; }
      this.#setSize(state.getViewport().width, height, 'manual');
    };

    this.#elements.heightInput.addEventListener('blur', handleHeightBlur);
    this.#elements.heightInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.#elements.heightInput.blur(); });

    // Resize handles (drag logic unchanged except final size goes through #setSize)
    this.#setupResizeHandles();

    // Window resize (fit behavior)
    window.addEventListener('resize', this.#debounce(() => {
      if (state.getMode() === 'fit') this.#fitToContainer();
    }, 120));
  }

  // ==================== RESIZE HANDLES ====================
  #setupResizeHandles() {
    const { left, right, bottom } = this.#elements.resizeHandles;

    const startHorizontal = (e, isLeft) => {
      e.preventDefault();
      this.#isDragging = true;
      this.#enableIframePointerEvents(false);
      this.#elements.viewport.classList.add('is-dragging');

      const startX = e.clientX;
      const startWidth = state.getViewport().width;

      let rafId = null;

      const onMove = (ev) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = ev.clientX - startX;
          const newWidth = isLeft ? startWidth - delta * 2 : startWidth + delta * 2;
          this.#setSize(newWidth, state.getViewport().height, 'drag');
        });
      };

      const onUp = () => {
        this.#isDragging = false;
        this.#enableIframePointerEvents(true);
        this.#elements.viewport.classList.remove('is-dragging');
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    left?.addEventListener('mousedown', e => startHorizontal(e, true));
    right?.addEventListener('mousedown', e => startHorizontal(e, false));

    bottom?.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.#isDragging = true;
      this.#enableIframePointerEvents(false);
      this.#elements.viewport.classList.add('is-dragging');

      const startY = e.clientY;
      const startHeight = state.getViewport().height;

      let rafId = null;

      const onMove = (ev) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = ev.clientY - startY;
          const newHeight = startHeight + delta;
          this.#setSize(state.getViewport().width, newHeight, 'drag');
        });
      };

      const onUp = () => {
        this.#isDragging = false;
        this.#enableIframePointerEvents(true);
        this.#elements.viewport.classList.remove('is-dragging');
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Double-click resets to fit
    [left, right, bottom].forEach(handle => {
      handle?.addEventListener('dblclick', () => this.#fitToContainer());
    });
  }

  // ==================== PUBLIC API (updated to use central state) ====================
  static reset() {
    IFrameController.getInstance().#fitToContainer();
  }

  static getCurrentSize() {
    const viewport = state.getViewport();
    return {
      width: viewport.width,
      height: viewport.height,
      mode: state.getMode(),
      // isMinMode will come from breakpoint logic in Stage 1
    };
  }

  /**
   * Methods used solely by the tests
   */
  static resetForTesting() {
    if (import.meta.env?.TEST || process.env.MODE_ENV === 'test') {
        instance = null;
    }
  }
}

// Backward compatibility export
export default IFrameController;