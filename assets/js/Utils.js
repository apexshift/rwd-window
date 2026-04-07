/**
 * Utils.js - Shared utility functions
 * Single flexible toast function to avoid DRY violations.
 */

export function showToast(message, options = {}) {
    const {
      type = 'error',           // 'error', 'success', 'info'
      duration = 3000,
      position = 'top-right'
    } = options;
  
    const colors = {
      error: '#ff4444',
      success: '#4caf50',
      info: '#2196f3'
    };
  
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      ${position === 'top-right' ? 'top: 20px; right: 20px;' : 'bottom: 20px; left: 20px;'}
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
  
    toast.textContent = message;
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
  
  // Convenience wrappers (these are thin and acceptable)
  export const showError = (message) => showToast(message, { type: 'error' });
  export const showSuccess = (message) => showToast(message, { type: 'success' });
  export const showInfo = (message) => showToast(message, { type: 'info' });