/**
 * Centralized UI element creation for consistency and easy dynamic generation.
 * Will make breakpoint buttons and future controls clean and uniform.
 */
import { bus } from './EventBus.js';

export class UIFactory {
  static createDeviceButton(breakpoint) {
    const button = document.createElement('button');
    button.className = 'ui-button';
    button.title = breakpoint.label || breakpoint.mode;
    button.dataset.mode = breakpoint.label || breakpoint.mode;
    button.dataset.minWidth = breakpoint.minWidth;
    button.dataset.maxWidth = breakpoint.maxWidth;

    if (breakpoint.icon) {
      // Support both SVG string and external path (your current style)
      if (breakpoint.icon.startsWith('<svg')) {
        button.innerHTML = breakpoint.icon;
      } else {
        const img = document.createElement('img');
        img.src = breakpoint.icon;
        img.alt = '';
        button.appendChild(img);
      }
    }

    // Click will be wired by BreakpointManager later (via events)
    return button;
  }

  static createControlsContainer() {
    // Helper if needed for future dynamic sections
    const container = document.createElement('fieldset');
    container.className = 'controls-group';
    return container;
  }

  static createHelpButton() {
    const button = document.createElement('button');
    button.className('ui-button');
    button.title = 'Keyboard Shortcuts (?)';
    button.dataset.action = 'show-help';
    button.innerHTML = '?';
    button.setAttribute('aria-label', 'Show keyboard shortcuts');
    return button;
  }

  static createIncrementButton(direction) {
    const btn = document.createElement('button');
    btn.className = 'app__control-increment';
    btn.textContent = direction === 'up' ? '+' : '−';
    btn.dataset.direction = direction;
    btn.setAttribute('aria-label', direction === 'up' ? 'Increment' : 'Decrement');
    return btn;
  }

  static createControlWithIncrement(labelText, inputId, isWidth = true) {
    const label = document.createElement('label');
    label.className = 'app__control';
    label.setAttribute('for', inputId);

    label.innerHTML = `
      <span class="app__control-label">${labelText}</span>
      <div class="app__control-wrapper">
        <button class="app__control-increment" data-direction="down">−</button>
        <input type="number" id="${inputId}" class="app__control-input" 
               min="${isWidth ? 320 : 640}" 
               max="${isWidth ? 1920 : 1080}" 
               value="${isWidth ? 1920 : 1080}" 
               placeholder="-">
        <button class="app__control-increment" data-direction="up">+</button>
      </div>
    `;

    return label;
  }
}