/**
 * KeyboardManager - Singleton
 * 
 * Enhanced keyboard shortcuts for Stage 2.
 * New additions:
 * - Tab / Shift+Tab → Cycle through breakpoints
 * - H → Toggle between min and max clamp heights
 * 
 * @since 0.2.0
 */

import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import BreakpointManager from './BreakpointManager.js';

let instance = null;

export class KeyboardManager {
    #lastActivatedIndex = -1;
    #helpOverlay = null;
    #isHelpVisible = false;

    constructor() {
        if (instance) throw new Error('KeyboardManager is a singleton.');
        this.#setupListeners();
        this.#setupEventBusListeners();
        instance = this;
    }

    static getInstance() {
        if (!instance) instance = new KeyboardManager();
        return instance;
    }

    #setupListeners() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            switch (key) {
                case 'arrowright':
                    this.#resizeWidth(1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowleft':
                    this.#resizeWidth(-1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowup':
                    this.#resizeHeight(1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;
                case 'arrowdown':
                    this.#resizeHeight(-1 * (shift ? 10 : 1) * (ctrl ? 50 : 1));
                    e.preventDefault();
                    break;

                case 'f':
                    this.#triggerFit();
                    e.preventDefault();
                    break;

                case 'escape':
                    this.#clearMode();
                    break;

                case 'tab':
                    if (shift) {
                        this.#cycleBreakpoint(-1);
                    } else {
                        this.#cycleBreakpoint(1);
                    }
                    e.preventDefault();
                    break;

                case 'h':
                    this.#toggleHeightClamp();
                    break;

                case '?':
                case '/':
                    if (shift || key === '?') this.#toggleHelpOverlay();
                    break;

                default:
                    if (key >= '1' && key <= '9') {
                        const index = parseInt(key) - 1;
                        this.#selectBreakpointByIndex(index);
                    }
                    break;
            }
        });
    }

    #setupEventBusListeners() {
        bus.on('ui:helpClicked', () => this.#toggleHelpOverlay());
    }

    #resizeWidth(delta) {
        const current = state.getViewport();
        state.updateViewport(current.width + delta, current.height);
    }

    #resizeHeight(delta) {
        const current = state.getViewport();
        state.updateViewport(current.width, current.height + delta);
    }

    #triggerFit() {
        bus.emit('viewport:fit', {});
    }

    #clearMode() {
        state.setMode('manual');
        state.setActiveBreakpoint(null);
    }

    #selectBreakpointByIndex(index) {
        const bpManager = BreakpointManager.getInstance();
        const breakpoints = bpManager.getBreakpoints();
        if (index < 0 || index >= breakpoints.length) return;

        const bp = breakpoints[index];
        const isSameAsLast = this.#lastActivatedIndex === index;
        const isMinMode = isSameAsLast ? !(state.getActiveBreakpoint()?.isMinMode || false) : false;
        const targetWidth = isMinMode ? bp.minWidth : bp.maxWidth;

        state.setMode('device');
        state.setActiveBreakpoint({ ...bp, isMinMode, targetWidth });
        bus.emit('breakpoint:activated', { breakpoint: bp, isMinMode, targetWidth });

        this.#lastActivatedIndex = index;
    }

    #cycleBreakpoint(direction) {
        const bpManager = BreakpointManager.getInstance();
        const breakpoints = bpManager.getBreakpoints();
        if (breakpoints.length === 0) return;

        let currentIndex = this.#lastActivatedIndex;
        if (currentIndex === -1) currentIndex = 0;

        const nextIndex = (currentIndex + direction + breakpoints.length) % breakpoints.length;
        this.#selectBreakpointByIndex(nextIndex);
    }

    #toggleHeightClamp() {
        const current = state.getViewport();
        const clamping = state.getClamping();

        // Toggle between min and max height clamp
        const newHeight = current.height === clamping.minHeight 
            ? clamping.maxHeight 
            : clamping.minHeight;

        state.updateViewport(current.width, newHeight);
        console.log(`Keyboard: Height clamped to ${newHeight}px`);
    }

    #toggleHelpOverlay() {
        if (this.#isHelpVisible) {
            this.#hideHelpOverlay();
        } else {
            this.#showHelpOverlay();
        }
    }

    #showHelpOverlay() {
        if (this.#helpOverlay) this.#helpOverlay.remove();

        this.#helpOverlay = document.createElement('div');
        this.#helpOverlay.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.92); color: white; padding: 24px 28px; 
            border-radius: 8px; z-index: 20000; font-family: monospace; 
            max-width: 480px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        `;

        this.#helpOverlay.innerHTML = `
            <h3 style="margin:0 0 18px 0; color:#4fc3f7;">Keyboard Shortcuts</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr><td style="padding:4px 0;">← →</td><td>Resize width (±1 / ±10 Shift / ±50 Ctrl)</td></tr>
                <tr><td style="padding:4px 0;">↑ ↓</td><td>Resize height (±1 / ±10 Shift / ±50 Ctrl)</td></tr>
                <tr><td style="padding:4px 0;">1–9</td><td>Quick breakpoint (1st = Max, 2nd = Min)</td></tr>
                <tr><td style="padding:4px 0;">Tab / Shift+Tab</td><td>Cycle through breakpoints</td></tr>
                <tr><td style="padding:4px 0;">H</td><td>Toggle between min and max height clamp</td></tr>
                <tr><td style="padding:4px 0;">F / R</td><td>Fit to Container</td></tr>
                <tr><td style="padding:4px 0;">Esc</td><td>Clear current mode</td></tr>
                <tr><td style="padding:4px 0;">? / Shift+/</td><td>Show this help</td></tr>
            </table>
            <div style="margin-top:20px; font-size:12px; opacity:0.75; text-align:center;">
                Click anywhere or press ? to close
            </div>
        `;

        this.#helpOverlay.addEventListener('click', () => this.#hideHelpOverlay());
        document.body.appendChild(this.#helpOverlay);
        this.#isHelpVisible = true;
    }

    #hideHelpOverlay() {
        if (this.#helpOverlay) {
            this.#helpOverlay.remove();
            this.#helpOverlay = null;
        }
        this.#isHelpVisible = false;
    }

    // Public API
    toggleHelp() {
        this.#toggleHelpOverlay();
    }
}

export default KeyboardManager;