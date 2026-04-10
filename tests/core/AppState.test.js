import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../../assets/js/core/AppState.js';

describe('AppState', () => {
  let clamping;

  beforeEach(() => {
    // Reset clamping values from config.json
    clamping = state.getClamping();
  });

  /**
   * @description Tests if the `getClamping` method returns the correct clamping values.
   */
  it('should return the correct clamping values', () => {
    const clampingValues = state.getClamping();
    expect(clampingValues).toEqual(clamping);
  });

  /**
   * @description Tests if the `clampWidth` method clamps the width within the defined range.
   */
  it('should clamp width within the defined range', () => {
    const minWidth = clamping.minWidth;
    const maxWidth = clamping.maxWidth;

    expect(state.clampWidth(minWidth - 100)).toBe(minWidth); // Below minWidth
    expect(state.clampWidth(maxWidth + 100)).toBe(maxWidth); // Above maxWidth
    expect(state.clampWidth((minWidth + maxWidth) / 2)).toBe(Math.floor((minWidth + maxWidth) / 2)); // Within range
  });

  /**
   * @description Tests if the `clampHeight` method clamps the height within the defined range.
   */
  it('should clamp height within the defined range', () => {
    const minHeight = clamping.minHeight;
    const maxHeight = clamping.maxHeight;

    expect(state.clampHeight(minHeight - 100)).toBe(minHeight); // Below minHeight
    expect(state.clampHeight(maxHeight + 100)).toBe(maxHeight); // Above maxHeight
    expect(state.clampHeight((minHeight + maxHeight) / 2)).toBe(Math.floor((minHeight + maxHeight) / 2)); // Within range
  });

  /**
   * @description Tests if the `clampWidth` and `clampHeight` methods handle invalid inputs gracefully.
   */
  it('should handle invalid width and height inputs gracefully', () => {
    expect(state.clampWidth(null)).toBe(clamping.minWidth);
    expect(state.clampWidth(undefined)).toBe(clamping.minWidth);
    expect(state.clampWidth('invalid')).toBe(clamping.minWidth);

    expect(state.clampHeight(null)).toBe(clamping.minHeight);
    expect(state.clampHeight(undefined)).toBe(clamping.minHeight);
    expect(state.clampHeight('invalid')).toBe(clamping.minHeight);
  });
});