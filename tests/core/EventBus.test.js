import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bus } from '../../assets/js/core/EventBus.js';

describe('EventBus', () => {
    let callback;

    beforeEach(() => {
        callback = vi.fn();
        bus.resetForTesting();
    });

    /**
     * @description on() should register a listener that is invoked when the event is emitted.
     */
    it('registers an event listener', () => {
        bus.on('test:event', callback);
        bus.emit('test:event', { data: 'test' });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    /**
     * @description The unsubscribe function returned by on() should remove the listener.
     */
    it('removes a listener via the returned unsubscribe function', () => {
        const unsubscribe = bus.on('test:event', callback);
        unsubscribe();
        bus.emit('test:event', { data: 'test' });

        expect(callback).not.toHaveBeenCalled();
    });

    /**
     * @description off() should remove a specific listener by reference.
     */
    it('removes a listener via off()', () => {
        bus.on('test:event', callback);
        bus.off('test:event', callback);
        bus.emit('test:event', {});

        expect(callback).not.toHaveBeenCalled();
    });

    /**
     * @description Emitting an event with no listeners should not throw.
     */
    it('does not throw when emitting an event with no listeners', () => {
        expect(() => bus.emit('nonexistent:event')).not.toThrow();
    });

    /**
     * @description Multiple listeners for the same event should all be invoked.
     */
    it('calls multiple listeners for the same event', () => {
        const secondCallback = vi.fn();
        bus.on('test:event', callback);
        bus.on('test:event', secondCallback);

        bus.emit('test:event', { data: 'test' });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(secondCallback).toHaveBeenCalledTimes(1);
    });

    /**
     * @description An error thrown inside one listener should not prevent others from running.
     */
    it('isolates errors in listeners so remaining listeners still execute', () => {
        const errorCallback = vi.fn(() => { throw new Error('Listener error'); });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        bus.on('test:event', errorCallback);
        bus.on('test:event', callback);

        expect(() => bus.emit('test:event')).not.toThrow();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'EventBus error in listener for "test:event":',
            expect.objectContaining({ message: 'Listener error' })
        );

        consoleErrorSpy.mockRestore();
    });

    /**
     * @description Unsubscribing one listener should leave other listeners for the same event intact.
     */
    it('removes only the specified listener when unsubscribing', () => {
        const secondCallback = vi.fn();
        bus.on('test:event', callback);
        const unsubscribeSecond = bus.on('test:event', secondCallback);

        unsubscribeSecond();
        bus.emit('test:event', { data: 'test' });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(secondCallback).not.toHaveBeenCalled();
    });

    /**
     * @description resetForTesting() should clear all registered listeners.
     */
    it('clears all listeners on resetForTesting()', () => {
        bus.on('test:event', callback);
        bus.resetForTesting();
        bus.emit('test:event', {});

        expect(callback).not.toHaveBeenCalled();
    });

    /**
     * @description emit() passes null as the default payload when data is omitted.
     */
    it('passes null as default payload when data is omitted', () => {
        bus.on('test:event', callback);
        bus.emit('test:event');
        expect(callback).toHaveBeenCalledWith(null);
    });
});
