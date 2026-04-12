import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IFrameController from '../../assets/js/managers/IFrameController.js';
import { bus } from '../../assets/js/core/EventBus.js';
import { state } from '../../assets/js/core/AppState.js';

describe('IFrameController', () => {
    beforeEach(() => {
        bus.resetForTesting();
        IFrameController.resetForTesting();
        // Set a known starting viewport so tests have a predictable baseline
        state.updateViewport(1024, 768);
        state.setMode('manual');
        state.setActiveBreakpoint(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── singleton ─────────────────────────────────────────────────────────────

    /**
     * @description getInstance() should always return the same object.
     */
    it('is a singleton', () => {
        const a = IFrameController.getInstance();
        const b = IFrameController.getInstance();
        expect(a).toBe(b);
    });

    /**
     * @description Constructing a second instance directly should throw.
     */
    it('throws when constructed directly after first instance', () => {
        IFrameController.getInstance(); // prime the singleton
        expect(() => new IFrameController()).toThrow('singleton');
    });

    // ── getCurrentSize ────────────────────────────────────────────────────────

    /**
     * @description getCurrentSize should reflect the current AppState viewport.
     */
    it('getCurrentSize — returns width, height and mode from state', () => {
        state.updateViewport(800, 600);
        state.setMode('manual');
        const size = IFrameController.getCurrentSize();
        expect(size.width).toBe(state.clampWidth(800));
        expect(size.height).toBe(state.clampHeight(600));
        expect(size.mode).toBe('manual');
    });

    // ── breakpoint:activated ──────────────────────────────────────────────────

    /**
     * @description Emitting breakpoint:activated with a valid targetWidth should
     * update the viewport width in state.
     */
    it('breakpoint:activated — updates viewport width via state', () => {
        IFrameController.getInstance(); // ensure subscriptions are registered
        const spy = vi.spyOn(state, 'updateViewport');

        bus.emit('breakpoint:activated', { targetWidth: 480 });

        expect(spy).toHaveBeenCalledWith(480, expect.any(Number));
    });

    /**
     * @description breakpoint:activated with a non-numeric targetWidth should be ignored.
     */
    it('breakpoint:activated — ignores non-numeric targetWidth', () => {
        IFrameController.getInstance();
        const spy = vi.spyOn(state, 'updateViewport');

        bus.emit('breakpoint:activated', { targetWidth: 'bad' });

        expect(spy).not.toHaveBeenCalled();
    });

    // ── input:stepChanged ─────────────────────────────────────────────────────

    /**
     * @description input:stepChanged targeting width should nudge the viewport width.
     */
    it('input:stepChanged — width nudges state viewport width', () => {
        IFrameController.getInstance();
        state.updateViewport(800, 600);
        const before = state.getViewport().width;

        bus.emit('input:stepChanged', { target: 'width', direction: 1, step: 10 });

        expect(state.getViewport().width).toBe(state.clampWidth(before + 10));
    });

    /**
     * @description input:stepChanged targeting height should nudge the viewport height.
     */
    it('input:stepChanged — height nudges state viewport height', () => {
        IFrameController.getInstance();
        state.updateViewport(800, 700);
        const before = state.getViewport().height;

        bus.emit('input:stepChanged', { target: 'height', direction: -1, step: 5 });

        expect(state.getViewport().height).toBe(state.clampHeight(before - 5));
    });

    /**
     * @description input:stepChanged in manual/drag mode should switch state to 'manual'.
     */
    it('input:stepChanged — sets mode to manual', () => {
        IFrameController.getInstance();
        state.setMode('device');

        bus.emit('input:stepChanged', { target: 'width', direction: 1, step: 1 });

        expect(state.getMode()).toBe('manual');
    });

    // ── resetForTesting ───────────────────────────────────────────────────────

    /**
     * @description resetForTesting should allow a fresh singleton to be created.
     */
    it('resetForTesting — allows re-instantiation', () => {
        IFrameController.getInstance();
        IFrameController.resetForTesting();
        const fresh = IFrameController.getInstance();
        expect(fresh).not.toBeNull();
    });
});
