"use strict";

const Config = require('../../Config/Config');
const EConnector = require('./EConnector');
let instance = null;
class connectorlist {
    constructor() {
        if (!instance) {
            this.List = [];
            this._config = Config.Instance;

            instance = this;
        }

        return instance;
    }

    /**
     * Add a data source connector to the list.
     * @param {EConnector} connector 
     */
    Add(connector) {
        this.List.push(connector);
    }

    /**
     * Remove a data source connector from the list.
     * @param {EConnector} connector
     */
    Remove(connector) {
        for (var i in this.List) {
            if (this.List[i] == connector) {
                this.List.slice(parseInt(i), 1);
            }
        }
    }

    /**
     * Get a data source connector by name.
     * @param {string} name 
     */
    GetConnectorByname(name) {
        for (var i in this.List) {
            
            if (this.List[i].Name == name) {
                return this.List[i];
            }
        }
    }

    /**
     * Connect all connectors.
     */
    ConnectAll() {
        for (var i in this.List) {
            if (this._config.DataSources.GetDataSourceByName(this.List[i].Name).Domain.Name == this._config.Settings.Name) {
                this.List[i].OpenConnection();
            }
        }
    }

    /**
     * Disconnect all connectors.
     */
    DisconnectAll() {
        for (var i in this.List) {
            if (this._config.DataSources.GetByName(this.List[i].Name).Domain.Name == this._config.Settings.Name) {
                this.List[i].CloseConnection();
            }
        }
    }
}

const ConnectorList = {
    Instance: new connectorlist()
};

module.exports = ConnectorList;