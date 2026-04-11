import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UIFactory } from '../../assets/js/core/UIFactory.js';

describe('UIFactory', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        // Suppress the expected "icon should be SVG or path" console.warn that
        // UIFactory emits when an empty icon string is passed in tests.
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    // ── getWrapper ──────────────────────────────────────────────────────────

    /**
     * @description getWrapper should return the first element matching the selector.
     */
    it('getWrapper — returns the matching element', () => {
        const el = document.createElement('div');
        el.id = 'test-wrapper';
        container.appendChild(el);
        expect(UIFactory.getWrapper('#test-wrapper')).toBe(el);
    });

    /**
     * @description getWrapper should throw for non-string selectors.
     */
    it('getWrapper — throws for non-string selector', () => {
        expect(() => UIFactory.getWrapper(123)).toThrow('@param[id] must be typeof string');
        expect(() => UIFactory.getWrapper(null)).toThrow('@param[id] must be typeof string');
        expect(() => UIFactory.getWrapper(undefined)).toThrow('@param[id] must be typeof string');
    });

    // ── createControlsContainer ─────────────────────────────────────────────

    /**
     * @description Should create a <fieldset> with the given id and controls-group class.
     */
    it('createControlsContainer — creates a fieldset with id and class', () => {
        const el = UIFactory.createControlsContainer('my-id');
        expect(el.tagName).toBe('FIELDSET');
        expect(el.id).toBe('my-id');
        expect(el.className).toBe('controls-group');
    });

    /**
     * @description Should create a fieldset without an id when none is provided.
     */
    it('createControlsContainer — no id when omitted', () => {
        const el = UIFactory.createControlsContainer();
        expect(el.tagName).toBe('FIELDSET');
        expect(el.id).toBe('');
    });

    // ── createButton ────────────────────────────────────────────────────────

    /**
     * @description createButton should throw for non-string icon or label.
     */
    it('createButton — throws for non-string icon or label', () => {
        expect(() => UIFactory.createButton('label', 123)).toThrow('@param[icon] must be typeof string');
        expect(() => UIFactory.createButton(123, 'icon')).toThrow('@param[label] must be typeof string');
    });

    /**
     * @description createButton with an SVG icon should set innerHTML directly.
     */
    it('createButton — inlines SVG icon', () => {
        const svg = '<svg><circle/></svg>';
        const btn = UIFactory.createButton('Icon', svg);
        expect(btn.innerHTML).toContain('<svg>');
    });

    /**
     * @description createButton with a path icon should create an <img> child.
     */
    it('createButton — creates <img> for path icons', () => {
        const btn = UIFactory.createButton('Icon', './icon.svg');
        expect(btn.querySelector('img')).not.toBeNull();
        expect(btn.querySelector('img').src).toContain('icon.svg');
    });

    /**
     * @description createButton with no icon should fall back to text content.
     */
    it('createButton — falls back to text when icon is empty', () => {
        const btn = UIFactory.createButton('Fallback');
        expect(btn.textContent).toBe('Fallback');
    });

    // ── createDeviceButton ──────────────────────────────────────────────────

    /**
     * @description createDeviceButton should set data attributes and title from the breakpoint.
     */
    it('createDeviceButton — sets data attributes and title', () => {
        const bp = { label: 'Mobile', icon: '', minWidth: 320, maxWidth: 480 };
        const btn = UIFactory.createDeviceButton(bp, 0);
        expect(btn.dataset.mode).toBe('Mobile');
        expect(btn.dataset.minWidth).toBe('320');
        expect(btn.dataset.maxWidth).toBe('480');
        expect(btn.title).toBe('Mobile (1)');
    });

    // ── createFitToContainerButton ──────────────────────────────────────────

    /**
     * @description createFitToContainerButton should start with the active class and fit mode.
     */
    it('createFitToContainerButton — has active class and fit data-mode', () => {
        const btn = UIFactory.createFitToContainerButton('Fit', '');
        expect(btn.classList.contains('active')).toBe(true);
        expect(btn.dataset.mode).toBe('fit');
    });

    // ── createHelpButton ────────────────────────────────────────────────────

    /**
     * @description createHelpButton should have the correct id and aria-label.
     */
    it('createHelpButton — has correct id and aria-label', () => {
        const btn = UIFactory.createHelpButton('Help', '');
        expect(btn.id).toBe('keyboard-help-btn');
        expect(btn.getAttribute('aria-label')).toBe('Show keyboard shortcuts');
    });

    // ── createIncrementButton ────────────────────────────────────────────────

    /**
     * @description createIncrementButton up should render '+' with correct data attributes.
     */
    it('createIncrementButton — up button has correct label and data', () => {
        const btn = UIFactory.createIncrementButton('up', true);
        expect(btn.textContent).toBe('+');
        expect(btn.dataset.direction).toBe('up');
        expect(btn.dataset.target).toBe('width');
    });

    /**
     * @description createIncrementButton down should render '−' targeting height.
     */
    it('createIncrementButton — down button for height has correct data', () => {
        const btn = UIFactory.createIncrementButton('down', false);
        expect(btn.textContent).toBe('−');
        expect(btn.dataset.direction).toBe('down');
        expect(btn.dataset.target).toBe('height');
    });

    // ── createControlWithIncrement ───────────────────────────────────────────

    /**
     * @description Should return a <label> containing an <input> and two step buttons.
     */
    it('createControlWithIncrement — returns label with input and two step buttons', () => {
        const label = UIFactory.createControlWithIncrement('W', 'width-control', true);
        expect(label.tagName).toBe('LABEL');
        const input = label.querySelector('#width-control');
        expect(input).not.toBeNull();
        expect(input.type).toBe('number');
        const btns = label.querySelectorAll('.app__control-increment');
        expect(btns.length).toBe(2);
    });

    /**
     * @description Width input should have a max attribute; height input should not.
     */
    it('createControlWithIncrement — width has max, height does not', () => {
        const widthLabel  = UIFactory.createControlWithIncrement('W', 'w', true);
        const heightLabel = UIFactory.createControlWithIncrement('H', 'h', false);
        expect(widthLabel.querySelector('#w').getAttribute('max')).not.toBeNull();
        expect(heightLabel.querySelector('#h').getAttribute('max')).toBeNull();
    });

    // ── createSelectControl ──────────────────────────────────────────────────

    /**
     * @description Should return a <label> containing a <select> with the given id.
     */
    it('createSelectControl — returns label containing a select element', () => {
        const label = UIFactory.createSelectControl('Load', 'file-loader');
        expect(label.tagName).toBe('LABEL');
        const select = label.querySelector('#file-loader');
        expect(select).not.toBeNull();
        expect(select.tagName).toBe('SELECT');
    });
});
