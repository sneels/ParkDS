"use strict";

const ClientList = require('../WebSocket/Client/ClientList')
const Config = require('../Config/Config');
const ConnectorHandler = require('./Connector/ConnectorHandler');
const Entity = require('../Logger/Entity');
const Log = require('../Logger/Log');
const LogType = require('../Logger/LogType');
const PackagesContainer = require('./Package/PackagesContainer');
const Queue = require('./Queue');
const Server = require('../WebSocket/Server/Server');

class Router {
    constructor() {
        this._queue = Queue.Instance;
        this._config = Config.Instance;
        this._entity = new Entity();
        this._entity.Name = "ParkDS Router";
        this._entity.Domain = this._config.Settings.Name;
    }
    /**
     * Route the container's packages.
     * @param pkgcontainer
     * @param fromWebSocket
     */
    Route(pkgcontainer, fromWebSocket) {
        this._fromWebSocket = fromWebSocket;
        Log.Register(this._entity, LogType.TRAFFIC, "Container Received");
        let queued = this._queue.Add(pkgcontainer);
        let routeObj = new Object({
            Local: new PackagesContainer(),
            WebSocket: {
                Client: new Object(),
                Server: new Object()
            }
        });
        routeObj["Local"].id = pkgcontainer.id;
        if (pkgcontainer.Sender == this._config.Settings.Name) {
            for (var i in pkgcontainer.Packages) {
                var ds = this._config.DataSources.GetDataSourceByName(pkgcontainer.Packages[i].DataSource);
                if (ds.Domain.Name == this._config.Settings.Name) {
                    routeObj["Local"].Packages.push(pkgcontainer.Packages[i]);
                }
                else {
                    if ((this._config.Settings.IsCloud && !this._config.Domains.GetDomainByName(ds.Domain.Name).IsCloud)) {
                        if (typeof (routeObj["WebSocket"]["Server"][ds.Domain.Name]) == "undefined") {
                            routeObj["WebSocket"]["Server"][ds.Domain.Name] = new PackagesContainer();
                            routeObj["WebSocket"]["Server"][ds.Domain.Name].id = pkgcontainer.id;
                            routeObj["WebSocket"]["Server"][ds.Domain.Name].Sender = pkgcontainer.Sender;
                            routeObj["WebSocket"]["Server"][ds.Domain.Name].Recipient = ds.Domain.Name;
                        }
                        routeObj["WebSocket"]["Server"][ds.Domain.Name].Packages.push(pkgcontainer.Packages[i]);
                    }
                    else {
                        if (typeof (routeObj["WebSocket"]["Client"][ds.Domain.Name]) == "undefined") {
                            routeObj["WebSocket"]["Client"][ds.Domain.Name] = new PackagesContainer();
                            routeObj["WebSocket"]["Client"][ds.Domain.Name].id = pkgcontainer.id;
                            routeObj["WebSocket"]["Client"][ds.Domain.Name].Sender = pkgcontainer.Sender;
                            routeObj["WebSocket"]["Client"][ds.Domain.Name].Recipient = ds.Domain.Name;
                        }
                        routeObj["WebSocket"]["Client"][ds.Domain.Name].Packages.push(pkgcontainer.Packages[i]);
                    }
                }
            }
        }
        else if (pkgcontainer.Recipient == this._config.Settings.Name) {
            this.routeLocally(pkgcontainer);
        }
        var size = this.ObjectSize(routeObj["WebSocket"]["Client"]);
        if (size > 0) {
            for (var key in routeObj["WebSocket"]["Client"]) {
                if (routeObj["WebSocket"]["Client"][key].Packages.length > 0) {
                    this.routeThroughWebSocketClient(routeObj["WebSocket"]["Client"][key], routeObj["WebSocket"]["Client"][key].Recipient);
                }
            }
        }
        size = this.ObjectSize(routeObj["WebSocket"]["Server"]);
        if (size > 0) {
            for (var key in routeObj["WebSocket"]["Server"]) {
                if (routeObj["WebSocket"]["Server"][key].Packages.length > 0) {
                    this.routeThroughWebSocketServer(routeObj["WebSocket"]["Server"][key]);
                }
            }
        }
        if (routeObj["Local"].Packages.length > 0) {
            this.routeLocally(routeObj["Local"]);
        }
        if (fromWebSocket > 0) {
            queued.then((this.routeResolved).bind(this)).catch((this.routeResolved).bind(this));
        }
        return queued;
    }

    /**
     * PRIVATE: Route resolved packages
     * @param {PackagesContainer} pkgcontainer 
     */
    routeResolved(pkgcontainer) {
        if (this._fromWebSocket == 1) {
            // Yes? Send it back through the server.
            this.routeThroughWebSocketServer(pkgcontainer);
        }
        else {
            // No? Send it back through the client.
            this.routeThroughWebSocketClient(pkgcontainer, pkgcontainer.Sender);
        }
    }

    /**
     * Calculate Object Size.
     * @param {object} obj 
     */
    ObjectSize(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key))
                size++;
        }
        return size;
    }

    /**
     * PRIVATE Route packages through local network.
     * @param {PackagesContainer} pkgcontainer 
     */
    routeLocally(pkgcontainer) {
        Log.Register(this._entity, LogType.TRAFFIC, `Routing ${pkgcontainer.Packages.length} Packages Locally.`);
        var q = this._queue;
        for (var i in pkgcontainer.Packages) {
            var connectorHandler = new ConnectorHandler();
            var chResult = connectorHandler.Execute(pkgcontainer.Packages[i]);
            chResult.then(function (value) {
                q.ResolvePackage(value);
            });
        }
    }

    /**
     * PRIVATE Route packages through WebSocket Server.
     * @param {PackagesContainer} pkgcontainer 
     */
    routeThroughWebSocketServer(pkgcontainer) {
        const Server = require('../WebSocket/Server/Server');
        Log.Register(this._entity, LogType.TRAFFIC, `Routing ${pkgcontainer.Packages.length} Packages through the WebSocket Server to ${pkgcontainer.Recipient}.`);
        var wss = Server.Instance;
        wss.SendToClient(pkgcontainer);
    }

    /**
     * PRIVATE Route packages through WebSocket Client.
     * @param {PackagesContainer} pkgcontainer 
     */
    routeThroughWebSocketClient(pkgcontainer, domain) {
        const ClientList = require('../WebSocket/Client/ClientList');
        Log.Register(this._entity, LogType.TRAFFIC, `Routing ${pkgcontainer.Packages.length} Packages through the WebSocket Client to ${domain}.`);
        var client;
        var reroute = false;
        if (!this._config.Settings.IsCloud && !this._config.Domains.GetDomainByName(domain).IsCloud) {
            client = ClientList.Instance.List[0];
            reroute = true;
        }
        else {
            client = ClientList.Instance.GetClientByDomainName(domain);
        }
        client.Send(pkgcontainer, reroute);
    }
}

module.exports = Router;