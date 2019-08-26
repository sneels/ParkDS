"use strict";
const DataSource = require('../../Config/DataSource');

class EConnector {
    /**
     * 
     * @param {DataSource} datasource 
     */
    constructor(datasource) {
        this._connectionstring = "";
        this._user = datasource.User;
        this._pass = datasource.Password;
        this._dbname = datasource.DataSource;
        this._options = datasource.Options;
        this._name = datasource.Name;
    }

    get Name() {
        return this._name;
    }
}

module.exports = EConnector;