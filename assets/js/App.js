/**
 * App - Main orchestrator for RWD Window
 * 
 * Wires together all managers and handles global initialization.
 * Uses the new core (EventBus + AppState) and provides user feedback on errors.
 * 
 * @since 0.1.0
 */
import config from '../../config.json' with {type: "json"};
import { showError, showSuccess } from './Utils.js';

import { bus } from './core/EventBus.js';
import { state } from './core/AppState.js';
import { UIFactory } from './core/UIFactory.js';

import LocalLoader from './managers/LocalLoader.js';
import BreakpointManager from './managers/BreakpointManager.js';
import KeyboardManager from './managers/KeyboardManager.js';
import IFrameController from './managers/IFrameController.js';

export class App {
  #mastheadWrapper;
  #controlContainers = [
    'fitContainer',
    'devices',
    'dimensions',
    'loader',
    'help'
  ];
  #uiControls = {
    fitContainerBtn: null,
    deviceBtns: null,
    widthInput: null,
    heightInput: null,
    fileSelect: null,
    helpBtn: null,
    feebackLabel: null,
    viewport: null,
    iframe: null,
    resizeHandles: {
      left: null,
      right: null,
      bottom: null
    },
  };

  #initUI() {
    this.#mastheadWrapper = UIFactory.getWrapper('.masthead__controls');
    
    // Create initial UI
    this.#controlContainers.forEach(container => {
      let node = UIFactory.createControlsContainer(container)
      let btn;

      switch(node.id) {
        case "fitContainer": 
          btn = UIFactory.createFitToContainerButton(config.ui_controls.fitToContainer.label, config.ui_controls.fitToContainer.icon);
          node.appendChild(btn);
          this.#uiControls.fitContainerBtn = btn;
          break;
        case "devices": 
          // handled by BreakpointManager

          break;
        case "dimensions":
          // needs to be implemented in UIFactory
          let input = UIFactory.createControlWithIncrement('W', 'width-control');
          node.appendChild(input);
          this.#uiControls.widthInput = input;
          input = UIFactory.createControlWithIncrement('H', 'height-control', false);
          node.appendChild(input);
          this.#uiControls.heightInput = input;

          break;
        case "loader":
          // needs to be implemented in UIFactory
          let select = UIFactory.createSelectControl('Load', 'file-loader');
          node.appendChild(select);
          this.#uiControls.fileSelect = select;
          break;
        case "help":
          btn = UIFactory.createHelpButton(config.ui_controls.help.label, config.ui_controls.help.icon);
          node.appendChild(btn);
          this.#uiControls.helpBtn = btn;
          break;
      }

      this.#mastheadWrapper.appendChild(node);
    });

    console.log(this.#uiControls);
  }

  async init() {
    console.log('RWD Window initializsing...');

    this.#initUI();

    try {
      console.log( this.#uiControls );
      // Instantiate all singletons
      const localLoader = LocalLoader.getInstance();
      const breakpointManager = BreakpointManager.getInstance();
      const keyboardManager = KeyboardManager.getInstance();
      const iframeController = IFrameController.getInstance();


      // Setup demo selector
      const selectEl = document.getElementById('file-loader');
      if (selectEl) {
        localLoader.populateSelect(selectEl);
        selectEl.addEventListener('change', (e) => {
          localLoader.handleDemoChange(e.target.value);
        });
      }

      // Initial state from config.json (with fallback)
      const initialWidth = config.app.initialViewport?.width || 1920;
      const initialHeight = config.app.initialViewport?.height || 1080;

      state.setCurrentDemo(selectEl?.value || '');
      state.updateViewport(initialWidth, initialHeight);   // This now respects clamping automatically
      state.setMode('fit');

      // Signal that everything is ready → managers initialize (dynamic buttons, etc.)
      bus.emit('app:ready');

      console.log('✅ Core infrastructure initialized successfully');
      console.log(`   • UI ready`);
      console.log(`   • LocalLoader ready (${localLoader.getFiles()?.length || 0} demos)`);
      console.log(`   • IFrameController ready`);
      console.log(`   • BreakpointManager ready (${breakpointManager.getBreakpoints()?.length || 0} breakpoints)`);
      console.log(`   • Clamping: ${JSON.stringify(state.getClamping())}`);

      showSuccess('RWD window is ready');

    } catch (err) {
      console.error('App initialization failed:', err);
      showError(`Failed to initialize RWD Window: ${err.message || 'Unknown error'}`, {duration: 5000});
      bus.emit('app:error', { message: 'Failed to initialize', error: err });
    }

    // Global handler for config errors (from BreakpointManager, etc.)
    bus.on('config:error', ({ type, message }) => {
      showError(`Configuration Error (${type}): ${message}`, {duration: 5000});
    });

    // Wire help button using EventBus
    const helpBtn = document.getElementById("keyboard");
    if(helpBtn) {
      helpBtn.addEventListener('click', () => { bus.emit('ui:helpClicked'); });
    }
  }
}