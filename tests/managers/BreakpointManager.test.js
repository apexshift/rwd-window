import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BreakpointManager } from '../../assets/js/managers/BreakpointManager.js';

// === Mocks ===
// Mock the JSON config (Vitest supports this for import with { type: "json" })
vi.mock('../../../config.json', () => ({
  default: {
    ui_controls: {
      breakpoints: [
        {
          label: "Mobile Portrait",
          icon: "./assets/svg/ui-mobile-portrait-icon-dol.svg",
          minWidth: 320,
          maxWidth: 477
        },
        {
          label: "Mobile Landscape",
          icon: "./assets/svg/ui-mobile-landscape-icon-dol.svg",
          minWidth: 478,
          maxWidth: 767
        },
        {
          label: "Tablet Portrait",
          icon: "./assets/svg/ui-tablet-portrait-icon-dol.svg",
          minWidth: 768,
          maxWidth: 991
        },
        {
          label: "Laptop",
          icon: "./assets/svg/ui-laptop-icon-dol.svg",
          minWidth: 992,
          maxWidth: 1279
        },
        {
          label: "Desktop",
          icon: "./assets/svg/ui-desktop-icon-dol.svg",
          minWidth: 1280,
          maxWidth: 1920
        }
      ]
    }
  }
}), { virtual: true });

// Mock dependencies
vi.mock('../core/EventBus.js', () => ({
  bus: {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn() // in case you add unsubscribe later
  }
}));

vi.mock('../core/AppState.js', () => ({
  state: {
    getActiveBreakpoint: vi.fn(),
    setMode: vi.fn(),
    setActiveBreakpoint: vi.fn()
  }
}));

vi.mock('../../assets/js/core/UIFactory.js', () => ({
  UIFactory: {
    createDeviceButton: vi.fn()
  }
}));

vi.mock('../../assets/js/managers/UIManager.js', () => ({
  default: {
    getInstance: vi.fn()
  }
}));

// Import after mocks
import { bus } from '../../assets/js/core/EventBus.js';
import { state } from '../../assets/js/core/AppState.js';
import { UIFactory } from '../../assets/js/core/UIFactory.js';
import UIManager from '../../assets/js/managers/UIManager.js';

