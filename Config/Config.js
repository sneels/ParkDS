'use strict';
const fs = require('fs');

let singletonInstance = null;
class Config {
    constructor() {
        if (!singletonInstance) {
            this.Path = "";
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
        }

        // Returns the initiated Class
        return singletonInstance;
    }

    /**
     * Get the Local Settings
     * @returns {Object}
     */
    get Settings() {
        return this.config.Settings;
    }


    /**
     * Get the DataSources
     * @returns {Object}
     */
    get DataSources() {
        return this.config.DataSources;
    }

    /**
     * Get the Domains
     * @returns {Object}
     */
    get Domains() {
        return this.config.Domains;
    }

    /**
     * Load the Config File
     */
    Load() {
        var c = fs.readFileSync(this.Path);
        c = c.toString();

        this.config = JSON.parse(c);
    }

    /**
     * Save the Config to the Config file
     * */
    Save() {
        fs.writeFileSync(this.Path, JSON.stringify(this.config));
    }
}

module.exports = Config;