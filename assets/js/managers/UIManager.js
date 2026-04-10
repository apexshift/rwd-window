import { bus } from '../core/EventBus.js';
import { state } from '../core/AppState.js';
import { UIFactory } from '../core/UIFactory.js';
import config from '../../../config.json' with {type: "json"}

let instance = null;

export class UIManager 
{
    #elements = {
        fitBtn: null,
        helpBtn: null,
        widthInput: null,
        heightInput: null,
        fileSelect: null,
        deviceContainer: null,
        masthead: null,
        feedback: null,
        appWindow: null,
        viewport: null,
        iFrame: null,
        resizeHandles: {
            left: null,
            right: null,
            bottoms: null
        }
    }

    constructor() {
        if(instance) throw new Error('UIManager is a singleton, use UIManager.getInstance()');

        this.#createUI();
        this.#collectElements();

        instance = this;
    }

    static getInstance() {
        if(!instance) instance = new UIManager();
        return instance;
    }

    #createUI() {
        this.#elements.masthead = document.querySelector('.masthead__controls');
        if(!this.#elements.masthead) {
            console.warn('Masthead container not found.');
            return;
        }

        // Fit button
        const fitContainer = UIFactory.createControlsContainer('fitContainer');
        this.#elements.fitBtn = UIFactory.createFitToContainerButton(
            config.ui_controls.fitToContainer.label,
            config.ui_controls.fitToContainer.icon
        );
        fitContainer.appendChild(this.#elements.fitBtn);
        this.#elements.masthead.appendChild(fitContainer);

        // Device buttons container
        this.#elements.deviceContainer = UIFactory.createControlsContainer('devices');
        this.#elements.masthead.appendChild(this.#elements.deviceContainer);

        // Dimensions
        const dimensionsContainer = UIFactory.createControlsContainer('dimensions');
        this.#elements.widthInput = UIFactory.createControlWithIncrement('W', 'width-control', true);
        this.#elements.heightInput = UIFactory.createControlWithIncrement('H', 'height-control', false);
        dimensionsContainer.appendChild(this.#elements.widthInput);
        dimensionsContainer.appendChild(this.#elements.heightInput);
        this.#elements.masthead.appendChild(dimensionsContainer);

        // Loader
        const loaderContainer = UIFactory.createControlsContainer('loader');
        this.#elements.fileSelect = UIFactory.createSelectControl('Load', 'file-loader');
        loaderContainer.appendChild(this.#elements.fileSelect);
        this.#elements.masthead.appendChild(loaderContainer);

        // Help
        const helpContainer = UIFactory.createControlsContainer('help');
        this.#elements.helpBtn = UIFactory.createHelpButton(
            config.ui_controls.help.label,
            config.ui_controls.help.icon
        );
        helpContainer.appendChild(this.#elements.helpBtn);
        this.#elements.masthead.appendChild(helpContainer);
    }

    #collectElements() {
        this.#elements.fitBtn = document.querySelector('[data-mode="fit"]');

        this.#setupInputListeners();
    }

    #setupInputListeners() {
        const widthInput = this.widthInput.querySelector('input');
        const heightInput = this.heightInput.querySelector('input');

        if(!widthInput || !heightInput) return;

        // Step buttons
        const stepButtons = this.stepButtons;
        stepButtons.forEach(btn => {
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

        // Keyboard arrows inside inputs
        const handleInputKeydown = (input, isWidth) => e => {
            if(e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const step = e.shiftKey ? 10 : ((e.ctrlKey || e.metaKey) ? 50 : 1);
                const direction = e.key === 'ArrowUp' ? 1 : -1;
                bus.emit('input:stepChanged', {
                    target: isWidth ? 'width' : 'height',
                    direction,
                    step
                });
                e.preventDefault();
            } else if(e.key === 'Enter') {
                bus.emit('input:stepCommit', {target: isWidth ? 'width' : 'height' });
            }
        }

        widthInput.addEventListener('keydown', handleInputKeydown(widthInput, true));
        widthInput.addEventListener('blur', () => bus.emit('input:stepCommit', { target: 'width' }));
        heightInput.addEventListener('keydown', handleInputKeydown(heightInput, false));
        heightInput.addEventListener('blur', () => bus.emit('input:stepCommit', { target: 'height' }));
    }

    get masthead() { return this.#elements.masthead }
    get FitBtn() { return this.#elements.fitBtn }
    get deviceContainer() { return this.#elements.deviceContainer }
    get widthInput() { return this.#elements.widthInput }
    get stepButtons() { return [...this.widthInput.querySelectorAll('.app__control-increment'), ...this.heightInput.querySelectorAll('.app__control-increment') ]; }
    get heightInput() { return this.#elements.heightInput }
    get fileSelect() { return this.#elements.fileSelect }
    get helpBtn() { return this.#elements.helpBtn }
    get Elements() { return this.#elements; }

    getWidthInput() {
        return this.widthInput.querySelector('input');
    }

    getHeightInput() {
        return this.heightInput.querySelector('input');
    }

    // TODO: refresh method, if needed later.
    refresh() {
        // can be used if dynamic changes are needed.
    }
}

export default UIManager;