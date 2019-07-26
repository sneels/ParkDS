'use strict';
const DeferredState = require('promised-deferred');
const Package = require('../Package/Package');
class ConnectorHandler {
    constructor() {
        this.config = new (require('../../Config/Config'))();
    }

    /**
     * Execute the DataSource Connector
     * @param {Package} dsp A DataSourcePackage to be handled
     * @returns {Promise<Package>}
     * @public
     */
    Execute(dsp) {
        var connectors = new (require('./ConnectorList'))();
        var dsc = connectors.List[dsp.Database];
        var def = new DeferredState();
        var result = dsc.Query(dsp.Query.String, dsp.Query.Bindings);
        result.then(function (value) {
            dsp.Result = value;
            dsp.State = 1;
            dsp.ReturnToSender = true;
            dsp.Resolve();
            def.Resolve(dsp);
        });
        
        return def.Promise();
    }
}

module.exports = ConnectorHandler;