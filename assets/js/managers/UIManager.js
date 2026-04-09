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
    }

    constructor() {
        if(instance) throw new Error('UIManager is a singleton, use UIManager.getInstance()');
        this.#createUI();
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

    get masthead() { return this.#elements.masthead }
    get FitBtn() { return this.#elements.fitBtn }
    get deviceContainer() { return this.#elements.deviceContainer }
    get widthInput() { return this.#elements.widthInput }
    get heightInput() { return this.#elements.heightInput }
    get fileSelect() { return this.#elements.fileSelect }
    get helpBtn() { return this.#elements.helpBtn }
    get Elements() { return this.#elements; }

    // TODO: refresh method, if needed later.
    refresh() {
        // can be used if dynamic changes are needed.
    }
}

export default UIManager;