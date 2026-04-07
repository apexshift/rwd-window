/**
 * App - Main orchestrator for RWD Window
 * 
 * Wires together all managers and handles global initialization.
 * Uses the new core (EventBus + AppState) and provides user feedback on errors.
 * 
 * @since 0.1.0
 */
import viewportConfig from '../../config/viewport-config.json' with {type: "json"};

import { bus } from './core/EventBus.js';
import { state } from './core/AppState.js';

import LocalLoader from './managers/LocalLoader.js';
import IFrameController from './managers/IFrameController.js';
import BreakpointManager from './managers/BreakpointManager.js';

import { showError, showSuccess } from './Utils.js';

export class App {
  static async init() {
    console.log('RWD Window initializing with new core infrastructure...');

    try {
      // Instantiate all singletons
      const localLoader = LocalLoader;
      const iframeController = IFrameController;
      const breakpointManager = BreakpointManager;

      // Setup demo selector
      const selectEl = document.getElementById('file-loader');
      if (selectEl) {
        localLoader.populateSelect(selectEl);
        selectEl.addEventListener('change', (e) => {
          localLoader.handleDemoChange(e.target.value);
        });
      }

      // Initial state from viewport-config.json (with fallback)
      const initialWidth = viewportConfig.initialViewport?.width || 1920;
      const initialHeight = viewportConfig.initialViewport?.height || 1080;

      state.setCurrentDemo(selectEl?.value || '');
      state.updateViewport(initialWidth, initialHeight);   // This now respects clamping automatically
      state.setMode('fit');

      // Signal that everything is ready → managers initialize (dynamic buttons, etc.)
      bus.emit('app:ready');

      console.log('✅ Core infrastructure initialized successfully');
      console.log(`   • LocalLoader ready (${localLoader.getFiles()?.length || 0} demos)`);
      console.log(`   • IFrameController ready`);
      console.log(`   • BreakpointManager ready (${breakpointManager.getBreakpoints()?.length || 0} breakpoints)`);
      console.log(`   • Clamping: ${JSON.stringify(state.getClamping())}`);

      showSuccess('RWD window is ready');

    } catch (err) {
      console.error('App initialization failed:', err);
      
      // User-friendly error toast
      showError(`Failed to initialize RWD Window: ${err.message || 'Unknown error'}`);
      
      bus.emit('app:error', { message: 'Failed to initialize', error: err });
    }

    // Global handler for config errors (from BreakpointManager, etc.)
    bus.on('config:error', ({ type, message }) => {
      showError(`Configuration Error (${type}): ${message}`);
    });
  }
}