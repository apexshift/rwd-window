import { describe, it, expect, vi, beforeEach } from 'vitest';
import IFrameController from '../../assets/js/managers/IFrameController.js';
import { bus } from '../../assets/js/core/EventBus.js';
import { state } from '../../assets/js/core/AppState.js';

describe('IFrameController', () => {
  let controller;

  beforeEach(() => {
    // Reset the singleton instance and mock the DOM
    IFrameController.resetForTesting();
    document.body.innerHTML = `
      <div id="iframe-container">
        <iframe id="test-iframe"></iframe>
      </div>
    `;
    controller = IFrameController.getInstance();
  });

  /**
   * @description Tests the singleton behavior of the IFrameController.
   */
  it('should return the same instance for multiple calls to getInstance', () => {
    const instance1 = IFrameController.getInstance();
    const instance2 = IFrameController.getInstance();
    expect(instance1).toBe(instance2);
  });

  /**
   * @description Tests the `state:viewportChanged` event listener.
   */
  it('should apply viewport changes when the `state:viewportChanged` event is emitted', () => {
    const applyViewportSpy = vi.spyOn(controller, '#applyViewportFromState');
    const newViewport = { width: 1024, height: 768 };

    bus.emit('state:viewportChanged', { value: newViewport });
    expect(applyViewportSpy).toHaveBeenCalledWith(newViewport);
  });

  /**
   * @description Tests the `state:modeChanged` event listener.
   */
  it('should apply mode changes when the `state:modeChanged` event is emitted', () => {
    const applyModeSpy = vi.spyOn(controller, '#applyModeFromState');
    const newMode = 'fit';

    bus.emit('state:modeChanged', { value: newMode });
    expect(applyModeSpy).toHaveBeenCalledWith(newMode);
  });

  /**
   * @description Tests the `state:activeBreakpointChanged` event listener.
   */
  it('should apply breakpoint changes when the `state:activeBreakpointChanged` event is emitted', () => {
    const applyBreakpointSpy = vi.spyOn(controller, '#applyBreakpointFromState');
    const newBreakpoint = { label: 'Mobile', minWidth: 320, maxWidth: 480 };

    bus.emit('state:activeBreakpointChanged', { value: newBreakpoint });
    expect(applyBreakpointSpy).toHaveBeenCalledWith(newBreakpoint);
  });

  /**
   * @description Tests the `breakpoint:activated` event listener.
   */
  it('should update the viewport when a breakpoint is activated', () => {
    const updateViewportSpy = vi.spyOn(state, 'updateViewport');
    const updateFeedbackSpy = vi.spyOn(controller, '#updateFeedback');
    const payload = {
      breakpoint: { label: 'Mobile', minWidth: 320, maxWidth: 480 },
      isMinMode: false,
      targetWidth: 480,
    };

    bus.emit('breakpoint:activated', payload);
    expect(updateViewportSpy).toHaveBeenCalledWith(480, state.getViewport().height);
    expect(updateFeedbackSpy).toHaveBeenCalled();
  });

  /**
   * @description Tests the `viewport:fit` event listener.
   */
  it('should fit the iframe to the container when the `viewport:fit` event is emitted', () => {
    const fitToContainerSpy = vi.spyOn(controller, '#fitToContainer');

    bus.emit('viewport:fit');
    expect(fitToContainerSpy).toHaveBeenCalled();
  });

  /**
   * @description Tests the `input:stepChanged` event listener.
   */
  it('should handle input step changes when the `input:stepChanged` event is emitted', () => {
    const handleInputStepChangedSpy = vi.spyOn(controller, '#handleInputStepChanged');
    const payload = { target: 'width', direction: 'up', step: 10 };

    bus.emit('input:stepChanged', payload);
    expect(handleInputStepChangedSpy).toHaveBeenCalledWith('width', 'up', 10);
  });

  /**
   * @description Tests the `input:stepCommit` event listener.
   */
  it('should handle input step commits when the `input:stepCommit` event is emitted', () => {
    const handleInputStepCommitSpy = vi.spyOn(controller, '#handleInputStepCommit');
    const payload = { target: 'width' };

    bus.emit('input:stepCommit', payload);
    expect(handleInputStepCommitSpy).toHaveBeenCalledWith('width');
  });
});