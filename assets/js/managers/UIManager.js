/**
 * @module UIManager
 * @description Singleton responsible for building and registering all DOM
 * elements used by the RWD Window application.
 *
 * Initializes on the `app:init` bus event. Uses {@link UIFactory} to create
 * control elements, then registers each one with an auto-generated getter/setter
 * so other managers can access them via `UIManager.getInstance().<name>`.
 *
 * Dynamic input ceilings are kept in sync by listening for
 * `state:containerWidthChanged` and `state:containerHeightChanged`.
 */
import { bus } from '../core/EventBus.js';
import { UIFactory } from '../core/UIFactory.js';
import config from '../../../config.json' with { type: "json" };

let instance = null;

export class UIManager {
    /** @private @type {Object<string, Element|null>} */
    #elements = {};

    constructor() {
        if (instance) {
            throw new Error('UIManager is a singleton, use UIManager.getInstance()');
        }

        instance = this;

        // Listen for app initialization signal
        bus.on('app:init', () => this.#initialize());
    }

    /**
     * Return the shared UIManager instance, creating it on first call.
     * @returns {UIManager}
     */
    static getInstance() {
        if (!instance) instance = new UIManager();
        return instance;
    }

    /**
     * Build the UI, register elements, and set up event listeners.
     * Emits `ui:ready` on success or `ui:error` if an exception is thrown.
     * @private
     */
    #initialize() {
        try {
            bus.emit("ui:init", {});

            this.#createUI();
            this.#registerElements();
            this.#setupEventListeners();

            bus.emit("ui:ready", {});
        } catch (err) {
            console.error('UIManager initialization failed:', err);
            bus.emit('ui:error', { message: err.message, error: err });
        }
    }

