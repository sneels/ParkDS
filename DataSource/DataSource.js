'use strict';

class DataSource {
    constructor() {
        this.Manager = require('./Manager');
        this.Queue = new (require('./Queue'))();
        this.Router = require('./Router');
        this.Packages = new (require('./Package/Packages'))()
        this.Connector = new (require('./Connector/Connector'))();
    }
}

module.exports = DataSource;