/**
 * KeyboardManager - Singleton
 * 
 * Desktop keyboard shortcuts for rapid prototyping.
 * Mirrors mouse behavior for 1-9: 
 *   - First press = Max width
 *   - Second press on same number = Min width
 * 
 * @since 0.2.0
 */

import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import BreakpointManager from './BreakpointManager.js';

let instance = null;

export class KeyboardManager {
    #lastActivatedIndex = -1;   // Tracks last pressed number key for toggle behavior

    constructor() {
        if (instance) {
            throw new Error('KeyboardManager is a singleton. Use getInstance().');
        }
        this.#setupListeners();
        this.#setupEventBusListeners();

        instance = this;
    }

    static getInstance() {
        if (!instance) {
            instance = new KeyboardManager();
        }
        return instance;
    }

    #setupListeners() {
        document.addEventListener('keydown', (e) => {
            // Ignore shortcuts when user is typing in input fields
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                return;
            }

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

                // Fit / Reset
                case 'f':
                case 'r':
                    this.#triggerFit();
                    e.preventDefault();
                    break;

                case 'escape':
                    this.#clearMode();
                    break;

                // Help overlay
                case '?':
                case '/':
                    if (shift || key === '?') {
                        this.#toggleHelpOverlay();
                    }
                    break;

                default:
                    // Number keys 1-9 for breakpoints (with toggle support)
                    if (key >= '1' && key <= '9') {
                        const index = parseInt(key) - 1;
                        this.#selectBreakpointByIndex(index);
                    }
                    break;
            }
        });
    }

    #setupEventBusListeners() {
        bus.on('ui:helpClicked', () => { this.#toggleHelpOverlay(); });
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
        console.log('Keyboard: Fit to Container triggered');
    }

    #clearMode() {
        state.setMode('manual');
        state.setActiveBreakpoint(null);
        console.log('Keyboard: Mode cleared (Esc)');
    }

    #selectBreakpointByIndex(index) {
        const bpManager = BreakpointManager;
        const breakpoints = bpManager.getBreakpoints();

        if (index < 0 || index >= breakpoints.length) return;

        const bp = breakpoints[index];
        const isSameAsLast = this.#lastActivatedIndex === index;
        
        // Mirror mouse behavior: first press = Max, second press on same = Min
        const isMinMode = isSameAsLast 
            ? !(state.getActiveBreakpoint()?.isMinMode || false) 
            : false;

        const targetWidth = isMinMode ? bp.minWidth : bp.maxWidth;

        state.setMode('device');
        state.setActiveBreakpoint({ 
            ...bp, 
            isMinMode, 
            targetWidth 
        });

        bus.emit('breakpoint:activated', { 
            breakpoint: bp, 
            isMinMode, 
            targetWidth 
        });

        this.#lastActivatedIndex = index;

        console.log(`Keyboard: ${isMinMode ? 'Min' : 'Max'} → ${bp.label} (${targetWidth}px)`);
    }

    #toggleHelpOverlay() {
        if (this.#helpOverlay && this.#isHelpVisible) {
            this.#hideHelpOverlay();
        } else {
            this.#showHelpOverlay();
        }
    }

    #showHelpOverlay() {
        if (this.#helpOverlay) this.#helpOverlay.remove();

        this.#helpOverlay = document.createElement('div');
        this.#helpOverlay.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.92); 
            color: white; 
            padding: 24px 28px; 
            border-radius: 8px;
            z-index: 20000; 
            font-family: monospace; 
            max-width: 460px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            line-height: 1.5;
        `;

        this.#helpOverlay.innerHTML = `
            <h3 style="margin:0 0 18px 0; color:#4fc3f7;">Keyboard Shortcuts</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr><td style="padding:4px 0;">← →</td><td>Resize width (±1 / ±10 Shift / ±50 Ctrl)</td></tr>
                <tr><td style="padding:4px 0;">↑ ↓</td><td>Resize height (±1 / ±10 Shift / ±50 Ctrl)</td></tr>
                <tr><td style="padding:4px 0;">1–9</td><td>Quick breakpoint (1st = Max, 2nd = Min)</td></tr>
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

    // Private properties for help overlay
    #helpOverlay = null;
    #isHelpVisible = false;
}

export default KeyboardManager.getInstance();