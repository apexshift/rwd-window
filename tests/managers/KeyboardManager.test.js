// Mock config.json for BreakpointManager dependency
vi.mock('../../config.json', () => ({
    default: {
        app: {
            clamping: { minWidth: 320, maxWidth: 1920, minHeight: 640, maxHeight: 1080 }
        },
        ui_controls: {
            breakpoints: [
                { label: 'Mobile', minWidth: 320, maxWidth: 480, icon: '' },
                { label: 'Tablet', minWidth: 481, maxWidth: 768, icon: '' },
            ],
        },
    }
}));

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { KeyboardManager } from '../../assets/js/managers/KeyboardManager.js';
import BreakpointManager from '../../assets/js/managers/BreakpointManager.js';
import { bus } from '../../assets/js/core/EventBus.js';
import { state } from '../../assets/js/core/AppState.js';

/** Fire a keydown event on document with optional modifiers. */
function fireKey(key, { shiftKey = false, ctrlKey = false, metaKey = false } = {}) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, ctrlKey, metaKey, bubbles: true }));
}

describe('KeyboardManager', () => {
    let manager;

    // Initialize once — registering a document keydown listener each time
    // beforeEach would stack multiple listeners and create false positives.
    beforeAll(() => {
        BreakpointManager.getInstance();
        bus.emit('app:managers:init', {});   // loads breakpoints into BreakpointManager

        manager = KeyboardManager.getInstance();
        bus.emit('app:managers:init', {});   // registers the document keydown listener
    });

    beforeEach(() => {
        state.updateViewport(800, 700);
        state.setMode('manual');
        state.setActiveBreakpoint(null);
        state.setCurrentDemo('');
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(() => {
        document.body.innerHTML = '';
    });

    // ── arrow keys — width ────────────────────────────────────────────────────

    /**
     * @description ArrowRight should increase viewport width by 1px.
     */
    it('ArrowRight — increases width by 1', () => {
        const before = state.getViewport().width;
        fireKey('ArrowRight');
        expect(state.getViewport().width).toBe(state.clampWidth(before + 1));
    });

    /**
     * @description ArrowLeft should decrease viewport width by 1px.
     */
    it('ArrowLeft — decreases width by 1', () => {
        const before = state.getViewport().width;
        fireKey('ArrowLeft');
        expect(state.getViewport().width).toBe(state.clampWidth(before - 1));
    });

    /**
     * @description Shift+ArrowRight should increase width by 10px.
     */
    it('Shift+ArrowRight — increases width by 10', () => {
        const before = state.getViewport().width;
        fireKey('ArrowRight', { shiftKey: true });
        expect(state.getViewport().width).toBe(state.clampWidth(before + 10));
    });

    /**
     * @description Ctrl+ArrowRight should increase width by 50px.
     */
    it('Ctrl+ArrowRight — increases width by 50', () => {
        const before = state.getViewport().width;
        fireKey('ArrowRight', { ctrlKey: true });
        expect(state.getViewport().width).toBe(state.clampWidth(before + 50));
    });

    // ── arrow keys — height ───────────────────────────────────────────────────

    /**
     * @description ArrowUp should increase viewport height by 1px.
     */
    it('ArrowUp — increases height by 1', () => {
        const before = state.getViewport().height;
        fireKey('ArrowUp');
        expect(state.getViewport().height).toBe(state.clampHeight(before + 1));
    });

    /**
     * @description ArrowDown should decrease viewport height by 1px.
     */
    it('ArrowDown — decreases height by 1', () => {
        const before = state.getViewport().height;
        fireKey('ArrowDown');
        expect(state.getViewport().height).toBe(state.clampHeight(before - 1));
    });

    // ── F key ─────────────────────────────────────────────────────────────────

    /**
     * @description Pressing F should emit viewport:fit on the bus.
     */
    it('F key — emits viewport:fit', () => {
        const spy = vi.spyOn(bus, 'emit');
        fireKey('f');
        expect(spy).toHaveBeenCalledWith('viewport:fit', {});
    });

    // ── Escape ────────────────────────────────────────────────────────────────

    /**
     * @description Escape should set mode to 'manual' and clear active breakpoint.
     */
    it('Escape — sets mode to manual and clears breakpoint', () => {
        state.setMode('device');
        state.setActiveBreakpoint({ label: 'Mobile' });
        fireKey('Escape');
        expect(state.getMode()).toBe('manual');
        expect(state.getActiveBreakpoint()).toBeNull();
    });

    // ── focus guard ───────────────────────────────────────────────────────────

    /**
     * @description Keyboard shortcuts should be ignored when an INPUT element is focused.
     */
    it('ignores shortcuts when an INPUT is focused', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        const before = state.getViewport().width;
        fireKey('ArrowRight');
        expect(state.getViewport().width).toBe(before);
    });

    // ── help / splash ─────────────────────────────────────────────────────────

    /**
     * @description First press of ? should save the current demo and load splash.html.
     */
    it('? key — first press loads splash.html', () => {
        state.setCurrentDemo('./demos/one.html');
        fireKey('?');
        expect(state.getCurrentDemo()).toBe('./splash.html');
    });

    /**
     * @description Second press of ? should restore the previously active demo.
     */
    it('? key — second press restores previous demo', () => {
        state.setCurrentDemo('./demos/one.html');
        fireKey('?');
        fireKey('?');
        expect(state.getCurrentDemo()).toBe('./demos/one.html');
    });

    /**
     * @description toggleHelp() first call should load splash.html.
     */
    it('toggleHelp() — first call loads splash.html', () => {
        state.setCurrentDemo('./demos/one.html');
        manager.toggleHelp();
        expect(state.getCurrentDemo()).toBe('./splash.html');
    });

    /**
     * @description toggleHelp() second call should restore the previous demo.
     */
    it('toggleHelp() — second call restores previous demo', () => {
        state.setCurrentDemo('./demos/one.html');
        manager.toggleHelp();
        manager.toggleHelp();
        expect(state.getCurrentDemo()).toBe('./demos/one.html');
    });
});
