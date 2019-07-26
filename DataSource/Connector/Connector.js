'use strict';
class Connector {
    constructor() {
        this.IConnector = require('./IConnector');
        this.ConnectorHandler = require('./ConnectorHandler');
        this.Connectors = new (require('./ConnectorList'))();
        this.TokenList = new (require('./ConnectorList'))();
    }
}

module.exports = Connector;