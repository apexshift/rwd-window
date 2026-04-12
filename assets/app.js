import { App } from './js/App.js';

const DEV_MODE = false;

const DOM_LOADED = (fn = () => {}) => {
  if(DEV_MODE) console.info('DOM loaded');
  fn();
}

const WINDOW_LOADED = (fn = () => {}) => {
  if(DEV_MODE) console.info('Window loaded');

  if(typeof fn === 'function') fn();
}

const FONTS_READY = (fn = () => {}) => {
  if(DEV_MODE) console.info('Fonts ready');
  DOM_LOADED(fn);
}

/**
 * App entry point
 * @returns {void}
 */
const INIT = () => new App().init();

window.addEventListener('load', WINDOW_LOADED);
document.addEventListener('DOMContentLoaded', () => document.fonts.ready.then(() => FONTS_READY(INIT)));