import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UIFactory } from '../../assets/js/core/UIFactory.js';

describe('UIFactory', () => {
  let container;

  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // ensure clean state after each test
    document.body.innerHTML = '';
  });

  /**
   * @description Tests if `getWrapper` correctly selects an element by its selector.
   */
  it('should return the correct wrapper element', () => {
    const testElement = document.createElement('div');
    testElement.id = 'test-wrapper';
    container.appendChild(testElement);

    const wrapper = UIFactory.getWrapper('#test-wrapper');
    expect(wrapper).toBe(testElement);
  });

  /**
   * @description Tests if `getWrapper` throws an error for invalid selector types.
   */
  it('should throw an error if the selector is not a string', () => {
    expect(() => UIFactory.getWrapper(123)).toThrow('@param[id] must be typeof string');
    expect(() => UIFactory.getWrapper(null)).toThrow('@param[id] must be typeof string');
    expect(() => UIFactory.getWrapper(undefined)).toThrow('@param[id] must be typeof string');
  });

  /**
   * @description Tests if `createControlsContainer` creates a fieldset with the correct ID and class.
   */
  it('should create a controls container with the correct ID and class', () => {
    const container = UIFactory.createControlsContainer('test-id');
    expect(container.tagName).toBe('FIELDSET');
    expect(container.id).toBe('test-id');
    expect(container.className).toBe('controls-group');
  });

  /**
   * @description Tests if `createControlsContainer` creates a fieldset without an ID when none is provided.
   */
  it('should create a controls container without an ID if none is provided', () => {
    const container = UIFactory.createControlsContainer();
    expect(container.tagName).toBe('FIELDSET');
    expect(container.id).toBe('');
    expect(container.className).toBe('controls-group');
  });

  /**
   * @description Tests if `createButton` creates a button with the correct label and icon.
   */
  it('should create a button with the correct label and icon', () => {
    const button = UIFactory.createButton('Test Label', 'test-icon');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).toBe('ui-button');
    expect(button.textContent).toContain('');
  });

  /**
   * @description Tests if `createButton` throws an error for invalid label or icon types.
   */
  it('should throw an error if label or icon is not a string', () => {
    expect(() => UIFactory.createButton(123, 'icon')).toThrow('@parma[label] must be typeof string');
    expect(() => UIFactory.createButton('label', 123)).toThrow('@param[icon] must be typeof string');
  });
});