/**
 * Utils.js - Shared utility functions
 * Single flexible toast function to avoid DRY violations.
 */

let _activeToast = null;
let _activeToastTimer = null;

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
  
  // Convenience wrappers (these are thin and acceptable)
  export const showError = (message) => showToast(message, { type: 'error' });
  export const showSuccess = (message) => showToast(message, { type: 'success' });
  export const showInfo = (message) => showToast(message, { type: 'info' });