    /**
     * Safe wrapper around `document.querySelector`.
     * @private
     * @param {string} selector
     * @returns {Element|null}
     * @throws {TypeError} If selector is not a string.
     */
    #get(selector) {
        if (typeof selector !== "string") {
            throw new TypeError(`UIManager.#get(): selector must be a string, got ${typeof selector}`);
        }
        return document.querySelector(selector);
    }

    /**
     * Register a named DOM element with an auto-generated getter and setter.
     * The setter resolves a CSS selector string to an element via `#get()`.
     * Warns at runtime if the element is not found (unless `warnIfMissing` is false).
     *
     * @private
     * @param {string}      name              - Property name exposed on the instance.
     * @param {string|null} selector          - CSS selector used for the initial lookup.
     * @param {boolean}     [warnIfMissing=true]
     */
    #addElement(name, selector, warnIfMissing = true) {
        bus.emit('ui:addElement', {name, selector, warnIfMissing});
        Object.defineProperty(this, name, {
            get: () => this.#elements[name],
            set: (newSelector) => {
                const element = this.#get(newSelector);

                if (!element && warnIfMissing) {
                    console.warn(`UIManager: Element "${name}" not found for selector "${newSelector}"`);
                }

                this.#elements[name] = element;
            },
            enumerable: true,
            configurable: false
        });

        // Set initial value if selector provided
        if (selector !== undefined && selector !== null) {
            this[name] = selector;
        }
        bus.emit('ui:addElementComplete', {name, selector, warnIfMissing});
    }

    /**
     * Construct all control groups and append them to `.masthead__controls`.
     * Throws if the masthead element is absent — it is a hard requirement.
     * @private
     */
    #createUI() {
        bus.emit('ui:createUI', {});
        const masthead = this.#get('.masthead__controls');
        if (!masthead) {
            throw new Error('UIManager: Cannot create UI Elements without div.masthead__controls.');
        }

        // File Loader
        const loaderContainer = UIFactory.createControlsContainer('loader');
        const fileSelect = UIFactory.createSelectControl('Load', 'file-loader');
        loaderContainer.appendChild(fileSelect);
        masthead.appendChild(loaderContainer);

        // Create and append controls using UIFactory
        const fitContainer = UIFactory.createControlsContainer('fitContainer');
        const fitBtn = UIFactory.createFitToContainerButton(
            config.ui_controls.fitToContainer.label,
            config.ui_controls.fitToContainer.icon
        );
        fitContainer.appendChild(fitBtn);
        masthead.appendChild(fitContainer);

        const deviceContainer = UIFactory.createControlsContainer('devices');
        masthead.appendChild(deviceContainer);

        const dimensionsContainer = UIFactory.createControlsContainer('dimensions');
        const widthInput = UIFactory.createControlWithIncrement('W', 'width-control', true);
        const heightInput = UIFactory.createControlWithIncrement('H', 'height-control', false);
        dimensionsContainer.appendChild(widthInput);
        dimensionsContainer.appendChild(heightInput);
        masthead.appendChild(dimensionsContainer);

        const helpContainer = UIFactory.createControlsContainer('help');
        const helpBtn = UIFactory.createHelpButton(
            config.ui_controls.help.label,
            config.ui_controls.help.icon
        );
        helpContainer.appendChild(helpBtn);
        masthead.appendChild(helpContainer);

        // Store masthead immediately (critical element)
        this.#elements.masthead = masthead;

        bus.emit('ui:createUIComplete');
    }

    /**
     * Register all managed DOM elements with `#addElement` and define
     * derived getters for `widthInput`, `heightInput`, `stepButtons`,
     * `resizeHandles`, and `Elements`.
     * @private
     */
    #registerElements() {
        bus.emit("ui:registerElement", {});
        this.#addElement('masthead', null, false);           // already set in #createUI
        this.#addElement('fitBtn', '[data-mode="fit"]');
        this.#addElement('deviceContainer', '#devices');
        this.#addElement('dimensionsContainer', '#dimensions');
        this.#addElement('loaderContainer', '#loader');
        this.#addElement('fileSelect', '#file-loader');
        this.#addElement('helpBtn', null, false); // created directly in #createUI

        // Nested / derived elements
        this.#addElement('appWindow', '.app__window__view');
        this.#addElement('viewport', '.viewport');
        this.#addElement('iFrame', '.viewport__frame');

        // Width & Height inputs live inside dimensionsContainer
        if (this.dimensionsContainer) {
            this.#elements.widthInput = this.dimensionsContainer.querySelector('#width-control');
            this.#elements.heightInput = this.dimensionsContainer.querySelector('#height-control');

            Object.defineProperty(this, 'widthInput', {
                get: () => this.#elements.widthInput,
                enumerable: true
            });

            Object.defineProperty(this, 'heightInput', {
                get: () => this.#elements.heightInput,
                enumerable: true
            });
        } else {
            console.warn('UIManager: dimensionsContainer not found - width/height inputs unavailable');
        }

        /**
         * Live list of all increment/decrement step buttons.
         * @type {HTMLButtonElement[]}
         */
        Object.defineProperty(this, 'stepButtons', {
            get: () => Array.from(this.dimensionsContainer?.querySelectorAll('.app__control-increment') || []),
            enumerable: true
        });

        /**
         * The three viewport resize handle elements.
         * @type {{ left:Element|null, right:Element|null, bottom:Element|null }}
         */
        Object.defineProperty(this, 'resizeHandles', {
            get: () => {
                const resizeHandles = {
                    left: this.viewport?.querySelector('.viewport__rs.left'),
                    right: this.viewport?.querySelector('.viewport__rs.right'),
                    bottom: this.viewport?.querySelector('.viewport__rs.bottom')
                };

                return resizeHandles;
            },
            enumerable: true
        });

        /** Read-only snapshot of the internal elements map. */
        Object.defineProperty(this, 'Elements', {
            get: () => ({ ...this.#elements }),
            enumerable: true
        });

        bus.emit("ui:registerElementsComplete", {});
    }

    /**
     * Attach all DOM event listeners and bus subscriptions.
     *
     * - fitBtn click → `viewport:fit`
     * - Step button clicks → `input:stepChanged`
     * - Width/height input keydown (ArrowUp/Down) → `input:stepChanged`
     * - Width/height input keydown (Enter) / blur → `input:stepCommit`
     * - `state:containerWidthChanged` → update `widthInput.max`
     * - `state:containerHeightChanged` → update `heightInput.max`
     * @private
     */
    #setupEventListeners() {
        bus.emit('ui:setupEventListeners', {});
        this.fitBtn.addEventListener('click', () => bus.emit('viewport:fit'));

        if (!this.widthInput || !this.heightInput) {
            console.warn('UIManager: width/height inputs not found for listener setup');
            return;
        }

        // Step buttons
        this.stepButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                const direction = btn.dataset.direction === 'up' ? 1 : -1;
                const isWidth = btn.dataset.target === 'width';
                const step = e.shiftKey ? 10 : ((e.ctrlKey || e.metaKey) ? 50 : 1);

                bus.emit('input:stepChanged', {
                    target: isWidth ? 'width' : 'height',
                    direction,
                    step
                });
            });
        });

        // Keyboard handling for number inputs
        const handleKeydown = (isWidth) => (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const step = e.shiftKey ? 10 : ((e.ctrlKey || e.metaKey) ? 50 : 1);
                const direction = e.key === 'ArrowUp' ? 1 : -1;

                bus.emit('input:stepChanged', {
                    target: isWidth ? 'width' : 'height',
                    direction,
                    step
                });
                e.preventDefault();
            } else if (e.key === 'Enter') {
                bus.emit('input:stepCommit', { target: isWidth ? 'width' : 'height' });
            }
        };

        this.widthInput?.addEventListener('keydown', handleKeydown(true));
        this.widthInput?.addEventListener('blur', () => bus.emit('input:stepCommit', { target: 'width' }));

        this.heightInput?.addEventListener('keydown', handleKeydown(false));
        this.heightInput?.addEventListener('blur', () => bus.emit('input:stepCommit', { target: 'height' }));

        // Keep inputs max in sync with live container dimensions
        bus.on('state:containerWidthChanged', ({ maxWidth }) => {
            if (this.widthInput) this.widthInput.max = maxWidth;
        });
        bus.on('state:containerHeightChanged', ({ maxHeight }) => {
            if (this.heightInput) this.heightInput.max = maxHeight;
        });

        bus.emit("ui:setupEventListenersComplete", {});
    }

    /**
     * Placeholder for re-querying critical elements if the DOM changes dynamically.
     */
    refresh() {
        // Re-query critical elements if DOM changes dynamically
    }

    /** Log the internal elements map to the console (debug utility). */
    toString() {
        console.info(this.#elements);
    }
}

export default UIManager;
