/**
 * BreakpointManager - Singleton
 * 
 * Full dynamic breakpoint management for Stage 1.
 * Handles loading, button generation, single-click (max ↔ min toggle), double-click (fit), 
 * and proper state synchronization.
 * 
 * @since 0.1.0-beta
 */

import breakpointsConfig from "../../../config/breakpoints.json" with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import { UIFactory } from '../core/UIFactory.js';

let instance = null;

export class BreakpointManager {
    #breakpoints = [];
    #buttonContainer = null;

    constructor() {
        if (instance) throw new Error('BreakpointManager is a singleton.');
        this.#loadBreakpoints();
        this.#setupSubscriptions();
        instance = this;
    }

    static getInstance() {
        if (!instance) instance = new BreakpointManager();
        return instance;
    }

    #loadBreakpoints() {
        try {
            const raw = breakpointsConfig.breakpoints || [];
            this.#breakpoints = raw.map(bp => ({
                label: bp.label,
                minWidth: Number(bp.minWidth ?? bp['min-width']),
                maxWidth: Number(bp.maxWidth ?? bp['max-width']),
                icon: bp.icon
            })).filter(bp => bp.label && !isNaN(bp.minWidth) && !isNaN(bp.maxWidth));

            console.log(`✅ Loaded ${this.#breakpoints.length} breakpoints`);
            bus.emit('breakpoints:loaded', { count: this.#breakpoints.length });
        } catch (err) {
            console.error('Breakpoint config load failed:', err);
            bus.emit('config:error', { type: 'breakpoints', message: err.message });
            this.#breakpoints = [];
        }
    }

    #setupSubscriptions() {
        bus.on('app:ready', () => this.#initializeUI());
        bus.on('state:activeBreakpointChanged', ({ value }) => this.#syncActiveButtonVisuals(value));
    }

    #initializeUI() {
        this.#buttonContainer = document.querySelector('.controls-group#devices');
        if (!this.#buttonContainer) return;

        this.#breakpoints.forEach(bp => {
            const button = UIFactory.createDeviceButton(bp);
            button.addEventListener('click', (e) => this.#handleBreakpointClick(button, bp, e));
            button.addEventListener('dblclick', (e) => { e.stopImmediatePropagation(); this.#resetToFit(); });
            this.#buttonContainer.appendChild(button);
        });
    }

    #handleBreakpointClick(button, breakpoint, event) {
        if (event?.detail >= 2) {
            this.#resetToFit();
            return;
        }

        const current = state.getActiveBreakpoint();
        const isSame = current && current.label === breakpoint.label;
        const isMinMode = isSame ? !(current.isMinMode || false) : false;
        const targetWidth = isMinMode ? breakpoint.minWidth : breakpoint.maxWidth;

        state.setMode('device');
        state.setActiveBreakpoint({ ...breakpoint, isMinMode, targetWidth });
        this.#syncActiveButtonVisuals({ ...breakpoint, isMinMode });

        bus.emit('breakpoint:activated', { breakpoint, isMinMode, targetWidth });
    }

    #resetToFit() {
        state.setMode('fit');
        state.setActiveBreakpoint(null);
        bus.emit('viewport:fit', {});
    }

    #syncActiveButtonVisuals(activeBp) {
        document.querySelectorAll('.controls-group button').forEach(btn => btn.classList.remove('active'));
        if (!activeBp) return;
        const match = Array.from(document.querySelectorAll('.controls-group button'))
            .find(btn => btn.dataset.mode === activeBp.label);
        if (match) match.classList.add('active');
    }

    getBreakpoints() { return [...this.#breakpoints]; }
}

export default BreakpointManager.getInstance();