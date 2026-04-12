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

describe('AppState — persistence', () => {
    beforeEach(() => {
        bus.resetForTesting();
        localStorage.clear();
        vi.useFakeTimers();
        vi.clearAllTimers(); // discard any stale timers carried from previous tests
        // Restore default clamping so viewport assertions are predictable
        state.setContainerWidth(1920);
        state.setContainerHeight(1080);
    });

    afterEach(() => {
        vi.useRealTimers();
        localStorage.clear();
    });

    // ── saveToStorage ─────────────────────────────────────────────────────────

    /**
     * @description saveToStorage should write configured state keys to localStorage.
     */
    it('saveToStorage — writes configured keys to localStorage', () => {
        state.setMode('manual');
        state.updateViewport(800, 700);
        state.saveToStorage();

        const raw = localStorage.getItem('rwd-window-state');
        expect(raw).not.toBeNull();
        const stored = JSON.parse(raw);
        expect(stored.mode).toBe('manual');
        expect(stored.viewport.width).toBe(state.getViewport().width);
        expect(stored.viewport.height).toBe(state.getViewport().height);
    });

    // ── loadFromStorage ───────────────────────────────────────────────────────

    /**
     * @description loadFromStorage should restore all valid persisted keys.
     */
    it('loadFromStorage — restores valid viewport, mode, activeBreakpoint, and currentDemo', () => {
        const snapshot = {
            mode: 'device',
            viewport: { width: 800, height: 700 },
            activeBreakpoint: { label: 'Tablet', minWidth: 481, maxWidth: 768 },
            currentDemo: './demos/one.html'
        };
        localStorage.setItem('rwd-window-state', JSON.stringify(snapshot));

        state.loadFromStorage();

        expect(state.getMode()).toBe('device');
        expect(state.getViewport().width).toBe(800);
        expect(state.getViewport().height).toBe(700);
        expect(state.getActiveBreakpoint()?.label).toBe('Tablet');
        expect(state.getCurrentDemo()).toBe('./demos/one.html');
    });

    /**
     * @description loadFromStorage should skip a persisted mode that is not a valid enum value.
     */
    it('loadFromStorage — skips invalid mode value', () => {
        state.setMode('manual');
        localStorage.setItem('rwd-window-state', JSON.stringify({ mode: 'bogus' }));

        state.loadFromStorage();

        expect(state.getMode()).toBe('manual');
    });

    /**
     * @description loadFromStorage should skip a viewport where width or height is not a number.
     */
    it('loadFromStorage — skips malformed viewport', () => {
        state.updateViewport(800, 700);
        const before = state.getViewport();
        localStorage.setItem('rwd-window-state', JSON.stringify({ viewport: { width: 'bad', height: 700 } }));

        state.loadFromStorage();

        expect(state.getViewport()).toEqual(before);
    });

    /**
     * @description loadFromStorage should silently no-op when storage is empty.
     */
    it('loadFromStorage — no-ops when localStorage is empty', () => {
        state.setMode('manual');
        state.loadFromStorage();
        expect(state.getMode()).toBe('manual');
    });

    /**
     * @description loadFromStorage should handle corrupt JSON without throwing.
     */
    it('loadFromStorage — handles corrupt JSON gracefully', () => {
        state.setMode('manual');
        localStorage.setItem('rwd-window-state', 'not-valid-json{{{');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(() => state.loadFromStorage()).not.toThrow();
        expect(state.getMode()).toBe('manual');

        warn.mockRestore();
    });

    /**
     * @description loadFromStorage should not trigger auto-save during the load pass.
     */
    it('loadFromStorage — does not trigger auto-save during load', () => {
        localStorage.setItem('rwd-window-state', JSON.stringify({ mode: 'fit' }));
        const saveSpy = vi.spyOn(state, 'saveToStorage');

        state.loadFromStorage();
        vi.runAllTimers();

        expect(saveSpy).not.toHaveBeenCalled();
    });

    // ── reset ─────────────────────────────────────────────────────────────────

    /**
     * @description reset should remove the persisted storage entry.
     */
    it('reset — clears localStorage', () => {
        state.saveToStorage();
        expect(localStorage.getItem('rwd-window-state')).not.toBeNull();

        state.reset();

        expect(localStorage.getItem('rwd-window-state')).toBeNull();
    });

    /**
     * @description reset should restore all state keys to their default values.
     */
    it('reset — restores default state values', () => {
        state.setMode('device');
        state.setCurrentDemo('./demos/one.html');

        state.reset();

        expect(state.getMode()).toBe('manual');
        expect(state.getActiveBreakpoint()).toBeNull();
        expect(state.getCurrentDemo()).toBe('');
    });

    // ── auto-save ─────────────────────────────────────────────────────────────

    /**
     * @description A state change should write to localStorage once the debounce
     * timer fires. Nothing is written before timers run.
     */
    it('set() — auto-save writes state to localStorage after a change', () => {
        state.setMode('fit');

        // Timer not yet elapsed — storage still empty (beforeEach cleared it)
        expect(localStorage.getItem('rwd-window-state')).toBeNull();

        vi.runAllTimers();

        const stored = JSON.parse(localStorage.getItem('rwd-window-state'));
        expect(stored?.mode).toBe('fit');
    });

    /**
     * @description Rapid successive changes should batch into a single write
     * whose value reflects the final state, not intermediate states.
     */
    it('set() — rapid changes batch into one write with the final value', () => {
        state.setMode('fit');
        state.setMode('manual');
        state.setMode('device');

        vi.runAllTimers();

        const stored = JSON.parse(localStorage.getItem('rwd-window-state'));
        expect(stored?.mode).toBe('device');
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
