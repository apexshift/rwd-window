/**
 * App - Main orchestrator for RWD Window
 * 
 * Wires together all managers and handles global initialization.
 * Uses the new core (EventBus + AppState) and provides user feedback on errors.
 * 
 * @since 0.1.0
 */
import { bus } from './core/EventBus.js';
import { state } from './core/AppState.js';
import config from '../../config.json' with {type: "json"};

import LocalLoader from './managers/LocalLoader.js';
import BreakpointManager from './managers/BreakpointManager.js';
import KeyboardManager from './managers/KeyboardManager.js';
import IFrameController from './managers/IFrameController.js';
import UIManager from './managers/UIManager.js';

import { showError, showSuccess } from './Utils.js';

export class App {
  async init() {
    try {
      // create UI first
      const UI = UIManager.getInstance();

      // Instantiate all singletons
      const localLoader = LocalLoader.getInstance();
      const breakpointManager = BreakpointManager.getInstance();
      const keyboardManager = KeyboardManager.getInstance();
      const iframeController = IFrameController.getInstance();

      // Initial state from config.json (with fallback)
      const initialWidth = config.app.initialViewport?.width || 1920;
      const initialHeight = config.app.initialViewport?.height || 1080;

      const loaderSelect = UI.fileSelect.querySelector('#file-loader');
      if(loaderSelect) {
        localLoader.populateSelect(loaderSelect);
      }
      
      state.setCurrentDemo(loaderSelect?.value || '');
      state.updateViewport(initialWidth, initialHeight);
      state.setMode('fit');

      // Signal that everything is ready → managers initialize (dynamic buttons, etc.)
      bus.emit('app:ready');
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
  }
}