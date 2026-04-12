/**
 * @module Utils
 * @description Shared utility functions for the RWD Window application.
 *
 * Provides a centralised toast notification system that guarantees only one
 * toast is visible at a time — any incoming toast instantly dismisses the
 * previous one before displaying itself.
 */

/** @type {HTMLElement|null} The currently visible toast element, or null. */
let _activeToast = null;

/** @type {ReturnType<typeof setTimeout>|null} The fade-out timer for the active toast. */
let _activeToastTimer = null;

/**
 * Display a dismissible toast notification.
 *
 * If a toast is already on screen it is removed instantly before the new one
 * appears, so only one toast is visible at any given time.
 *
 * @param {string} message - The text to display inside the toast.
 * @param {object} [options={}]
 * @param {'error'|'success'|'info'} [options.type='error'] - Determines the background colour.
 * @param {number} [options.duration=3000] - Milliseconds before the toast begins to fade out.
 * @param {'center'|'corner'} [options.position='center'] - Screen position of the toast.
 */
export function showToast(message, options = {}) {
    const {
      type = 'error',           // 'error', 'success', 'info'
      duration = 3000,
      position = 'center'
    } = options;

    const colors = {
      error: '#ff4444',
      success: '#4caf50',
      info: '#2196f3'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      ${position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : 'bottom: var(--space-32, 32px); right: var(--space-32, 32px);'}
      background: ${colors[type] || colors.error};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 320px;
      opacity: 1;
      transition: opacity 0.4s ease;
      pointer-events: none;
    `;

    // Dismiss any active toast immediately
    if (_activeToast) {
      clearTimeout(_activeToastTimer);
      _activeToast.remove();
      _activeToast = null;
    }

    toast.textContent = message;
    document.body.appendChild(toast);
    _activeToast = toast;

    _activeToastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
        if (_activeToast === toast) _activeToast = null;
      }, 400);
    }, duration);
  }

/**
 * Show an error toast (red) with the default 3-second duration.
 * @param {string} message
 */
export const showError = (message) => showToast(message, { type: 'error' });

/**
 * Show a success toast (green) with the default 3-second duration.
 * @param {string} message
 */
export const showSuccess = (message) => showToast(message, { type: 'success' });

/**
 * Show an info toast (blue) with the default 3-second duration.
 * @param {string} message
 */
export const showInfo = (message) => showToast(message, { type: 'info' });
