"use strict";

const Config = require('../../Config/Config');
const ConnectorList = require('./ConnectorList');

class ConnectorHandler {
    constructor() {
        this._config = Config.Instance;
        var self = this;
        this.Promise = new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        })
    }

    /**
     * Execute the DataSource Connector
     * @param {Package} dsp A DataSourcePackage to be handled
     * @returns {Promise<Package>}
     */
    Execute(dsp) {
        var connectors = ConnectorList.Instance;
        var dsc = connectors.GetConnectorByname(dsp.DataSource);
        let resolve;
        var result = dsc.Query(dsp.Query);
        result.then(function (value) {
            dsp.Result.Data = value;
            dsp.State = 1;
            dsp.ReturnToSender = true;
            dsp.Resolve();
            resolve(dsp);
        }).catch(function (err) {
            dsp.Result.Error = err;
            dsp.State = 1;
            dsp.ReturnToSender = true;
            dsp.Reject(err);
            resolve(dsp);
        });
        return new Promise((res) => {
            resolve = res;
        });;
    }
}

module.exports = ConnectorHandler;