// Mock config.json so tests use a controlled set of breakpoints
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BreakpointManager from '../../assets/js/managers/BreakpointManager.js';
import { state } from '../../assets/js/core/AppState.js';
import { bus } from '../../assets/js/core/EventBus.js';

const mockBreakpoints = [
    { label: 'Mobile', minWidth: 320, maxWidth: 480, icon: '' },
    { label: 'Tablet', minWidth: 481, maxWidth: 768, icon: '' },
];

describe('BreakpointManager', () => {
    let manager;

    beforeEach(() => {
        bus.resetForTesting();
        BreakpointManager.resetForTesting();
        manager = BreakpointManager.getInstance();
        // Trigger initialization so #breakpoints are populated
        bus.emit('app:managers:init', {});
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    // ── singleton ────────────────────────────────────────────────────────────

    /**
     * @description getInstance() should always return the same object.
     */
    it('is a singleton', () => {
        expect(BreakpointManager.getInstance()).toBe(manager);
    });

    // ── getBreakpoints ───────────────────────────────────────────────────────

    /**
     * @description getBreakpoints should return a copy of the loaded breakpoints array.
     */
    it('getBreakpoints — returns the loaded breakpoints with correct shape', () => {
        const bps = manager.getBreakpoints();
        expect(bps.length).toBe(mockBreakpoints.length);
        bps.forEach(bp => {
            expect(bp).toHaveProperty('label');
            expect(bp).toHaveProperty('minWidth');
            expect(bp).toHaveProperty('maxWidth');
        });
    });

    /**
     * @description getBreakpoints should return a shallow copy, not the internal array.
     */
    it('getBreakpoints — returns a copy, not the internal reference', () => {
        const a = manager.getBreakpoints();
        const b = manager.getBreakpoints();
        expect(a).not.toBe(b);
    });

    // ── #handleBreakpointClick (via _test) ──────────────────────────────────

    /**
     * @description A single click should activate the breakpoint in max-width mode.
     */
    it('handleBreakpointClick — single click activates breakpoint at maxWidth', () => {
        const { handleBreakpointClick } = BreakpointManager._test();
        const bp = mockBreakpoints[0];
        const emitSpy = vi.spyOn(bus, 'emit');

        handleBreakpointClick(bp, { detail: 1 });

        expect(state.getMode()).toBe('device');
        expect(state.getActiveBreakpoint()).toMatchObject({
            label: bp.label,
            isMinMode: false,
            targetWidth: bp.maxWidth,
        });
        expect(emitSpy).toHaveBeenCalledWith('breakpoint:activated', expect.objectContaining({
            breakpoint: bp,
            isMinMode: false,
            targetWidth: bp.maxWidth,
        }));
    });

    /**
     * @description A double-click should delegate to resetToFit.
     */
    it('handleBreakpointClick — double click resets to fit', () => {
        const { handleBreakpointClick } = BreakpointManager._test();
        const emitSpy = vi.spyOn(bus, 'emit');

        handleBreakpointClick(mockBreakpoints[0], { detail: 2 });

        expect(state.getMode()).toBe('fit');
        expect(state.getActiveBreakpoint()).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith('viewport:fit', {});
    });

    // ── #resetToFit (via _test) ──────────────────────────────────────────────

    /**
     * @description resetToFit should set mode to 'fit', clear the breakpoint, and emit viewport:fit.
     */
    it('resetToFit — sets fit mode and emits viewport:fit', () => {
        const { resetToFit } = BreakpointManager._test();
        const emitSpy = vi.spyOn(bus, 'emit');

        resetToFit();

        expect(state.getMode()).toBe('fit');
        expect(state.getActiveBreakpoint()).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith('viewport:fit', {});
    });

    // ── #syncActiveButtonVisuals (via _test) ─────────────────────────────────

    /**
     * @description syncActiveButtonVisuals should add .active to the matching button.
     */
    it('syncActiveButtonVisuals — adds .active to the matching button', () => {
        const { syncActiveButtonVisuals } = BreakpointManager._test();

        const group = document.createElement('div');
        group.className = 'controls-group';
        const btn = document.createElement('button');
        btn.dataset.mode = 'Mobile';
        group.appendChild(btn);
        document.body.appendChild(group);

        syncActiveButtonVisuals(mockBreakpoints[0]);
        expect(btn.classList.contains('active')).toBe(true);
    });

    /**
     * @description Passing null to syncActiveButtonVisuals should remove all .active classes.
     */
    it('syncActiveButtonVisuals — null clears all active states', () => {
        const { syncActiveButtonVisuals } = BreakpointManager._test();

        const group = document.createElement('div');
        group.className = 'controls-group';
        const btn = document.createElement('button');
        btn.dataset.mode = 'Mobile';
        btn.classList.add('active');
        group.appendChild(btn);
        document.body.appendChild(group);

        syncActiveButtonVisuals(null);
        expect(btn.classList.contains('active')).toBe(false);
    });

    // ── resetForTesting ──────────────────────────────────────────────────────

    /**
     * @description resetForTesting should allow a fresh singleton to be created.
     */
    it('resetForTesting — allows re-instantiation', () => {
        BreakpointManager.resetForTesting();
        const fresh = BreakpointManager.getInstance();
        expect(fresh).not.toBeNull();
    });
});
