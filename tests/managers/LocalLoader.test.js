// Mock config.json with a controlled file list
vi.mock('../../config.json', () => ({
    default: {
        app: {
            clamping: { minWidth: 320, maxWidth: 1920, minHeight: 640, maxHeight: 1080 }
        },
        ui_controls: { breakpoints: [] },
        files: [
            { id: 1, label: 'Demo One',   value: './demos/one.html' },
            { id: 2, label: 'Demo Two',   value: './demos/two.html' },
        ]
    }
}));

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { LocalLoader } from '../../assets/js/managers/LocalLoader.js';
import UIManager from '../../assets/js/managers/UIManager.js';
import { bus } from '../../assets/js/core/EventBus.js';
import { state } from '../../assets/js/core/AppState.js';

const mockFiles = [
    { id: 1, label: 'Demo One', value: './demos/one.html' },
    { id: 2, label: 'Demo Two', value: './demos/two.html' },
];

describe('LocalLoader', () => {
    let loader;

    // Initialize once so the constructor's bus listeners (state:currentDemoChanged,
    // app:managers:init, ui:ready) survive for the full suite. Resetting the bus
    // in beforeEach would wipe those listeners and break integration tests.
    beforeAll(() => {
        loader = LocalLoader.getInstance();
        bus.emit('app:managers:init', {});  // triggers #initializeManager → loads files
    });

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── singleton ─────────────────────────────────────────────────────────────

    /**
     * @description getInstance() should always return the same object.
     */
    it('is a singleton', () => {
        expect(LocalLoader.getInstance()).toBe(loader);
    });

    // ── getFiles ──────────────────────────────────────────────────────────────

    /**
     * @description getFiles should return the files array after initialization.
     */
    it('getFiles — returns the loaded file list', () => {
        const files = loader.getFiles();
        expect(files).toHaveLength(mockFiles.length);
        expect(files[0].label).toBe('Demo One');
    });

    // ── getFileURLById ────────────────────────────────────────────────────────

    /**
     * @description getFileURLById should return the file URL for a valid id.
     */
    it('getFileURLById — returns the correct URL for a valid id', () => {
        expect(loader.getFileURLById(1)).toBe('./demos/one.html');
    });

    /**
     * @description getFileURLById should return null for an unknown id.
     */
    it('getFileURLById — returns null for an unknown id', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(loader.getFileURLById(99)).toBeNull();
        warn.mockRestore();
    });

    /**
     * @description getFileURLById should throw for non-numeric input.
     */
    it('getFileURLById — throws for non-numeric input', () => {
        expect(() => loader.getFileURLById('1')).toThrow('param(@id) must be typeof number');
        expect(() => loader.getFileURLById(null)).toThrow('param(@id) must be typeof number');
    });

    // ── getFileByLabel ────────────────────────────────────────────────────────

    /**
     * @description getFileByLabel should return the file URL for a valid label.
     */
    it('getFileByLabel — returns the correct URL for a valid label', () => {
        expect(loader.getFileByLabel('Demo Two')).toBe('./demos/two.html');
    });

    /**
     * @description getFileByLabel should return null for an unknown label.
     */
    it('getFileByLabel — returns null for an unknown label', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(loader.getFileByLabel('Unknown')).toBeNull();
        warn.mockRestore();
    });

    /**
     * @description getFileByLabel should throw for non-string input.
     */
    it('getFileByLabel — throws for non-string input', () => {
        expect(() => loader.getFileByLabel(1)).toThrow('param(@label) must be typeof string');
        expect(() => loader.getFileByLabel(null)).toThrow('param(@label) must be typeof string');
    });

    // ── handleDemoChange ──────────────────────────────────────────────────────

    /**
     * @description handleDemoChange should update state and emit demo:changed.
     */
    it('handleDemoChange — updates state and emits demo:changed', () => {
        const spy = vi.spyOn(bus, 'emit');
        loader.handleDemoChange('./demos/one.html');
        expect(state.getCurrentDemo()).toBe('./demos/one.html');
        expect(spy).toHaveBeenCalledWith('demo:changed', { value: './demos/one.html' });
    });

    // ── populateSelect — persistence restore ──────────────────────────────────

    /**
     * @description populateSelect should apply the persisted demo to the iframe
     * when state has a non-empty currentDemo on startup.
     */
    it('populateSelect — restores persisted demo to the iframe', () => {
        const select = document.createElement('select');
        select.innerHTML = `
            <option value="./demos/one.html">Demo One</option>
            <option value="./demos/two.html">Demo Two</option>
        `;
        vi.spyOn(UIManager, 'getInstance').mockReturnValue({ fileSelect: select });

        const mockIframe = { src: '' };
        vi.spyOn(document, 'querySelector').mockReturnValue(mockIframe);

        state.setCurrentDemo('./demos/two.html');
        loader.populateSelect();

        expect(select.value).toBe('./demos/two.html');
        expect(mockIframe.src).toBe('./demos/two.html');
    });

    /**
     * @description populateSelect should leave the iframe unchanged when currentDemo is empty.
     */
    it('populateSelect — does not update iframe when currentDemo is empty', () => {
        const select = document.createElement('select');
        select.innerHTML = `<option value="./demos/one.html">Demo One</option>`;
        vi.spyOn(UIManager, 'getInstance').mockReturnValue({ fileSelect: select });

        const mockIframe = { src: 'original' };
        vi.spyOn(document, 'querySelector').mockReturnValue(mockIframe);

        state.setCurrentDemo('');
        loader.populateSelect();

        expect(mockIframe.src).toBe('original');
    });

    // ── iframe src update ─────────────────────────────────────────────────────

    /**
     * @description state:currentDemoChanged should update the iframe src.
     * The constructor registers this listener permanently so it survives
     * across tests (no bus.resetForTesting() is called in this suite).
     * A plain-object mock for document.querySelector avoids happy-dom
     * attempting a real network fetch when iframe.src is assigned.
     */
    it('state:currentDemoChanged — updates iframe src', () => {
        const mockIframe = { src: '' };
        vi.spyOn(document, 'querySelector').mockReturnValue(mockIframe);
        state.setCurrentDemo('./demos/two.html');
        expect(mockIframe.src).toBe('./demos/two.html');
    });
});
