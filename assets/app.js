import { populateFilesSelect, initIFrameSrc } from './js/file-loader.js';

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
  // TODO: Viewport Buttons must toggle iframe width to pre-defined widths.
  // TODO: Width control must set the witdth of the iframe to the value of the input, input must be clamped to a min and max value.
  // TODO: Height control must set the height of the iframe to the value of the input, input must be clamped to a min and max value.
  // TODO: File loader must populate the file loader list with the files from the file-loader.json config file, clicking on a file in the list must load the file in the iframe.
  populateFilesSelect();
  initIFrameSrc();
  // TODO: iframe has custom resize handles, if left or right is dragged, resize width from the center, if bottom is dragged, resize height from the bottom only.
  // TODO: double clicking any resize handle resets the iframe to the default (max) width and (maxh) height.

}

window.addEventListener('load', WINDOW_LOADED);
document.addEventListener('DOMContentLoaded', () => document.fonts.ready.then(FONTS_READY(INIT)));