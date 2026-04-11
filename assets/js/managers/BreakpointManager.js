/**
 * BreakpointManager - Singleton
 * 
 * Full dynamic breakpoint management for Stage 1.
 * Handles loading, button generation, single-click (max ↔ min toggle), double-click (fit), 
 * and proper state synchronization.
 * 
 * @since 0.1.0-beta
 */

import config from "../../../config.json" with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import { UIFactory } from '../core/UIFactory.js';
import UIManager from "./UIManager.js";

let instance = null;

export class BreakpointManager {
    #breakpoints = [];
    #buttonContainer = null;

    constructor() {
        if (instance) throw new Error('BreakpointManager is a singleton.');
        instance = this;

        // Setup event subscriptions early
        this.#setupSubscriptions();
    }

    static getInstance() {
        if (!instance) instance = new BreakpointManager([]);
        return instance;
    }

    #setupSubscriptions() {
        // Listen for app manager initialization signal
        bus.on('app:managers:init', () => this.#loadAndInitialize());

        // Listen for state changes to sync visuals
        bus.on('state:activeBreakpointChanged', ({ value }) => this.#syncActiveButtonVisuals(value));

        // Clear all device highlights when fit mode is entered (drag highlight may not trigger
        // state:activeBreakpointChanged if activeBreakpoint was already null)
        bus.on('state:modeChanged', ({ value }) => {
            if (value === 'fit') this.#syncActiveButtonVisuals(null);
        });

        // Highlight the matching breakpoint range button during manual/drag resize
        bus.on('state:viewportChanged', ({ value }) => this.#syncButtonVisualsForWidth(value.width));

        // Listen for app ready to create UI
        bus.on('app:ready', () => this.#initializeUI());
    }

    #loadAndInitialize() {
        try {
            const raw = config.ui_controls.breakpoints || [];
            this.#breakpoints = raw.map(bp => ({
                label: bp.label,
                minWidth: Number(bp.minWidth ?? bp['min-width']),
                maxWidth: Number(bp.maxWidth ?? bp['max-width']),
                icon: bp.icon
            })).filter(bp => bp.label && !isNaN(bp.minWidth) && !isNaN(bp.maxWidth));
            
            bus.emit('breakpoints:loaded', { count: this.#breakpoints.length });
            bus.emit('breakpoints:ready', {});
        } catch (err) {
            console.error('Breakpoint config load failed:', err);
            bus.emit('config:error', { type: 'breakpoints', message: err.message });
            this.#breakpoints = [];
        }
    }

    #initializeUI() {
        const UI = UIManager.getInstance();
        this.#buttonContainer = UI.deviceContainer;

        if (!this.#buttonContainer) {
            console.warn('Device button container not found via UIManager.');
            return;
        }

        this.#breakpoints.forEach((bp, index) => {
            const button = UIFactory.createDeviceButton(bp, index);
            button.addEventListener('click', (e) => this.#handleBreakpointClick(bp, e));
            button.addEventListener('dblclick', (e) => { e.stopImmediatePropagation(); this.#resetToFit(); });
            this.#buttonContainer.appendChild(button);
        });
    }

    #handleBreakpointClick(breakpoint, event) {
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

    #syncButtonVisualsForWidth(width) {
        // Only show passive range hint in manual mode (drag / custom input)
        if (state.getMode() !== 'manual') return;
        const match = this.#breakpoints.find(bp => width >= bp.minWidth && width <= bp.maxWidth);
        this.#syncActiveButtonVisuals(match || null);
    }

    getBreakpoints() { return [...this.#breakpoints]; }

    static resetForTesting() {
        if (import.meta.env?.TEST || process.env.NODE_ENV === 'test') {
            instance = null;
        }
    }

    // Expose private methods for testing
    static _test() {
        if (!instance) {
            instance = new BreakpointManager([]); // Initialize with an empty array or mock breakpoints
        }
        return {
            resetToFit: instance.#resetToFit.bind(instance),
            syncActiveButtonVisuals: instance.#syncActiveButtonVisuals.bind(instance),
            handleBreakpointClick: instance.#handleBreakpointClick.bind(instance)
        };
    }
}

export default BreakpointManager;