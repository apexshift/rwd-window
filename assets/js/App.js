/**
 * @module App
 * @description Main orchestrator for RWD Window.
 *
 * Wires together all manager singletons and drives the five-phase
 * initialization sequence:
 *
 * 1. Register completion listeners on the EventBus.
 * 2. Instantiate all manager singletons (they self-register via the bus).
 * 3. Emit `app:init` to start UIManager's DOM construction.
 * 4. Once all managers have reported ready, set the initial mode.
 * 5. Emit `app:ready` so IFrameController can measure the real container.
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
  /**
   * Tracks which managers have reported ready.
   * @type {{ ui:boolean, breakpoints:boolean, iframeController:boolean, localLoader:boolean, keyboard:boolean }}
   * @private
   */
  #managerStatus = {
    ui: false,
    breakpoints: false,
    iframeController: false,
    localLoader: false,
    keyboard: false
  };

  /**
   * Start the application.
   *
   * Registers bus listeners, instantiates all manager singletons, then emits
   * `app:init` to kick off the initialization sequence. Any uncaught error
   * surfaces as an error toast and an `app:error` bus event.
   */
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

  /**
   * Called when UIManager emits `ui:ready`.
   * Signals all other managers to begin their own initialization.
   * @private
   */
  #onUIReady() {
    this.#managerStatus.ui = true;
    console.log('[App] UI ready');

    // Once UI is ready, tell managers they can initialize
    bus.emit('app:managers:init', {});
  }

  /**
   * Called when any non-UI manager emits its ready event.
   * Once all managers are ready, activates the application.
   *
   * @private
   * @param {'breakpoints'|'iframeController'|'localLoader'|'keyboard'} managerName
   */
  #onManagerReady(managerName) {
    this.#managerStatus[managerName] = true;
    console.log(`[App] ${managerName} ready`);

    if (this.#allManagersReady()) {
      this.#activateApp();
    }
  }

  /**
   * Return true when every manager has reported ready.
   * @private
   * @returns {boolean}
   */
  #allManagersReady() {
    return (
      this.#managerStatus.ui &&
      this.#managerStatus.breakpoints &&
      this.#managerStatus.iframeController &&
      this.#managerStatus.localLoader &&
      this.#managerStatus.keyboard
    );
  }

  /**
   * Final activation step — sets the initial mode then emits `app:ready`
   * so IFrameController can measure the container and set the real dimensions.
   * @private
   */
  #activateApp() {
    console.log('[App] All systems ready, activating application');

    // === PHASE 4: Set initial mode — IFrameController will measure the real container on app:ready ===
    state.setMode('fit');

    // === PHASE 5: Signal full readiness → managers do full initialization ===
    bus.emit('app:ready', {});

    showSuccess('RWD window is ready');
  }
}
