/**
 * @module UIFactory
 * @description Centralised UI element factory for RWD Window.
 *
 * All dynamic DOM elements are created here to keep construction logic in one
 * place and guarantee consistent class names, attributes, and structure across
 * the application.
 */
import config from '../../../config.json' with {type: "json"};
import { bus } from './EventBus.js';
import { state } from './AppState.js';

export class UIFactory {

  /**
   * Query the document for an element matching the given CSS selector.
   *
   * @param {string} selector - A valid CSS selector string.
   * @returns {Element|null} The first matching element, or null if not found.
   * @throws {Error} If `selector` is not a string.
   */
  static getWrapper(selector) {
    if(typeof selector !== "string") {
      throw new Error(`@param[id] must be typeof string, got ${selector}`);
    }

    return document.querySelector(selector);
  }

  /**
   * Create a `<fieldset>` element used to group related controls.
   *
   * @param {string} [id=''] - Optional `id` attribute for the fieldset.
   * @returns {HTMLFieldSetElement}
   */
  static createControlsContainer(id = "") {
    const container = document.createElement('fieldset');
    if(typeof id === "string" && (id !== "" && id !== undefined )) {
      container.id = id;
    }
    container.className = 'controls-group';
    return container;
  }

  /**
   * Create a generic `<button>` element with either an inline SVG icon or an
   * `<img>` icon. Falls back to text content if no icon is supplied.
   *
   * @param {string} label - Accessible label / fallback text content.
   * @param {string} [icon=''] - Inline SVG markup or a relative image path.
   * @returns {HTMLButtonElement}
   * @throws {Error} If `icon` or `label` is not a string.
   */
  static createButton(label, icon = "") {
    const button = document.createElement('button');
    button.className = 'ui-button';

    if(typeof icon !== "string") {
      throw new Error(`@param[icon] must be typeof string, got ${typeof icon}`);
    }

    if(typeof label !== "string") {
      throw new Error(`@param[label] must be typeof string, got ${typeof label}`);
    }

    if(icon !== "" && icon !== undefined) {
      if(icon.startsWith('<svg')) {
        button.innerHTML = icon;
      } else {
        const img = document.createElement('img');
        img.src = icon;
        img.alt = '';
        button.appendChild(img);
      }
    } else {
      console.warn(`@param[icon] should be either <svg>...</svg> or a relative path (../assets/svg/filename.svg)`);
      button.textContent = label;
    }

    return button;
  }

  /**
   * Create a device (breakpoint) button pre-configured with breakpoint data
   * attributes and a keyboard shortcut hint in the `title`.
   *
   * @param {{ label:string, icon:string, minWidth:number, maxWidth:number }} breakpoint
   * @param {number} index - Zero-based position used to display the keyboard shortcut (index+1).
   * @returns {HTMLButtonElement}
   */
  static createDeviceButton(breakpoint, index) {
    const button = this.createButton(breakpoint.label, breakpoint.icon);
    button.title = `${breakpoint.label} (${index+1})`;
    button.dataset.mode = breakpoint.label || breakpoint.mode;
    button.dataset.minWidth = breakpoint.minWidth;
    button.dataset.maxWidth = breakpoint.maxWidth;

    return button;
  }

  /**
   * Create the "Fit to Container" button, initially marked as active.
   *
   * @param {string} label - Accessible label.
   * @param {string} [icon=''] - Inline SVG or image path.
   * @returns {HTMLButtonElement}
   */
  static createFitToContainerButton(label, icon = "") {
    const button = this.createButton(label, icon);
    button.classList.add('active');
    button.title = "Fit to Container (F)";
    button.dataset.mode = "fit";

    return button;
  }

  /**
   * Create the keyboard-help button. Emits `ui:helpClicked` on the EventBus
   * when clicked so KeyboardManager can respond.
   *
   * @param {string} label - Accessible label.
   * @param {string} [icon=''] - Inline SVG or image path.
   * @returns {HTMLButtonElement}
   */
  static createHelpButton(label, icon = "") {
    const button = this.createButton(label, icon);
    button.id = "keyboard-help-btn";
    button.title = 'Keyboard Shortcuts (?)';
    button.dataset.action = 'show-help';
    button.setAttribute('aria-label', 'Show keyboard shortcuts');
    button.addEventListener('click', e => { e.preventDefault(); bus.emit('ui:helpClicked') });

    return button;
  }

