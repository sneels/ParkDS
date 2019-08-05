'use strict';

const fs = require('fs');

let singletonInstance = null;
class Config {
    constructor() {
        if (!singletonInstance) {
            this.Path = "";
            this.Settings = new Object({
                Name: "",
                IsCloud: false,
                Password: "",
                Path: "",
                Port: 0,
                Admin: new Object({
                    User: "",
                    Pass: ""
                })
            });

            this.DataSources = new Object();

            this.Domains = new Object();

            // If null, set singletonInstance to this Class 
            singletonInstance = this;
        }

        // Returns the initiated Class
        return singletonInstance;
    }

    AddDataSourceConnector(ds, dsc) {
        var Connectors = new (require('../DataSource/Connector/ConnectorList'));
        Connectors.Add(ds, dsc);
    }

    StartConnectors() {
        var ParkDS = new (require('../'));
        var Connectors = ParkDS.DataSource.Connector.Connectors;
        
        for (var ds in Connectors.List) {            
            if (this.DataSources[ds].Domain == this.Settings.Name) {
                Connectors.List[ds].OpenConnection();
            }
        }
    }
}

module.exports = Config;