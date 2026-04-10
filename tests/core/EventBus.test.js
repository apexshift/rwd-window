import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bus } from '../../assets/js/core/EventBus.js';

describe('EventBus', () => {
  let callback;

  beforeEach(() => {
    // Reset callback for each test
    callback = vi.fn();
    bus.resetForTesting(); // clear all listeners
  });

  /**
   * @description Tests if the `on` method registers an event listener.
   */
  it('should register an event listener', () => {
    bus.on('test:event', callback);
    bus.emit('test:event', { data: 'test' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  /**
   * @description Tests if the `off` method removes an event listener.
   */
  it('should remove an event listener', () => {
    const unsubscribe = bus.on('test:event', callback);
    unsubscribe(); // Unsubscribe the listener
    bus.emit('test:event', { data: 'test' });

    expect(callback).not.toHaveBeenCalled();
  });

  /**
   * @description Tests if the `emit` method does nothing when no listeners are registered.
   */
  it('should not throw errors when emitting an event with no listeners', () => {
    expect(() => bus.emit('nonexistent:event')).not.toThrow();
  });

  /**
   * @description Tests if multiple listeners for the same event are called.
   */
  it('should call multiple listeners for the same event', () => {
    const secondCallback = vi.fn();
    bus.on('test:event', callback);
    bus.on('test:event', secondCallback);

    bus.emit('test:event', { data: 'test' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  /**
   * @description Tests if the `emit` method handles errors in listeners gracefully.
   */
  it('should handle errors in listeners gracefully', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Listener error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.on('test:event', errorCallback);
    bus.on('test:event', callback);

    expect(() => bus.emit('test:event')).not.toThrow();
    expect(callback).toHaveBeenCalledTimes(1);

    // Verify the error was logged as expected
    expect(consoleErrorSpy).toHaveBeenCalledWith(
        'EventBus error in listener for "test:event":',
        expect.objectContaining({ message: 'Listener error' })
    );

    consoleErrorSpy.mockRestore(); // clean up
  });

  /**
   * @description Tests if the `off` method removes only the specified listener.
   */
  it('should remove only the specified listener', () => {
    const secondCallback = vi.fn();
    bus.on('test:event', callback);
    const unsubscribeSecond = bus.on('test:event', secondCallback);

    unsubscribeSecond(); // Unsubscribe only the second listener
    bus.emit('test:event', { data: 'test' });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(secondCallback).not.toHaveBeenCalled();
  });
});