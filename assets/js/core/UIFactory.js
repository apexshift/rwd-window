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
}