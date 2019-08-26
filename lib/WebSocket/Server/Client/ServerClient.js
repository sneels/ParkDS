"use strict";

const Config = require('../../../Config/Config');
const Entity = require('../../../Logger/Entity');
const Log = require('../../../Logger/Log');
const LogType = require('../../../Logger/LogType');
const PackagesContainer = require('../../../DataSource/Package/PackagesContainer');
const Queue = require('../../../DataSource/Queue');
const Router = require('../../../DataSource/Router');
const ServerClientList = require('./ServerClientList');
const WebSocket = require('ws');

class ServerClient {
    /**
     * 
     * @param {WebSocket} ws 
     */
    constructor(ws) {
        this._config = Config.Instance;
        this._entity = new Entity();
        this._entity.Name = "ParkDS WebSocket Server";
        this._entity.Domain = this._config.Settings.Name;
        this.Token = null;
        if (ws != null) {
            this.WebSocket = ws;
        }
    }
    
    /**
     * Send a Packages Container to the client
     * @param {PackagesContainer} pkgcontainer the Packages Container
     */
    Send(pkgcontainer) {
        let obj = this.createJSON(pkgcontainer);
        this.WebSocket.send(obj);
    }

    /**
     * Event Handler: OnMessage
     * @param {string} message
     */
    OnMessage(message) {
        let queue = Queue.Instance;
        const Server = require('../Server');
        var server = Server.Instance;
        try {
            Log.Register(this._entity, LogType.TRAFFIC, "Message received!");
            let obj = JSON.parse(message);
            var pkgcontainer = this.createPackagesContainer(obj);
            if (obj["reroute"] === undefined) {
                if (pkgcontainer.ReturnToSender) {
                    queue.ResolvePackages(pkgcontainer);
                }
                else {
                    var router = new Router();
                    router.Route(pkgcontainer, 1);
                }
            }
            else {
                server.SendToClient(pkgcontainer);
            }
        }
        catch (e) {
            this.OnError(e);
        }
    }

    /**
     * Event Handler: OnClose
     * @param {any} code
     * @param {any} reason
     */
    OnClose(code, reason) {
        if (reason == "") {
            reason = "Connection Terminated Abnormally";
        }
        // Log Error
        var err = new Error(reason);
        err["code"] = code;
        Log.Register(this._entity, LogType.ERROR, err);
        var entity = new Entity();
        // Log status change
        entity.Name = this.Token.User;
        entity.Domain = this.Token.Path;
        Log.Register(entity, LogType.STATUS, -1);
        let cl = ServerClientList.Instance;
        cl.RemoveClientByName(this.Token.User);
    }

    /**
     * Event Handler: OnError
     * @param {Error} e
     */
    OnError(e) {
        Log.Register(this._entity, LogType.ERROR, e);
    }

    /**
     * Create a Packages Container from a JSON string
     * @param {string} json The JSON string
     * @returns {PackagesContainer}
     */
    createPackagesContainer(obj) {
        try {
            let pkgcontainer = new PackagesContainer(obj["packet"]);
            return pkgcontainer;
        }
        catch (e) {
            Log.Register(this._entity, LogType.ERROR, "Invalid or missing Packet in Websocket message");
        }
    }
    /**
     * Create a JSON string from a PackagesContainer
     * @param {PackagesContainer} pkgcontainer The Packages Container
     * @returns {string}
     */
    createJSON(pkgcontainer) {
        var obj = new Object();
        obj["token"] = this.Token;
        obj["packet"] = pkgcontainer.ToObject();
        return JSON.stringify(obj);
    }
}

module.exports = ServerClient;