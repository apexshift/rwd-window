import { populateFilesSelect, initIFrameSrc } from './js/file-loader.js';
import IFrameResizeController from './js/iFrameResizeController.js';

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
const INIT = () => {
  if(DEV_MODE) console.info('App initialized');

  populateFilesSelect();
  initIFrameSrc();

  // TODO: Viewport Buttons must toggle iframe width to pre-defined widths.
  const controller = IFrameResizeController.getInstance();
  window.rwd = controller;
}

window.addEventListener('load', WINDOW_LOADED);
document.addEventListener('DOMContentLoaded', () => document.fonts.ready.then(FONTS_READY(INIT)));