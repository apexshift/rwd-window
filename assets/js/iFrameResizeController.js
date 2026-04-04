export default class IFrameResizeController {
  #defaults = {
    minWidth: 320,
    maxWidth: 1920,
    minHeight: 640,
    maxHeight: 1080,
    mode: 'desktop',
  }

  #button_state = {
    "currentMode": this.#defaults.mode,
    "lastButtonClicked": null,
    "doSecondClickState": false,
  }
 
  #iframe_state = {}

  #buttons
  #widthControl
  #heightControl
  #iframe

  constructor(config = {}) {
    // Merge defaults with config
    Object.assign(this.#defaults, config);

    // setup initial values
    this.#iframe_state.maxWidth = this.#defaults.maxWidth;
    this.#iframe_state.maxHeight = this.#defaults.maxHeight;

    // TODO: collect ui elementts
    this.#buttons = this.#getToggleButtons();
    this.#widthControl = this.#getWidthControl();
    this.#heightControl = this.#getHeightControl();
    this.#iframe = this.#getIFrame();

    // TODO: setup buttons and event listeners
    
    // TODO: setup iframe resize handles and event listeners

    // TODOL setup input controls and event listeners
  }

  #getToggleButtons() {
    this.#buttons = document.querySelectorAll('.app__viewport-toggle');
    if(!this.#buttons.length) throw new Error('No toggle buttons found');
    
    return this.#buttons;
  }

  #getWidthControl() {
    this.#widthControl = document.querySelector('#width-control');
    if(!this.#widthControl) throw new Error('Width control not found');
    
    return this.#widthControl;
  }

  #getHeightControl() {
    this.#heightControl = document.querySelector('#height-control');
    if(!this.#heightControl) throw new Error('Height control not found');
    
    return this.#heightControl;
  }

  #getIFrame() {
    this.#iframe = document.querySelector('.viewport');
    if(!this.#iframe) throw new Error('IFrame not found');
    
    return this.#iframe;
  }

  toString() {
    return `IFrameResizeController: {
      defaults: ${JSON.stringify(this.#defaults)},
      button_state: ${JSON.stringify(this.#button_state)},
      iframe_state: ${JSON.stringify(this.#iframe_state)},
      buttons: ${this.#buttons ? this.#buttons.length : 'not initialized'},
      widthControl: ${this.#widthControl ? 'initialized' : 'not initialized'},
      heightControl: ${this.#heightControl ? 'initialized' : 'not initialized'},
      iframe: ${this.#iframe ? 'initialized' : 'not initialized'},
    }`;
  }
}