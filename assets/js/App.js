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
import LocalLoader from './managers/LocalLoader.js';
import BreakpointManager from './managers/BreakpointManager.js';
import KeyboardManager from './managers/KeyboardManager.js';
import IFrameController from './managers/IFrameController.js';
import UIManager from './managers/UIManager.js';

import { showError, showSuccess } from './Utils.js';

export class App {
  #managerStatus = {
    ui: false,
    breakpoints: false,
    iframeController: false,
    localLoader: false,
    keyboard: false
  };

  init() {
    try {
      // === PHASE 1: Setup completion listeners ===
      bus.on('ui:ready', () => this.#onUIReady());
      bus.on('breakpoints:ready', () => this.#onManagerReady('breakpoints'));
      bus.on('iframeController:ready', () => this.#onManagerReady('iframeController'));
      bus.on('localLoader:ready', () => this.#onManagerReady('localLoader'));
      bus.on('keyboardManager:ready', () => this.#onManagerReady('keyboard'));

      // Handle errors
      bus.on('config:error', ({ type, message }) => {
        showError(`Configuration Error (${type}): ${message}`, { duration: 5000 });
      });
      bus.on('ui:error', ({ message }) => {
        showError(`UI Error: ${message}`, { duration: 5000 });
      });

      // === PHASE 2: Instantiate singletons (they register themselves) ===
      UIManager.getInstance();
      BreakpointManager.getInstance();
      KeyboardManager.getInstance();
      LocalLoader.getInstance();
      IFrameController.getInstance();

      // === PHASE 3: Kick off initialization sequence ===
      bus.emit('app:init', {});
    } catch (err) {
      console.error('App initialization failed:', err);
      showError(`Failed to initialize RWD Window: ${err.message || 'Unknown error'}`, { duration: 5000 });
      bus.emit('app:error', { message: 'Failed to initialize', error: err });
    }
  }

  #onUIReady() {
    this.#managerStatus.ui = true;
    console.log('[App] UI ready');
    
    // Once UI is ready, tell managers they can initialize
    bus.emit('app:managers:init', {});
  }

  #onManagerReady(managerName) {
    this.#managerStatus[managerName] = true;
    console.log(`[App] ${managerName} ready`);

    // Check if all managers are ready
    if (this.#allManagersReady()) {
      this.#activateApp();
    }
  }

  #allManagersReady() {
    return (
      this.#managerStatus.ui &&
      this.#managerStatus.breakpoints &&
      this.#managerStatus.iframeController &&
      this.#managerStatus.localLoader &&
      this.#managerStatus.keyboard
    );
  }

  #activateApp() {
    console.log('[App] All systems ready, activating application');

    // === PHASE 4: Set initial mode — IFrameController will measure the real container on app:ready ===
    state.setMode('fit');

    // === PHASE 5: Signal full readiness → managers do full initialization ===
    bus.emit('app:ready', {});

    showSuccess('RWD window is ready');
  }
}