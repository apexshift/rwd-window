import LocalLoader from "./LocalLoader.js";

/**
 * IFrameResizeController - Singleton
 * 
 * The central engine for the RWD Window viewport preview tool.
 * Only one instance can exist. Use IFrameResizeController.getInstance() to access it.
 * 
 * @since 0.0.1-beta
 */

let instance = null;

export default class IFrameResizeController {
  // ==================== DEFAULTS ====================
  #defaults = {
    minWidth: 320,
    maxWidth: 1920,
    minHeight: 640,
    maxHeight: 1080,
  };

  // ==================== STATE ====================
  #state = {
    mode: 'fit',                    // 'fit' | 'device'
    activeButton: null,
    isSecondClick: false,
    currentWidth: null,
    currentHeight: null,
  };

  #isDragging = false;

  // ==================== DOM REFERENCES ====================
  #elements = {
    app_window: null,
    viewport: null,
    iframe: null,
    feedback: null,
    widthInput: null,
    heightInput: null,
    resetBtn: null,
    fitBtn: null,
    deviceButtons: null,
    resizeHandles: { left: null, right: null, bottom: null },
    fileSelector: null,
  };

  #files;

  // ==================== PRIVATE CONSTRUCTOR ====================
  constructor() {
    if (instance) {
      throw new Error('IFrameResizeController is a singleton. Use IFrameResizeController.getInstance() instead.');
    }
    this.#collectElements();
    this.#parseLocalFiles();
    this.#initIFrameSrc(this.#elements.fileSelector.value);
    this.#setupEventListeners();
    this.#initializeState();
    instance = this;
  }

  // ==================== SINGLETON ACCESS ====================
  static getInstance() {
    if (!instance) {
      instance = new IFrameResizeController();
    }
    return instance;
  }

  // ==================== DOM COLLECTION ====================
  #collectElements() {
    this.#elements.app_window = document.querySelector('.app__window__view');
    this.#elements.viewport = document.querySelector('.viewport');
    this.#elements.iframe = document.getElementById('viewport-target');
    this.#elements.feedback = document.querySelector('.app__masthead-feedback');
    this.#elements.widthInput = document.getElementById('width-control');
    this.#elements.heightInput = document.getElementById('height-control');
    this.#elements.resetBtn = document.querySelector('[data-mode="reset"]');
    this.#elements.fitBtn = document.querySelector('[data-mode="fit"]');
    
    this.#elements.deviceButtons = document.querySelectorAll(
      '.controls-group button[data-mode]:not([data-mode="fit"]):not([data-mode="reset"])'
    );

    this.#elements.fileSelector = document.querySelector('#file-loader');

    this.#elements.resizeHandles.left   = document.querySelector('.viewport__rs.left');
    this.#elements.resizeHandles.right  = document.querySelector('.viewport__rs.right');
    this.#elements.resizeHandles.bottom = document.querySelector('.viewport__rs.bottom');

    if (!this.#elements.app_window || !this.#elements.viewport || !this.#elements.iframe) {
      throw new Error('Critical elements missing: app_window_view or viewport or iframe');
    }
  }

  #parseLocalFiles() {
    const loader = LocalLoader.getInstance();

    this.#files = loader.getFiles();

    this.#populateFileSelector();
  }

  #populateFileSelector() {
    if(!this.#files.length) {
      console.warn('File loader config is empty.');
      return;
    }

    this.#elements.fileSelector.innerHTML = this.#files.map(file => `<option value="${file.value}" title="${file.value}">${file.label}</option>`).join('');
  }

  #initIFrameSrc(url) {
    if(typeof url !== "string") {
      console.warn(`@param[url] must be typeof string, got ${typeof url}`);
      return;
    }
    this.#elements.iframe.src = url;
  }

  // ==================== DEBOUNCE ====================
  #debounce(fn, delay = 16) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ==================== IFRAME POINTER EVENTS FIX ====================
  #enableIframePointerEvents(enabled) {
    if (this.#elements.iframe) {
      this.#elements.iframe.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  // ==================== INITIALIZATION ====================
  #initializeState() {
    this.#state.mode = 'fit';
    this.#fitToContainer();
  }

  // ==================== CORE SIZE LOGIC ====================
  #setSize(width, height, source = 'manual') {
    const w = Math.max(this.#defaults.minWidth, Math.min(this.#defaults.maxWidth, Math.floor(width)));
    
    let h = height;
    if (h == null || isNaN(h)) {
      h = this.#state.currentHeight || this.#defaults.minHeight;
    } else {
      h = Math.max(this.#defaults.minHeight, Math.min(this.#defaults.maxHeight, Math.floor(h)));
    }

    this.#elements.viewport.style.width = `${w}px`;
    this.#elements.viewport.style.height = `${h}px`;

    this.#state.currentWidth = w;
    this.#state.currentHeight = h;

    this.#elements.widthInput.value = w;
    this.#elements.heightInput.value = h;

    this.#updateFeedback();

    if (source === 'manual' || source === 'drag') {
      this.#clearAllDeviceActiveStates();
    }
  }

  #updateFeedback() {
    let text = this.#state.mode === 'fit' 
      ? 'Fit to Container' 
      : (this.#state.activeButton?.dataset.mode || 'Custom');

    if (this.#state.isSecondClick && this.#state.mode === 'device') {
      text += ' (Min)';
    }

    this.#elements.feedback.textContent = text;
  }

  #fitToContainer() {
    const rect = this.#elements.app_window.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    this.#state.mode = 'fit';
    this.#state.activeButton = this.#elements.fitBtn;
    this.#state.isSecondClick = false;

    this.#setSize(width, height, 'fit');

    this.#clearAllDeviceActiveStates();
    if (this.#elements.fitBtn) this.#elements.fitBtn.classList.add('active');
  }

  #handleDeviceButtonClick(button) {
    const isSame = this.#state.activeButton === button;
    const minW = parseInt(button.dataset.minWidth) || this.#defaults.minWidth;
    const maxW = parseInt(button.dataset.maxWidth) || this.#defaults.maxWidth;

    if (isSame) {
      this.#state.isSecondClick = !this.#state.isSecondClick;
    } else {
      this.#state.isSecondClick = false;
      this.#state.activeButton = button;
      this.#state.mode = 'device';
    }

    const targetWidth = this.#state.isSecondClick ? minW : maxW;

    // Only change width, preserve current height
    this.#setSize(targetWidth, this.#state.currentHeight, 'device');

    this.#clearAllDeviceActiveStates();
    button.classList.add('active');
    if (this.#elements.fitBtn) this.#elements.fitBtn.classList.remove('active');
  }

  #clearAllDeviceActiveStates() {
    this.#elements.deviceButtons.forEach(btn => btn.classList.remove('active'));
  }

  // ==================== EVENT SETUP ====================
  #setupEventListeners() {
    // Buttons
    this.#elements.resetBtn?.addEventListener('click', () => this.#fitToContainer());
    this.#elements.fitBtn?.addEventListener('click', () => this.#fitToContainer());

    this.#elements.deviceButtons.forEach(btn => {
      btn.addEventListener('click', () => this.#handleDeviceButtonClick(btn));
    });

    // ==================== INPUT HANDLING (Blur + Enter) ====================
    this.#elements.widthInput.addEventListener('blur', () => {
      let val = this.#elements.widthInput.value.trim();
      if (val === '-') {
        this.#fitToContainer();
        return;
      }
      let width = parseInt(val);
      if (isNaN(width)) {
        this.#elements.widthInput.value = this.#state.currentWidth;
        return;
      }
      this.#setSize(width, this.#state.currentHeight, 'manual');
    });

    this.#elements.widthInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.#elements.widthInput.blur();
    });

    this.#elements.heightInput.addEventListener('blur', () => {
      let val = this.#elements.heightInput.value.trim();
      if (val === '-') {
        const fullH = Math.floor(this.#elements.app_window.getBoundingClientRect().height);
        this.#setSize(this.#state.currentWidth, fullH, 'manual');
        return;
      }
      let height = parseInt(val);
      if (isNaN(height)) {
        this.#elements.heightInput.value = this.#state.currentHeight;
        return;
      }
      this.#setSize(this.#state.currentWidth, height, 'manual');
    });

    this.#elements.heightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.#elements.heightInput.blur();
    });

    // Resize handles
    this.#setupResizeHandles();

    // File Selector
    this.#elements.fileSelector.addEventListener('change', e => {
      this.#elements.iframe.src = e.target.value;
    })

    // Window resize
    window.addEventListener('resize', this.#debounce(() => {
      if (this.#state.mode === 'fit') this.#fitToContainer();
    }, 120));
  }

  // ==================== RESIZE HANDLES – SMOOTH + VISUAL FEEDBACK ====================
  #setupResizeHandles() {
    const { left, right, bottom } = this.#elements.resizeHandles;

    const startHorizontal = (e, isLeft) => {
      e.preventDefault();
      this.#isDragging = true;
      this.#enableIframePointerEvents(false);
      this.#elements.viewport.classList.add('is-dragging');

      const startX = e.clientX;
      const startWidth = this.#state.currentWidth;

      let rafId = null;

      const onMove = (ev) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = ev.clientX - startX;
          const newWidth = isLeft ? startWidth - delta * 2 : startWidth + delta * 2;
          this.#setSize(newWidth, this.#state.currentHeight, 'drag');
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
      const startHeight = this.#state.currentHeight;

      let rafId = null;

      const onMove = (ev) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = ev.clientY - startY;
          const newHeight = startHeight + delta;
          this.#setSize(this.#state.currentWidth, newHeight, 'drag');
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

    // Double-click any handle resets to fit
    [left, right, bottom].forEach(handle => {
      handle?.addEventListener('dblclick', () => this.#fitToContainer());
    });
  }

  // ==================== PUBLIC API ====================
  static reset() {
    IFrameResizeController.getInstance().#fitToContainer();
  }

  static getCurrentSize() {
    const inst = IFrameResizeController.getInstance();
    return {
      width: inst.#state.currentWidth,
      height: inst.#state.currentHeight,
      mode: inst.#state.mode,
      isMinMode: inst.#state.isSecondClick,
    };
  }
}