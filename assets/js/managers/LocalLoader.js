import config from "../../../config.json" with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import UIManager from "./UIManager.js";

/**
 * LocalLoader – Singleton
 * 
 * Handles parsing file-loader.json and managing the demo select + iframe src.
 * Now decoupled via EventBus + AppState. Your recent select/iframe improvements preserved.
 * 
 * @since 0.1.0-beta (infrastructure refactor applied)
 */

let instance = null;

export class LocalLoader {
    #defaults = {
        selectElement: null
    };

    #files;

    constructor() {
        if (instance) {
            throw new Error('LocalLoader is a singleton. Use LocalLoader.getInstance() instead.');
        }

        instance = this;

        // Setup state change subscription early
        bus.on('state:currentDemoChanged', ({ value }) => {
            this.#updateIframeFromDemo(value);
        });

        // Listen for app manager initialization
        bus.on('app:managers:init', () => this.#initializeManager());
        
        // Listen for UI ready to populate select
        bus.on('ui:ready', () => this.#populateSelectIfReady());
    }

    static getInstance() {
        if (!instance) {
            instance = new LocalLoader();
        }
        return instance;
    }

    #initializeManager() {
        // Load files from config
        if (!config.files?.length) {
            console.error('File loader config is missing or empty.');
            bus.emit('config:error', { type: 'files', message: 'No files configured' });
            return;
        }

        this.#defaults = { ...this.#defaults, ...config };
        this.#files = config.files;

        bus.emit('localLoader:ready', {});
    }

    #populateSelectIfReady() {
        // Only populate if manager is initialized
        if (!this.#files?.length) return;
        this.populateSelect();
    }

    getFiles() {
        return this.#files;
    }

    getFileURLById(id) {
        if (typeof id !== "number") {
            throw new Error(`param(@id) must be typeof number, got ${id}`);
        }

        const file = this.#files.find(f => f.id === id);
        if (!file) {
            console.warn(`Couldn't find file with id(${id}) in file list.`, this.#files);
            return null;
        }
        return file.value;
    }

    getFileByLabel(label) {
        if (typeof label !== "string") {
            throw new Error(`param(@label) must be typeof string, got ${label}`);
        }

        const file = this.#files.find(f => f.label === label);
        if (!file) {
            console.warn(`Couldn't find file with label(${label}) in file list.`, this.#files);
            return null;
        }
        return file.value;
    }

    // New helper: called when user changes the select (you probably have an event listener elsewhere)
    // Wire your <select> onchange to call this
    handleDemoChange(selectedValue) {
        state.setCurrentDemo(selectedValue);
        bus.emit('demo:changed', { value: selectedValue });
    }

    // Internal: update iframe when state changes (decoupled from IFrameController)
    #updateIframeFromDemo(demoValue) {
        const iframe = document.querySelector('iframe'); // or better: let IFrameController handle this via event
        if (iframe && demoValue) {
            iframe.src = demoValue;
        }
    }

    populateSelect() {
        const selectEl = UIManager.getInstance().fileSelect;
        if(!selectEl) {
            console.warn('Demo select element not found via UIManager');
            return;
        }

        selectEl.innerHTML = '';

        this.#files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.value;
            option.textContent = file.label;
            selectEl.appendChild(option);
        });

        // Restore from state, or auto-load first file (mirrors main branch initIFrameSrc behaviour)
        const current = state.getCurrentDemo();
        if (current) {
            selectEl.value = current;
        } else if (this.#files.length > 0) {
            const firstFile = this.#files[0];
            selectEl.value = firstFile.value;
            state.setCurrentDemo(firstFile.value);
            bus.emit('demo:changed', { value: firstFile.value });
        }
    }
}

export default LocalLoader;