import { bus } from './EventBus.js';
import config from '../../../config.json' with { type: "json" };

export class AppState {
  static #instance = null;

  #state = {
    viewport: { width: 1920, height: 1080 },
    mode: 'manual',
    activeBreakpoint: null,
    currentDemo: ''
  };

  #clamping = { ...config.app.clamping };

  static getInstance() {
    if (!AppState.#instance) {
      AppState.#instance = new AppState();
    }
    return AppState.#instance;
  }

  getClamping() {
    return { ...this.#clamping };
  }

  setContainerWidth(width) {
    const clamped = Math.floor(width);
    if (this.#clamping.maxWidth === clamped) return;
    this.#clamping.maxWidth = clamped;
    bus.emit('state:containerWidthChanged', { maxWidth: clamped });
  }

  setContainerHeight(height) {
    const clamped = Math.floor(height);
    if (this.#clamping.maxHeight === clamped) return;
    this.#clamping.maxHeight = clamped;
    bus.emit('state:containerHeightChanged', { maxHeight: clamped });
  }

  clampWidth(width) {
    if(typeof width !== "number") {
      width = this.#clamping.minWidth;
    }

    return Math.max(this.#clamping.minWidth || 320, Math.min(this.#clamping.maxWidth || 1920, Math.floor(width || 0)));
  }

  clampHeight(height) {
    if(typeof height !== "number") {
      height = this.#clamping.minHeight;
    }
    return Math.max(this.#clamping.minHeight, Math.min(this.#clamping.maxHeight, Math.floor(height || 0)));
  }

  updateViewport(width, height) {
    const clamped = {
      width: this.clampWidth(width),
      height: this.clampHeight(height)
    };
    this.set('viewport', clamped);
  }

  get(key) { return this.#state[key]; }

  set(key, value) {
    const oldValue = this.#state[key];
    if (JSON.stringify(oldValue) === JSON.stringify(value)) return;
    this.#state[key] = value;
    bus.emit(`state:${key}Changed`, { key, value, previous: oldValue });
  }

  getViewport() { return { ...this.#state.viewport }; }
  getMode() { return this.#state.mode; }
  getActiveBreakpoint() { return this.#state.activeBreakpoint; }
  getCurrentDemo() { return this.#state.currentDemo; }

  setMode(mode) { this.set('mode', mode); }
  setActiveBreakpoint(bp) { this.set('activeBreakpoint', bp); }
  setCurrentDemo(demo) { this.set('currentDemo', demo); }
}

export const state = AppState.getInstance();