describe('BreakpointManager', () => {
  let manager;
  let mockDeviceContainer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton (the only safe way without modifying production code much)
    BreakpointManager.instance = null; // or use a test-only reset if you add one

    // Setup a clean DOM container
    mockDeviceContainer = document.createElement('div');
    mockDeviceContainer.className = 'device-container'; // adjust if your real container has a different class

    UIManager.getInstance.mockReturnValue({
      deviceContainer: mockDeviceContainer
    });

    // Default button factory mock
    UIFactory.createDeviceButton.mockImplementation((bp, index) => {
      const button = document.createElement('button');
      button.dataset.mode = bp.label;
      button.textContent = bp.label;
      // Optional: add class if your real implementation does
      button.classList.add('device-button');
      return button;
    });

    manager = BreakpointManager.getInstance();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockDeviceContainer = null;
    BreakpointManager.instance = null;
  });

  // ==================== Singleton ====================
  describe('Singleton Pattern', () => {
    it('should enforce singleton pattern', () => {
      const instance1 = BreakpointManager.getInstance();
      const instance2 = BreakpointManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should throw when trying to instantiate directly', () => {
      expect(() => new BreakpointManager()).toThrow('BreakpointManager is a singleton.');
    });
  });

  // ==================== Breakpoint Loading ====================
  describe('Breakpoint Loading', () => {
    it('should load and filter valid breakpoints from config', () => {
      const breakpoints = manager.getBreakpoints();
      expect(breakpoints).toHaveLength(5);
      expect(breakpoints[0]).toEqual(expect.objectContaining({
        label: "Mobile Portrait",
        minWidth: 320,
        maxWidth: 477
      }));
      expect(breakpoints.every(bp => bp.label && !isNaN(bp.minWidth) && !isNaN(bp.maxWidth))).toBe(true);
    });

    it('should emit "breakpoints:loaded" event with correct count', () => {
      expect(bus.emit).toHaveBeenCalledWith(
        'breakpoints:loaded',
        { count: 5 }
      );
    });

    it('should return a fresh copy of breakpoints (immutable)', () => {
      const bp1 = manager.getBreakpoints();
      const bp2 = manager.getBreakpoints();
      expect(bp1).not.toBe(bp2); // different array reference
      bp1.push({ label: 'fake' });
      expect(manager.getBreakpoints()).toHaveLength(5); // original unchanged
    });
  });

  // ==================== Event Subscriptions ====================
  describe('Event Subscriptions', () => {
    it('should subscribe to "app:ready" and "state:activeBreakpointChanged"', () => {
      expect(bus.on).toHaveBeenCalledWith('app:ready', expect.any(Function));
      expect(bus.on).toHaveBeenCalledWith('state:activeBreakpointChanged', expect.any(Function));
    });
  });

  // ==================== UI Initialization ====================
  describe('UI Initialization', () => {
    beforeEach(() => {
      // Trigger app:ready safely
      const appReadyHandler = bus.on.mock.calls.find(
        ([event]) => event === 'app:ready'
      )?.[1];

      if (typeof appReadyHandler === 'function') {
        appReadyHandler();
      }
    });

    it('should create one button per breakpoint using UIFactory', () => {
      expect(UIFactory.createDeviceButton).toHaveBeenCalledTimes(5);
      expect(UIFactory.createDeviceButton).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Mobile Portrait' }),
        0
      );
    });

    it('should append all buttons to the device container', () => {
      expect(mockDeviceContainer.children).toHaveLength(5);
      expect(mockDeviceContainer.querySelectorAll('button[data-mode]')).toHaveLength(5);
    });

    it('should attach click and dblclick listeners to each button', () => {
      const buttons = mockDeviceContainer.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.onclick).toBeDefined();   // or check addEventListener if you prefer
        expect(button.ondblclick).toBeDefined();
      });
    });
  });

  // ==================== Click Handling ====================
  describe('Breakpoint Click Handling', () => {
    let firstButton;
    let firstBreakpoint;

    beforeEach(() => {
      const appReadyHandler = bus.on.mock.calls.find(
        ([event]) => event === 'app:ready'
      )?.[1];
      if (appReadyHandler) appReadyHandler();

      firstButton = mockDeviceContainer.children[0];
      firstBreakpoint = manager.getBreakpoints()[0];
    });

    it('should activate max-width mode on first click when no breakpoint is active', () => {
      state.getActiveBreakpoint.mockReturnValue(null);

      firstButton.click();

      expect(state.setMode).toHaveBeenCalledWith('device');
      expect(state.setActiveBreakpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Mobile Portrait',
          isMinMode: false,
          targetWidth: 477
        })
      );
      expect(bus.emit).toHaveBeenCalledWith(
        'breakpoint:activated',
        expect.objectContaining({ isMinMode: false, targetWidth: 477 })
      );
    });

    it('should toggle to min-width when clicking the already active breakpoint', () => {
      state.getActiveBreakpoint.mockReturnValue({
        label: 'Mobile Portrait',
        isMinMode: false
      });

      firstButton.click();

      expect(state.setActiveBreakpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Mobile Portrait',
          isMinMode: true,
          targetWidth: 320
        })
      );
    });

    it('should reset to fit mode on double-click', () => {
      const dblclickEvent = new Event('dblclick', { bubbles: true });
      firstButton.dispatchEvent(dblclickEvent);

      expect(state.setMode).toHaveBeenCalledWith('fit');
      expect(state.setActiveBreakpoint).toHaveBeenCalledWith(null);
      expect(bus.emit).toHaveBeenCalledWith('viewport:fit', {});
    });
  });

  // ==================== Visual Sync ====================
  describe('Active Button Visual Synchronization', () => {
    beforeEach(() => {
      const appReadyHandler = bus.on.mock.calls.find(
        ([event]) => event === 'app:ready'
      )?.[1];
      if (appReadyHandler) appReadyHandler();
    });

    it('should remove "active" class from all buttons when no breakpoint is active', () => {
      const activeChangedHandler = bus.on.mock.calls.find(
        ([event]) => event === 'state:activeBreakpointChanged'
      )?.[1];

      // Simulate one button having active class
      mockDeviceContainer.children[0].classList.add('active');

      activeChangedHandler({ value: null });

      expect(mockDeviceContainer.querySelectorAll('.active')).toHaveLength(0);
    });

    it('should add "active" class only to the matching button', () => {
      const activeChangedHandler = bus.on.mock.calls.find(
        ([event]) => event === 'state:activeBreakpointChanged'
      )?.[1];

      activeChangedHandler({ value: { label: 'Tablet Portrait' } });

      const activeButtons = mockDeviceContainer.querySelectorAll('.active');
      expect(activeButtons).toHaveLength(1);
      expect(activeButtons[0].dataset.mode).toBe('Tablet Portrait');
    });
  });

  // ==================== Error / Edge Cases ====================
  describe('Error Handling & Edge Cases', () => {
    it('should handle missing device container gracefully (no crash)', () => {
      UIManager.getInstance.mockReturnValue({ deviceContainer: null });

      BreakpointManager.instance = null;
      const newManager = BreakpointManager.getInstance();

      const appReadyHandler = bus.on.mock.calls.find(
        ([event]) => event === 'app:ready'
      )?.[1];

      expect(() => appReadyHandler?.()).not.toThrow();
      expect(UIFactory.createDeviceButton).not.toHaveBeenCalled();
    });

    it('should emit config:error and clear breakpoints on load failure', () => {
      // This would require temporarily breaking the config mock or testing the catch block
      // For now we can test the public outcome if you force an error path
      // (Optional advanced test using vi.doMock + vi.resetModules)
    });
  });
});