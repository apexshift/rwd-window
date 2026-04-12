/**
 * @module LocalLoader
 * @description Singleton that manages the demo file list and drives the
 * file-loader `<select>` element and the iframe `src`.
 *
 * File metadata is sourced from `config.files`. On `ui:ready` the select is
 * populated. State changes to `currentDemo` are observed via
 * `state:currentDemoChanged` so the iframe stays in sync regardless of how
 * the demo is changed.
 *
 * @since 0.1.0
 */

import config from "../../../config.json" with { type: "json" };
import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import UIManager from "./UIManager.js";

let instance = null;

export class LocalLoader {
    /** @private @type {{ selectElement: Element|null }} */
    #defaults = {
        selectElement: null
    };

    /**
     * @private
     * @type {Array<{id:number, label:string, value:string}>}
     */
    #files;

    constructor() {
        if (instance) {
            throw new Error('LocalLoader is a singleton. Use LocalLoader.getInstance() instead.');
        }

        instance = this;

        // React to demo state changes to keep the iframe src up to date
        bus.on('state:currentDemoChanged', ({ value }) => {
            this.#updateIframeFromDemo(value);
        });

        bus.on('app:managers:init', () => this.#initializeManager());
        bus.on('ui:ready', () => this.#populateSelectIfReady());
    }

    /**
     * Return the shared LocalLoader instance, creating it on first call.
     * @returns {LocalLoader}
     */
    static getInstance() {
        if (!instance) {
            instance = new LocalLoader();
        }
        return instance;
    }

    /**
     * Validate the file config and emit `localLoader:ready`.
     * Emits `config:error` if `config.files` is absent or empty.
     * @private
     */
    #initializeManager() {
        if (!config.files?.length) {
            console.error('File loader config is missing or empty.');
            bus.emit('config:error', { type: 'files', message: 'No files configured' });
            return;
        }

        this.#defaults = { ...this.#defaults, ...config };
        this.#files = config.files;

        bus.emit('localLoader:ready', {});
    }

    /**
     * Populate the select only if the file list has been loaded.
     * Guards against `ui:ready` firing before `app:managers:init`.
     * @private
     */
    #populateSelectIfReady() {
        if (!this.#files?.length) return;
        this.populateSelect();
    }

    /**
     * Return all loaded file entries.
     * @returns {Array<{id:number, label:string, value:string}>}
     */
    getFiles() {
        return this.#files;
    }

    /**
     * Return the `value` (URL) of the file with the given numeric id.
     *
     * @param {number} id
     * @returns {string|null} The file URL, or null if not found.
     * @throws {Error} If `id` is not a number.
     */
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

    /**
     * Return the `value` (URL) of the file with the given label.
     *
     * @param {string} label
     * @returns {string|null} The file URL, or null if not found.
     * @throws {Error} If `label` is not a string.
     */
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

    /**
     * Programmatically change the active demo. Updates state and emits
     * `demo:changed` so other modules (e.g. the iframe) react.
     *
     * @param {string} selectedValue - The file URL to activate.
     */
    handleDemoChange(selectedValue) {
        state.setCurrentDemo(selectedValue);
        bus.emit('demo:changed', { value: selectedValue });
    }

    /**
     * Update the iframe `src` to the given demo URL.
     * No-ops if the iframe is not found or `demoValue` is falsy.
     *
     * @private
     * @param {string} demoValue - The URL to load in the iframe.
     */
    #updateIframeFromDemo(demoValue) {
        const iframe = document.querySelector('iframe');
        if (iframe && demoValue) {
            iframe.src = demoValue;
        }
    }

    /**
     * Populate the file-loader `<select>` with an `<option>` for each file.
     */
    populateSelect() {
        const selectEl = UIManager.getInstance().fileSelect;
        if(!selectEl) {
            console.warn('Demo select element not found via UIManager');
            return;
        }

        selectEl.innerHTML += '';

        this.#files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.value;
            option.textContent = file.label;
            selectEl.appendChild(option);
        });

        /* Restore from state, or auto-load first file
        const current = state.getCurrentDemo();
        if (current) {
            selectEl.value = current;
        } else if (this.#files.length > 0) {
            const firstFile = this.#files[0];
            selectEl.value = firstFile.value;
            state.setCurrentDemo(firstFile.value);
            bus.emit('demo:changed', { value: firstFile.value });
        } */
    }
}

export default LocalLoader;
