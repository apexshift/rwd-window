// Mock config.json to provide controlled ui_controls values
vi.mock('../../config.json', () => ({
    default: {
        app: {
            clamping: { minWidth: 320, maxWidth: 1920, minHeight: 640, maxHeight: 1080 }
        },
        ui_controls: {
            fitToContainer: { label: 'Fit', icon: '' },
            help:           { label: 'Help', icon: '' },
            reset:          { label: 'Reset', icon: '' },
            breakpoints:    [],
        },
        files: []
    }
}));

import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { UIManager } from '../../assets/js/managers/UIManager.js';
import { bus } from '../../assets/js/core/EventBus.js';

/** Minimal DOM required by UIManager#createUI and #registerElements. */
function buildDOM() {
    document.body.innerHTML = `
        <header class="app__window__masthead">
            <div class="masthead__controls"></div>
        </header>
        <main class="app__window__view">
            <div class="viewport">
                <iframe class="viewport__frame"></iframe>
                <div class="viewport__rs left"></div>
                <div class="viewport__rs right"></div>
                <div class="viewport__rs bottom"></div>
            </div>
        </main>
    `;
}

describe('UIManager', () => {
    let manager;

    // Initialize once — UIManager registers document-level event listeners
    // (fitBtn click, input blur/keydown) and bus listeners for container-dimension
    // updates. Resetting the bus in beforeEach would wipe those listeners.
    beforeAll(() => {
        // Suppress UIFactory icon warnings emitted when config mock passes empty icon strings.
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        buildDOM();
        manager = UIManager.getInstance();
        bus.emit('app:init', {});   // triggers #initialize → builds DOM + registers elements
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    // ── singleton ──────────────────────────────────────────────────────────────

    /**
     * @description getInstance() should always return the same object.
     */
    it('is a singleton', () => {
        expect(UIManager.getInstance()).toBe(manager);
    });

    // ── DOM construction ───────────────────────────────────────────────────────

    /**
     * @description After app:init, the masthead controls should be populated.
     */
    it('builds control elements inside .masthead__controls after app:init', () => {
        const masthead = document.querySelector('.masthead__controls');
        expect(masthead.children.length).toBeGreaterThan(0);
    });

    /**
     * @description After initialization, fitBtn should be a button with data-mode="fit".
     */
    it('registers fitBtn with data-mode="fit"', () => {
        expect(manager.fitBtn).not.toBeNull();
        expect(manager.fitBtn.dataset.mode).toBe('fit');
    });

    /**
     * @description widthInput and heightInput should be registered number inputs.
     */
    it('registers widthInput and heightInput as number inputs', () => {
        expect(manager.widthInput).not.toBeNull();
        expect(manager.heightInput).not.toBeNull();
        expect(manager.widthInput.type).toBe('number');
        expect(manager.heightInput.type).toBe('number');
    });

    /**
     * @description stepButtons should return all increment/decrement buttons.
     */
    it('stepButtons returns the increment/decrement buttons', () => {
        expect(manager.stepButtons.length).toBeGreaterThan(0);
    });

    /**
     * @description resizeHandles should expose left, right, and bottom handles.
     */
    it('resizeHandles exposes left, right, and bottom handles', () => {
        const { left, right, bottom } = manager.resizeHandles;
        expect(left).not.toBeNull();
        expect(right).not.toBeNull();
        expect(bottom).not.toBeNull();
    });

    // ── dynamic max attributes ──────────────────────────────────────────────────

    /**
     * @description state:containerWidthChanged should update widthInput.max.
     */
    it('state:containerWidthChanged — updates widthInput.max', () => {
        bus.emit('state:containerWidthChanged', { maxWidth: 1200 });
        expect(Number(manager.widthInput.max)).toBe(1200);
    });

    /**
     * @description state:containerHeightChanged should update heightInput.max.
     */
    it('state:containerHeightChanged — updates heightInput.max', () => {
        bus.emit('state:containerHeightChanged', { maxHeight: 900 });
        expect(Number(manager.heightInput.max)).toBe(900);
    });

    // ── event forwarding ────────────────────────────────────────────────────────

    /**
     * @description Clicking fitBtn should emit viewport:fit on the bus.
     */
    it('fitBtn click — emits viewport:fit', () => {
        const spy = vi.spyOn(bus, 'emit');
        manager.fitBtn.click();
        expect(spy).toHaveBeenCalledWith('viewport:fit');
    });
});
