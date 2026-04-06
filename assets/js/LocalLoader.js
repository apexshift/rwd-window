import loader_config from "../../file-loader.json" with { type: "json" };

/**
 * LocalLoader – Singleton
 * 
 * Parse the file-loader.json to load any local layouts you need to test
 * for responsiveness.
 * 
 * @since 0.1.0-beta
 */

let instance = null;

export default class LocalLoader {
    #defaults = {
        selectElement: null
    }

    #files;

    constructor(config = {}) {
        if (instance) {
            throw new Error('LocalLoader is a singleton. Use LocalLoader.getInstance() instead.');
        }

        if(!loader_config.files.length) {
            throw new Error('File loader config is missing or empty.');
        }

        this.#defaults = {...this.#defaults, ...config}

        this.#files = loader_config.files;
    }

    static getInstance() {
        if(!instance) {
            instance = new LocalLoader();
        }

        return instance;
    }

    getFiles() {
        if(!this.#files.length) return;

        return this.#files;
    }

    getFileURLById(id) {
        if (typeof id !== "number") {
            throw new Error(`param(@id) must be typeof number, got ${id}`);
        }

        this.#files.forEach((file, index) => {
            if(file.id === id) {
                return file.value;
            }

            if(index === this.#files.length - 1) {
                console.warn(`Couldn't find file with id(${id}) in file list.`);
                console.info(this.#files);
                return;
            }
        })
    }

    getFileByLabel(label) {
        if (typeof label !== "string") {
            throw new Error(`param(@label) must by typeof string, got ${label}`);
        }

        this.#files.forEach((file, index) => {
            if(file.label === label) {
                return file.value;
            }

            if(index === this.#files.length - 1) {
                console.warn(`Couldn't find file with label(${label}) in file list.`);
                console.info(this.#files);
                return;
            }
        })
    }
}