  /**
   * Create a single increment (+) or decrement (−) step button.
   *
   * @param {'up'|'down'} direction - 'up' renders '+', 'down' renders '−'.
   * @param {boolean} [isWidth=true] - Whether the button targets width or height.
   * @returns {HTMLButtonElement}
   */
  static createIncrementButton(direction, isWidth = true) {
    const btn = document.createElement('button');
    btn.className = 'app__control-increment ui-button';
    btn.textContent = direction === 'up' ? '+' : '−';
    btn.dataset.direction = direction;
    btn.dataset.target = isWidth ? "width" : "height";
    btn.setAttribute('aria-label', direction === 'up' ? 'Increment' : 'Decrement');
    return btn;
  }

  /**
   * Create a labelled number input with paired increment/decrement buttons.
   * The input `min` and initial `value` are sourced from `config.app.clamping`.
   * The `max` attribute is set for width only — height max is dynamic and
   * updated at runtime via the `state:containerHeightChanged` event.
   *
   * @param {string}  labelText - Display label (e.g. 'W' or 'H').
   * @param {string}  inputId   - The `id` attribute for the `<input>` element.
   * @param {boolean} [isWidth=true] - Whether this control targets width or height.
   * @returns {HTMLLabelElement} A `<label>` wrapping the input and step buttons.
   */
  static createControlWithIncrement(labelText, inputId, isWidth = true) {
    const label = document.createElement('label');
    label.className = 'app__control';
    label.setAttribute('for', inputId);

    const span_label = document.createElement('span');
    span_label.className = 'app__control-label'
    span_label.textContent = labelText;
    label.appendChild(span_label);

    const wrapper = document.createElement('div');
    wrapper.className = 'app__control-wrapper';
    label.appendChild(wrapper);

    const input = document.createElement('input');
    input.type = "number";
    input.id = inputId;
    input.className = "app__control-input";
    input.setAttribute("min", isWidth ? config.app.clamping.minWidth : config.app.clamping.minHeight);
    if (isWidth) input.setAttribute("max", config.app.clamping.maxWidth);
    input.setAttribute("value", isWidth ? config.app.clamping.maxWidth : config.app.clamping.maxHeight);
    input.setAttribute("placeholder", "-");
    wrapper.appendChild(input);

    let stepButton = this.createIncrementButton("up", isWidth);
    wrapper.appendChild(stepButton);
    stepButton = this.createIncrementButton("down", isWidth);
    wrapper.appendChild(stepButton);

    return label;
  }

  /**
   * Create the "Reset to Defaults" button. Emits `ui:resetClicked` on the
   * EventBus when clicked so App.js can clear storage and reload.
   *
   * @param {string} label - Accessible label / button text.
   * @returns {HTMLButtonElement}
   */
  static createResetButton(label, icon = "") {
    const button = this.createButton(label, icon);
    button.title = 'Reset to Defaults (R)';
    button.dataset.action = 'reset';
    button.setAttribute('aria-label', 'Reset to Defaults');
    button.addEventListener('click', () => bus.emit('ui:resetClicked'));
    return button;
  }

  /**
   * Create a labelled `<select>` element populated by LocalLoader.
   * Changes to the select emit `demo:changed` on the EventBus and update
   * AppState via `state.setCurrentDemo()`.
   *
   * @param {string} labelText - Display label (e.g. 'Load').
   * @param {string} inputId   - The `id` attribute for the `<select>` element.
   * @returns {HTMLLabelElement} A `<label>` wrapping the select.
   */
  static createSelectControl(labelText, inputId) {
    const label = document.createElement('label');
    label.className = 'app__control';
    label.setAttribute('for', inputId);

    const label_span = document.createElement('span');
    label_span.className = 'app__control-label loader';
    label_span.textContent = labelText;
    label.appendChild(label_span);

    const wrapper = document.createElement('div');
    wrapper.className = 'app-control-select-wrap';
    label.appendChild(wrapper);

    const select = document.createElement('select');
    select.id = inputId;
    select.className = 'app__control-input';

    const option = document.createElement('option');
    option.setAttribute("value", "./splash.html");
    option.setAttribute("disabled", false);
    option.setAttribute("selected", true);
    option.textContent = "Select a demo";

    select.appendChild(option);
    wrapper.appendChild(select);

    select.addEventListener('change', e => {
      state.setCurrentDemo(e.target.value);
      bus.emit('demo:changed', { value: e.target.value });
    });

    return label;
  }
}
