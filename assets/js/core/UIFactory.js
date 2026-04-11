/**
 * Centralized UI element creation for consistency and easy dynamic generation.
 * Will make breakpoint buttons and future controls clean and uniform.
 */
import config from '../../../config.json' with {type: "json"};
import { bus } from './EventBus.js';
import { state } from './AppState.js';

export class UIFactory {

  static getWrapper(selector) {
    if(typeof selector !== "string") {
      throw new Error(`@param[id] must be typeof string, got ${selector}`);
    }

    return document.querySelector(selector);
  }

  static createControlsContainer(id = "") {
    // Helper if needed for future dynamic sections
    const container = document.createElement('fieldset');
    if(typeof id === "string" && (id !== "" && id !== undefined )) {
      container.id = id;
    }
    container.className = 'controls-group';
    return container;
  }

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

  static createDeviceButton(breakpoint, index) {
    const button = this.createButton(breakpoint.label, breakpoint.icon);
    button.title = `${breakpoint.label} (${index+1})`;
    button.dataset.mode = breakpoint.label || breakpoint.mode;
    button.dataset.minWidth = breakpoint.minWidth;
    button.dataset.maxWidth = breakpoint.maxWidth;

    return button;
  }

  static createFitToContainerButton(label, icon = "") {
    const button = this.createButton(label, icon);
    button.classList.add('active');
    button.title = "Fit to Container (F)";
    button.dataset.mode = "fit";

    return button;
  }

  static createHelpButton(label, icon = "") {
    const button = this.createButton(label, icon);
    button.id = "keyboard-help-btn";
    button.title = 'Keyboard Shortcuts (?)';
    button.dataset.action = 'show-help';
    button.setAttribute('aria-label', 'Show keyboard shortcuts');
    button.addEventListener('click', e => { e.preventDefault(); bus.emit('ui:helpClicked') });
    
    return button;
  }

  static createIncrementButton(direction, isWidth = true) {
    const btn = document.createElement('button');
    btn.className = 'app__control-increment ui-button';
    btn.textContent = direction === 'up' ? '+' : '−';
    btn.dataset.direction = direction;
    btn.dataset.target = isWidth ? "width" : "height";
    btn.setAttribute('aria-label', direction === 'up' ? 'Increment' : 'Decrement');
    return btn;
  }

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
    option.setAttribute("value", "");
    option.setAttribute("disabled", true);
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