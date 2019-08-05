'use strict';

const WebSocket = require('ws');
const url = require('url');

const PackagesContainer = require('../../../DataSource/Package/PackagesContainer');

class Client {
    constructor() {        
        this.ws;
        this.Token;   
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
     * Event Handler: OnMessage
     * @param {String} message
     */
    OnMessage(message) {
        var Queue = new (require('../../../DataSource/Queue'));
        var Router = require('../../../DataSource/Router');
        var Server = new (require('../../../WebSocket/Server/Server'));
        try {
            var now = new Date();
            var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
            console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: Message Received.\x1b[0m");
            var obj = JSON.parse(message);
            if (obj.reroute === undefined) {

                var dsp = this._CreatePackage(message);
                if (dsp.ReturnToSender == 1) {
                    Queue.ResolvePackages(dsp.id, dsp.Packages)
                } else {
                    var dsr = new Router();
                    dsr.Route(dsp, 1);
                }
            } else {
                var dsp = this._CreatePackage(message);
                Server.SendToClient(dsp)
            }
            
        }
        catch (e) {
            this.OnError(e);
            this.ws.close(1008, "Client not registered");
        }
    }

    /**
     * Event Handler: OnClose
     * @param {any} code
     * @param {any} reason
     * @public
     */
    OnClose(code, reason) {
        var Server = new (require('../../../WebSocket/Server/Server'));
        var ClientsList = require('../../../WebSocket/Server/Client/ClientList');
        if (reason == "") {
            reason = "Connection Terminated Abnormally";
        }
            var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: Client [\x1b[32m\x1b[1m" + this.Token.User + "@" + this.Token.Path + "\x1b[0m] Disconnected with Code: \x1b[33m" + code + " \x1b[31m" + reason + "\x1b[0m");
        var wss = Server;
        var cl = new ClientsList();

        cl.RemoveClientByName(this.Token.User);
        wss.NotifyObservers();//*/
    }

    /**
     * Event Handler: OnError
     * @param {any} e
     * @public
     */
    OnError(e) {
        console.log(e);
    }

    /**
     * Create a PackagesContainer from a JSON string
     * @param {string} json The JSON string
     * @returns {PackagesContainer}
     * @private
     */
    _CreatePackage(json) {
        var PackagesContainer = (require('../../../DataSource/Package/PackagesContainer'));
        try {
            var obj = JSON.parse(json);
            var dspc = new PackagesContainer(obj.packet);

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