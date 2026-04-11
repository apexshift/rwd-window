/**
 * @module AppState
 * @description Reactive application state singleton for RWD Window.
 *
 * All state mutations go through {@link AppState#set}, which performs a deep
 * equality check and emits a `state:<key>Changed` event only when the value
 * actually changes. Clamping boundaries are updated at runtime to reflect the
 * live container dimensions via {@link AppState#setContainerWidth} and
 * {@link AppState#setContainerHeight}.
 */
import { bus } from './EventBus.js';
import config from '../../../config.json' with { type: "json" };

export class AppState {
  static #instance = null;

  /**
   * @private
   * @type {{ viewport: {width:number, height:number}, mode: string, activeBreakpoint: object|null, currentDemo: string }}
   */
  #state = {
    viewport: { width: 1920, height: 1080 },
    mode: 'manual',
    activeBreakpoint: null,
    currentDemo: ''
  };

  /**
   * @private
   * @type {{ minWidth:number, maxWidth:number, minHeight:number, maxHeight:number }}
   */
  #clamping = { ...config.app.clamping };

  /**
   * Return the shared AppState instance, creating it on first call.
   * @returns {AppState}
   */
  static getInstance() {
    if (!AppState.#instance) {
      AppState.#instance = new AppState();
    }
    return AppState.#instance;
  }

  /**
   * Return a shallow copy of the current clamping boundaries.
   * @returns {{ minWidth:number, maxWidth:number, minHeight:number, maxHeight:number }}
   */
  getClamping() {
    return { ...this.#clamping };
  }

  /**
   * Update the maximum width clamp to the live container width.
   * Emits `state:containerWidthChanged` when the value changes.
   * Called by IFrameController whenever the container is measured.
   *
   * @param {number} width - The measured container width in pixels.
   */
  setContainerWidth(width) {
    const clamped = Math.floor(width);
    if (this.#clamping.maxWidth === clamped) return;
    this.#clamping.maxWidth = clamped;
    bus.emit('state:containerWidthChanged', { maxWidth: clamped });
  }

  /**
   * Update the maximum height clamp to the live container height.
   * Emits `state:containerHeightChanged` when the value changes.
   * Called by IFrameController whenever the container is measured.
   *
   * @param {number} height - The measured container height in pixels.
   */
  setContainerHeight(height) {
    const clamped = Math.floor(height);
    if (this.#clamping.maxHeight === clamped) return;
    this.#clamping.maxHeight = clamped;
    bus.emit('state:containerHeightChanged', { maxHeight: clamped });
  }

  /**
   * Clamp a width value to the current [minWidth, maxWidth] range.
   * Non-numeric inputs are replaced with minWidth before clamping.
   *
   * @param {number} width
   * @returns {number} The clamped integer width.
   */
  clampWidth(width) {
    if(typeof width !== "number") {
      width = this.#clamping.minWidth;
    }

    return Math.max(this.#clamping.minWidth || 320, Math.min(this.#clamping.maxWidth || 1920, Math.floor(width || 0)));
  }

  /**
   * Clamp a height value to the current [minHeight, maxHeight] range.
   * Non-numeric inputs are replaced with minHeight before clamping.
   *
   * @param {number} height
   * @returns {number} The clamped integer height.
   */
  clampHeight(height) {
    if(typeof height !== "number") {
      height = this.#clamping.minHeight;
    }
    return Math.max(this.#clamping.minHeight, Math.min(this.#clamping.maxHeight, Math.floor(height || 0)));
  }

  /**
   * Update the viewport dimensions, clamping both values before storing.
   * Emits `state:viewportChanged` if either dimension actually changes.
   *
   * @param {number} width
   * @param {number} height
   */
  updateViewport(width, height) {
    const clamped = {
      width: this.clampWidth(width),
      height: this.clampHeight(height)
    };
    this.set('viewport', clamped);
  }

  /**
   * Read a raw state value by key (use typed getters where possible).
   * @param {string} key
   * @returns {*}
   */
  get(key) { return this.#state[key]; }

  /**
   * Set a state value and emit `state:<key>Changed` only when the new value
   * differs from the current one (deep equality via JSON.stringify).
   *
   * @param {string} key
   * @param {*}      value
   */
  set(key, value) {
    const oldValue = this.#state[key];
    if (JSON.stringify(oldValue) === JSON.stringify(value)) return;
    this.#state[key] = value;
    bus.emit(`state:${key}Changed`, { key, value, previous: oldValue });
  }

  /**
   * Return a shallow copy of the current viewport dimensions.
   * @returns {{ width: number, height: number }}
   */
  getViewport() { return { ...this.#state.viewport }; }

  /**
   * Return the current viewport mode ('manual', 'fit', or 'device').
   * @returns {string}
   */
  getMode() { return this.#state.mode; }

  /**
   * Return the currently active breakpoint object, or null if none is active.
   * @returns {object|null}
   */
  getActiveBreakpoint() { return this.#state.activeBreakpoint; }

  /**
   * Return the URL of the currently loaded demo, or an empty string.
   * @returns {string}
   */
  getCurrentDemo() { return this.#state.currentDemo; }

  /**
   * Set the viewport mode and emit `state:modeChanged` on change.
   * @param {'manual'|'fit'|'device'} mode
   */
  setMode(mode) { this.set('mode', mode); }

  /**
   * Set the active breakpoint (or null to clear) and emit
   * `state:activeBreakpointChanged` on change.
   * @param {object|null} bp
   */
  setActiveBreakpoint(bp) { this.set('activeBreakpoint', bp); }

  /**
   * Set the current demo URL and emit `state:currentDemoChanged` on change.
   * @param {string} demo
   */
  setCurrentDemo(demo) { this.set('currentDemo', demo); }
}

/**
 * The application-wide AppState singleton instance.
 * @type {AppState}
 */
export const state = AppState.getInstance();
