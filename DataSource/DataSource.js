'use strict';

class DataSource {
    constructor() {
        this.Router = require('./Router');
        this.Manager = require('./Manager');
        this.Packages = new (require('./Package/Packages'))()
        this.Connector = new (require('./Connector/Connector'))();
        this.Queue = {
            count: new (require('./Queue'))()._queue.length
        };
    }
}

module.exports = DataSource;