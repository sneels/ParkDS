'use strict';

const IConnector = require('./IConnector');

let singletonInstance = null;
class ConnectorList {

    constructor() {
        if (!singletonInstance) {
            this.List = new Object();
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
        }
        return singletonInstance;
    }

    /**
     * Add a Data Source Connector to the list by providing a Name and IConnector
     * @param {String} name
     * @param {IConnector} connector
     */
    Add(name, connector) {
        this.List[name] = connector;
    }

}
module.exports = ConnectorList;