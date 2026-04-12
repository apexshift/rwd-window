import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast, showError, showSuccess, showInfo } from '../assets/js/Utils.js';

describe('Utils — showToast', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /**
     * @description A toast element should be appended to document.body.
     */
    it('appends a toast element to document.body', () => {
        showToast('Hello');
        expect(document.body.querySelector('div')).not.toBeNull();
    });

    /**
     * @description The toast should display the provided message as text content.
     */
    it('displays the provided message', () => {
        showToast('Test message');
        expect(document.body.querySelector('div').textContent).toBe('Test message');
    });

    /**
     * @description The error type should produce a red background colour.
     */
    it('applies the correct background colour for type "error"', () => {
        showToast('Error', { type: 'error' });
        expect(document.body.querySelector('div').style.background).toContain('#ff4444');
    });

    /**
     * @description The success type should produce a green background colour.
     */
    it('applies the correct background colour for type "success"', () => {
        showToast('Success', { type: 'success' });
        expect(document.body.querySelector('div').style.background).toContain('#4caf50');
    });

    /**
     * @description The info type should produce a blue background colour.
     */
    it('applies the correct background colour for type "info"', () => {
        showToast('Info', { type: 'info' });
        expect(document.body.querySelector('div').style.background).toContain('#2196f3');
    });

    /**
     * @description An unknown type should fall back to the error colour.
     */
    it('falls back to error colour for an unknown type', () => {
        showToast('Unknown', { type: 'unknown' });
        expect(document.body.querySelector('div').style.background).toContain('#ff4444');
    });

    /**
     * @description When a second toast fires before the first has elapsed,
     * the first should be removed immediately so only one toast exists in the DOM.
     */
    it('dismisses the previous toast instantly when a new one is shown', () => {
        showToast('First', { duration: 5000 });
        showToast('Second', { duration: 5000 });
        const toasts = document.body.querySelectorAll('div');
        expect(toasts.length).toBe(1);
        expect(toasts[0].textContent).toBe('Second');
    });

    /**
     * @description The toast should be removed from the DOM after duration + fade time.
     */
    it('removes the toast after the duration has elapsed', () => {
        showToast('Bye', { duration: 1000 });
        expect(document.body.querySelector('div')).not.toBeNull();
        vi.advanceTimersByTime(1000);   // trigger fade
        vi.advanceTimersByTime(400);    // complete fade removal
        expect(document.body.querySelector('div')).toBeNull();
    });
});

describe('Utils — convenience wrappers', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /**
     * @description showError should produce an error-coloured toast.
     */
    it('showError renders a red toast', () => {
        showError('Oops');
        expect(document.body.querySelector('div').style.background).toContain('#ff4444');
    });

    /**
     * @description showSuccess should produce a success-coloured toast.
     */
    it('showSuccess renders a green toast', () => {
        showSuccess('Done');
        expect(document.body.querySelector('div').style.background).toContain('#4caf50');
    });

    /**
     * @description showInfo should produce an info-coloured toast.
     */
    it('showInfo renders a blue toast', () => {
        showInfo('FYI');
        expect(document.body.querySelector('div').style.background).toContain('#2196f3');
    });
});
