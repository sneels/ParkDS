'use strict';

const WebSocket = require('ws');
const url = require('url');

const DataSourcePackagesContainer = require('../../../DataSource/Package/PackagesContainer');

class Client {
    constructor() {
        this.ws
        this.Token
    }

    /**
     * Send a Packages Container to the client
     * @param {PackagesContainer} dspc the PackagesContainer
     * @public
     */
    Send(dspc) {
        var obj = this._CreateJSON(dspc)
        this.ws.send(obj);
    }


    /**
     * Create a PackagesContainer from a JSON string
     * @param {string} json The JSON string
     * @returns {PackagesContainer}
     * @private
     */
    _CreatePackage(json) {
        var ParkDS = new (require('../../ParkDS'))();
        try {
            var obj = JSON.parse(json);
            var dspc = new ParkDS.DataSource.Packages.PackagesContainer();
            dspc.id = obj.packet.id;
            dspc.State = obj.packet.IsResolved;
            dspc.ReturnToSender = obj.packet.ReturnToSender;
            dspc.Recipient = obj.packet.Recipient;
            dspc.Sender = obj.packet.Sender;

            for (var i in obj.packet.Packages) {
                var dsp = new ParkDS.DataSource.Packages.Package();
                dsp.id = obj.packet.Packages[i].id;
                dsp.Database = obj.packet.Packages[i].Database;
                dsp.Name = obj.packet.Packages[i].Name;
                dsp.Result = obj.packet.Packages[i].Result;
                dsp.IsResolved = obj.packet.Packages[i].IsResolved;
                dsp.ReturnToSender = obj.packet.Packages[i].ReturnToSender;
                dsp.Query = obj.packet.Packages[i].Query;
                dspc.Add(dsp);
            }
            return dspc;
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * Create a JSON string from a PackagesContainer
     * @param {PackagesContainer} dspc The PackagesContainer
     * @returns {string}
     * @private
     */
    _CreateJSON(dspc) {
        var obj = new Object();
        obj.token = this.Token;
        obj.packet = dspc.ToObject();
        return JSON.stringify(obj);
    }
}
module.exports = Client;