import { bus } from '../core/EventBus.js';
import { UIFactory } from '../core/UIFactory.js';
import config from '../../../config.json' with { type: "json" };

let instance = null;

export class UIManager {
    // Private storage for all managed DOM elements
    #elements = {};

    constructor() {
        if (instance) {
            throw new Error('UIManager is a singleton, use UIManager.getInstance()');
        }

        instance = this;

        // Listen for app initialization signal
        bus.on('app:init', () => this.#initialize());
    }

    static getInstance() {
        if (!instance) instance = new UIManager();
        return instance;
    }

    /**
     * Initialize UI when app:init event is received
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
     * Internal safe DOM query
     */
    #get(selector) {
        if (typeof selector !== "string") {
            throw new TypeError(`UIManager.#get(): selector must be a string, got ${typeof selector}`);
        }
        return document.querySelector(selector);
    }

    /**
     * Register an element with automatic getter + setter
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

    #createUI() {
        bus.emit('ui:createUI', {});
        // Masthead is critical - we throw if missing
        const masthead = this.#get('.masthead__controls');
        if (!masthead) {
            throw new Error('UIManager: Cannot create UI Elements without div.masthead__controls.');
        }

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

        const loaderContainer = UIFactory.createControlsContainer('loader');
        const fileSelect = UIFactory.createSelectControl('Load', 'file-loader');
        loaderContainer.appendChild(fileSelect);
        masthead.appendChild(loaderContainer);

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

    #registerElements() {
        bus.emit("ui:registerElement", {});
        // Register elements with automatic getters/setters
        this.#addElement('masthead', null, false);           // already set in #createUI
        this.#addElement('fitBtn', '[data-mode="fit"]');
        this.#addElement('deviceContainer', '#devices');
        this.#addElement('dimensionsContainer', '#dimensions');
        this.#addElement('loaderContainer', '#loader');
        this.#addElement('fileSelect', '#file-loader');      // assuming this ID
        this.#addElement('helpBtn', null, false); // created directly in #createUI

        // Nested / derived elements
        this.#addElement('appWindow', '.app__window__view');        // adjust selector as needed
        this.#addElement('viewport', '.viewport');
        this.#addElement('iFrame', '.viewport__frame');

        // Width & Height inputs - registered after dimensionsContainer exists
        if (this.dimensionsContainer) {
            this.#elements.widthInput = this.dimensionsContainer.querySelector('#width-control');
            this.#elements.heightInput = this.dimensionsContainer.querySelector('#height-control');

            // Define getters for widthInput and heightInput
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

        // Special derived getter: stepButtons
        Object.defineProperty(this, 'stepButtons', {
            get: () => Array.from(this.dimensionsContainer?.querySelectorAll('.app__control-increment') || []),
            enumerable: true
        });

        // Special derived getter: resizeHandles
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
        })

        // Expose raw elements object if needed (read-only)
        Object.defineProperty(this, 'Elements', {
            get: () => ({ ...this.#elements }),
            enumerable: true
        });

        bus.emit("ui:registerElementsComplete", {});
    }

    /**
     * Setup input listeners (moved here for clarity)
     * Call this after registration if needed
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

        // Keyboard handling
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

    // Placeholder for future dynamic refresh
    refresh() {
        // Re-query critical elements if DOM changes dynamically
        // this.masthead = '.masthead__controls'; // example
    }

    toString() {
        console.info(this.#elements);
    }
}

export default UIManager;