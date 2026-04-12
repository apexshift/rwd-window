import { describe, it, expect, vi, beforeEach } from 'vitest';
import { state } from '../../assets/js/core/AppState.js';
import { bus } from '../../assets/js/core/EventBus.js';

describe('AppState — clamping', () => {
    let clamping;

    beforeEach(() => {
        bus.resetForTesting();
        clamping = state.getClamping();
    });

    /**
     * @description getClamping should return a copy of the clamping config.
     */
    it('returns the correct clamping values', () => {
        expect(state.getClamping()).toEqual(clamping);
    });

    /**
     * @description getClamping should return a shallow copy, not the internal object.
     */
    it('returns a copy — mutations do not affect internal state', () => {
        const copy = state.getClamping();
        copy.minWidth = 9999;
        expect(state.getClamping().minWidth).not.toBe(9999);
    });

    /**
     * @description clampWidth should enforce [minWidth, maxWidth].
     */
    it('clamps width within the defined range', () => {
        const { minWidth, maxWidth } = clamping;
        expect(state.clampWidth(minWidth - 100)).toBe(minWidth);
        expect(state.clampWidth(maxWidth + 100)).toBe(maxWidth);
        expect(state.clampWidth(Math.floor((minWidth + maxWidth) / 2))).toBe(Math.floor((minWidth + maxWidth) / 2));
    });

    /**
     * @description clampHeight should enforce [minHeight, maxHeight].
     */
    it('clamps height within the defined range', () => {
        const { minHeight, maxHeight } = clamping;
        expect(state.clampHeight(minHeight - 100)).toBe(minHeight);
        expect(state.clampHeight(maxHeight + 100)).toBe(maxHeight);
        expect(state.clampHeight(Math.floor((minHeight + maxHeight) / 2))).toBe(Math.floor((minHeight + maxHeight) / 2));
    });

    /**
     * @description Non-numeric inputs to clampWidth/clampHeight should fall back to min values.
     */
    it('handles invalid width and height inputs gracefully', () => {
        expect(state.clampWidth(null)).toBe(clamping.minWidth);
        expect(state.clampWidth(undefined)).toBe(clamping.minWidth);
        expect(state.clampWidth('invalid')).toBe(clamping.minWidth);

        expect(state.clampHeight(null)).toBe(clamping.minHeight);
        expect(state.clampHeight(undefined)).toBe(clamping.minHeight);
        expect(state.clampHeight('invalid')).toBe(clamping.minHeight);
    });
});

describe('AppState — setContainerWidth', () => {
    beforeEach(() => {
        bus.resetForTesting();
    });

    /**
     * @description setContainerWidth should update the maxWidth clamping ceiling.
     */
    it('updates maxWidth so subsequent clampWidth calls respect the new ceiling', () => {
        state.setContainerWidth(800);
        expect(state.clampWidth(9999)).toBe(800);
    });

    /**
     * @description setContainerWidth should emit state:containerWidthChanged.
     */
    it('emits state:containerWidthChanged with the new maxWidth', () => {
        const handler = vi.fn();
        bus.on('state:containerWidthChanged', handler);
        state.setContainerWidth(900);
        expect(handler).toHaveBeenCalledWith({ maxWidth: 900 });
    });

    /**
     * @description Calling setContainerWidth with the same value should not emit.
     */
    it('does not emit when the value has not changed', () => {
        state.setContainerWidth(750);
        const handler = vi.fn();
        bus.on('state:containerWidthChanged', handler);
        state.setContainerWidth(750);
        expect(handler).not.toHaveBeenCalled();
    });
});

describe('AppState — setContainerHeight', () => {
    beforeEach(() => {
        bus.resetForTesting();
    });

    /**
     * @description setContainerHeight should update the maxHeight clamping ceiling.
     */
    it('updates maxHeight so subsequent clampHeight calls respect the new ceiling', () => {
        state.setContainerHeight(700);
        expect(state.clampHeight(9999)).toBe(700);
    });

    /**
     * @description setContainerHeight should emit state:containerHeightChanged.
     */
    it('emits state:containerHeightChanged with the new maxHeight', () => {
        const handler = vi.fn();
        bus.on('state:containerHeightChanged', handler);
        state.setContainerHeight(800);
        expect(handler).toHaveBeenCalledWith({ maxHeight: 800 });
    });

    /**
     * @description Calling setContainerHeight with the same value should not emit.
     */
    it('does not emit when the value has not changed', () => {
        state.setContainerHeight(750);
        const handler = vi.fn();
        bus.on('state:containerHeightChanged', handler);
        state.setContainerHeight(750);
        expect(handler).not.toHaveBeenCalled();
    });
});

describe('AppState — reactive state', () => {
    beforeEach(() => {
        bus.resetForTesting();
    });

    /**
     * @description updateViewport should emit state:viewportChanged.
     */
    it('emits state:viewportChanged when dimensions change', () => {
        const handler = vi.fn();
        bus.on('state:viewportChanged', handler);
        state.updateViewport(1024, 768);
        expect(handler).toHaveBeenCalled();
        const { value } = handler.mock.calls[0][0];
        expect(value.width).toBe(state.clampWidth(1024));
        expect(value.height).toBe(state.clampHeight(768));
    });

    /**
     * @description set() should not emit when the value is identical (deep equality).
     */
    it('does not emit when set() is called with an identical value', () => {
        state.setMode('manual');
        const handler = vi.fn();
        bus.on('state:modeChanged', handler);
        state.setMode('manual');
        expect(handler).not.toHaveBeenCalled();
    });

    /**
     * @description setMode should emit state:modeChanged on change.
     */
    it('emits state:modeChanged when mode changes', () => {
        const handler = vi.fn();
        bus.on('state:modeChanged', handler);
        state.setMode('fit');
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({ value: 'fit' }));
    });

    /**
     * @description setActiveBreakpoint should emit state:activeBreakpointChanged.
     */
    it('emits state:activeBreakpointChanged when active breakpoint changes', () => {
        const handler = vi.fn();
        bus.on('state:activeBreakpointChanged', handler);
        const bp = { label: 'Mobile', minWidth: 320, maxWidth: 480 };
        state.setActiveBreakpoint(bp);
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({ value: bp }));
    });

    /**
     * @description getViewport should return a copy, not a direct reference.
     */
    it('getViewport returns a copy — mutations do not affect internal state', () => {
        const vp = state.getViewport();
        vp.width = 9999;
        expect(state.getViewport().width).not.toBe(9999);
    });
});
