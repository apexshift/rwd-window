// Mock config.json to use mockBreakpoints
vi.mock('../../config.json', () => {
  return {
    default: {
      app: {
        clamping: {
          minWidth: 320,
          maxWidth: 1920,
          minHeight: 640,
          maxHeight: 1080
        }
      },
      ui_controls: {
        breakpoints: [
          { label: 'Mobile', minWidth: 320, maxWidth: 480, icon: './ui-mobile-icon.svg' },
          { label: 'Tablet', minWidth: 481, maxWidth: 768, icon: './ui-tablet-icon.svg' },
        ],
      },
    }
  }
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import BreakpointManager from '../../assets/js/managers/BreakpointManager.js';
import { state } from '../../assets/js/core/AppState.js';
import { bus } from '../../assets/js/core/EventBus.js';

const testBreakpoints = [
  { label: 'Mobile', minWidth: 320, maxWidth: 480, icon: './ui-mobile-icon.svg' },
  { label: 'Tablet', minWidth: 481, maxWidth: 768, icon: './ui-tablet-icon.svg' },
];

describe('BreakpointManager', () => {
  let manager;
  let mockBreakpoints;

  const { resetToFit, syncActiveButtonVisuals, handleBreakpointClick } = BreakpointManager._test();

  beforeEach(() => {
    // Reset the singleton instance and mock breakpoints
    BreakpointManager.resetForTesting();
    mockBreakpoints = testBreakpoints;
    manager = BreakpointManager.getInstance();
  });

  /**
   * @description Tests the `#handleBreakpointClick` method for single and double clicks.
   */
  it('should handle single and double clicks on breakpoint buttons', () => {
    const mockButton = document.createElement('button');
    const mockBreakpoint = mockBreakpoints[0];
    const emitSpy = vi.spyOn(bus, 'emit');

    // Single click
    handleBreakpointClick(mockButton, mockBreakpoint, { detail: 1 });
    expect(state.getMode()).toBe('device');
    expect(state.getActiveBreakpoint()).toEqual({
      ...mockBreakpoint,
      isMinMode: false,
      targetWidth: mockBreakpoint.maxWidth,
    });
    expect(emitSpy).toHaveBeenCalledWith('breakpoint:activated', {
      breakpoint: mockBreakpoint,
      isMinMode: false,
      targetWidth: mockBreakpoint.maxWidth,
    });

    // Double click
    handleBreakpointClick(mockButton, mockBreakpoint, { detail: 2 });
    expect(state.getMode()).toBe('fit');
    expect(state.getActiveBreakpoint()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith('viewport:fit', {});
  });

  /**
   * @description Tests the `#resetToFit` method.
   */
  it('should reset the viewport to fit mode', () => {
    const emitSpy = vi.spyOn(bus, 'emit');

    resetToFit();
    expect(state.getMode()).toBe('fit');
    expect(state.getActiveBreakpoint()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith('viewport:fit', {});
  });

  /**
   * @description Tests the `#syncActiveButtonVisuals` method.
   */
  it('should update button visuals to reflect the active breakpoint', () => {
    const mockContainer = document.createElement('div');
    mockContainer.classList.add('controls-group');
    document.body.appendChild(mockContainer);


    const mockButton = document.createElement('button');
    mockButton.dataset.mode = 'Mobile';
    mockButton.classList.add('controls-group');
    mockContainer.appendChild(mockButton);

    syncActiveButtonVisuals(mockBreakpoints[0]);
    expect(mockButton.classList.contains('active')).toBe(true);

    syncActiveButtonVisuals(null);
    expect(mockButton.classList.contains('active')).toBe(false);
  });

  /**
   * @description Tests the `getBreakpoints` method.
   */
  it('should return a copy of the breakpoints array', () => {
    const breakpoints = manager.getBreakpoints();

    // Validate structure
    breakpoints.forEach(bp => {
      expect(bp).toHaveProperty('label');
      expect(bp).toHaveProperty('minWidth');
      expect(bp).toHaveProperty('maxWidth');
      expect(bp).toHaveProperty('icon');
    })

    // Ensure it's a copy
    expect(breakpoints).not.toBe(mockBreakpoints);

    // Validate behavior (e.g., transformation logic, if any)
    expect(breakpoints.length).toBe(mockBreakpoints.length);
  });

  /**
   * @description Tests the `resetForTesting` method.
   */
  it('should reset the singleton instance for testing', () => {
    BreakpointManager.resetForTesting();
    // Ensure instance can be reinitialized
    expect(BreakpointManager.getInstance()).not.toBeNull();

    BreakpointManager.resetForTesting();
    expect(BreakpointManager.getInstance()).not.toBeUndefined();
});
});