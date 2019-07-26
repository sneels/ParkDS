'use strict';

const Config = require('../Config/Config');
const Queue = require('./Queue');
const PackagesContainer = require('./Package/PackagesContainer');
const ParkDS = new (require("../ParkDS"))();

class Router {
    constructor() {
        this.Queue = new Queue();
        this.Config = new Config();
    }

    /**
     * Route a Packages Container to the correct Data Source
     * @param {PackagesContainer} pkgcontainer
     * @returns {Promis<PackagesContainer>}
     * @public
     */
    Route(pkgcontainer, fromWebSocket) {
        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mRouter\x1b[0m]: Container received`);

        var queued = this.Queue.Add(pkgcontainer)
        var routeObj = new Object({
            Local: new PackagesContainer(),
            WebSocket: {
                Client: new Object(),
                Server: new Object()
            }
        });

        routeObj.Local.id = pkgcontainer.id;

        if (pkgcontainer.Sender == this.Config.Settings.Name) {
            for (var i in pkgcontainer.Packages) {
                var dom = this.Config.DataSources[pkgcontainer.Packages[i].Database];
                if (dom.Domain == this.Config.Settings.Name) {
                    routeObj.Local.Packages.push(pkgcontainer.Packages[i]);
                } else {
                    if (this.Config.Settings.IsCloud && !dom.IsCloud) {
                        if (typeof (routeObj.WebSocket.Server[dom.Domain]) == "undefined") {
                            routeObj.WebSocket.Server[dom.Domain] = new PackagesContainer();
                            routeObj.WebSocket.Server[dom.Domain].id = pkgcontainer.id;
                            routeObj.WebSocket.Server[dom.Domain].Sender = pkgcontainer.Sender;
                            routeObj.WebSocket.Server[dom.Domain].Recipient = dom.Domain;
                        }
                        routeObj.WebSocket.Server[dom.Domain].Packages.push(pkgcontainer.Packages[i]);
                    } else {
                        if (typeof (routeObj.WebSocket.Client[dom.Domain]) == "undefined") {
                            routeObj.WebSocket.Client[dom.Domain] = new PackagesContainer();
                            routeObj.WebSocket.Client[dom.Domain].id = pkgcontainer.id;
                            routeObj.WebSocket.Client[dom.Domain].Sender = pkgcontainer.Sender;
                            routeObj.WebSocket.Client[dom.Domain].Recipient = dom.Domain;
                        }
                        routeObj.WebSocket.Client[dom.Domain].Packages.push(pkgcontainer.Packages[i]);
                    }
                }
            }
        } else if (pkgcontainer.Recipient == this.Config.Settings.Name) {
            this.RouteLocally(pkgcontainer);
        }


        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mRouter\x1b[0m]: Routing Started:`);

        // Start routing the packages
        if (routeObj.Local.Packages.length > 0) {
            console.log(`Local routing: ${routeObj.Local.Packages.length}`);
            this.RouteLocally(routeObj.Local);
        }

        Object.size = function (obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        // Get the size of an object
        var size = Object.size(routeObj.WebSocket.Client);
        if (size > 0) {
            for (var key in routeObj.WebSocket.Client) {
                if (routeObj.WebSocket.Client[key].Packages.length > 0) {
                    console.log(`WebSocket Client [${key}] routing: ${routeObj.WebSocket.Client[key].Packages.length}`);

                    this.RouteThroughWebSocketClient(routeObj.WebSocket.Client[key], routeObj.WebSocket.Client[key].Recipient);
                }
            }
        }

        size = Object.size(routeObj.WebSocket.Server);
        if (size > 0) {
            for (var key in routeObj.WebSocket.Server) {
                if (routeObj.WebSocket.Server[key].Packages.length > 0) {
                    console.log(`WebSocket Server [${key}] routing: ${this.routeObj.WebSocket.Server[key].Packages.length}`);
                    this.RouteThroughWebSocketServer(routeObj.WebSocket.Server[key]);
                }
            }
        }

        if (fromWebSocket > 0) {
            var self = this;
            queued.then(function (value) {
                if (fromWebSocket == 1) {
                    self.RouteThroughWebSocketServer(value, value.Sender);
                } else {
                    self.RouteThroughWebSocketClient(value, value.Sender);
                }
            });
        } else {
            return queued;
        }
    }

    /**
     * Route the Packages Container through the local network
     * @param {PackagesContainer} pkgcontainer
     * @private
     */
    RouteLocally(pkgcontainer) {
        var q = this.Queue;
        for (var key in pkgcontainer.Packages) {
            var connectorHandler = new (require('./Connector/ConnectorHandler'))();
            var chResult = connectorHandler.Execute(pkgcontainer.Packages[key]);
            chResult.then(function (value) {
                q.ResolvePackage(pkgcontainer.id, value)
            })
        }
    }

    /**
     * Route the Packages Container off-network via a WebSocket Client
     * @param {PackagesContainer} pkgcontainer
     * @param {String} domain
     * @private
     */
    RouteThroughWebSocketClient(pkgcontainer, domain) {
        var client = ParkDS.WebSocket.Client.Clients.Clients[domain];
        client.Send(pkgcontainer);
    }

    /**
     * Route the Packages Container off-network via a WebSocket Server
     * @param {PackagesContainer} pkgcontainer
     * @private
     */
    RouteThroughWebSocketServer(pkgcontainer) {
        var wss = ParkDS.WebSocket.Server.Server;
        wss.SendToClient(pkgcontainer);
    }
}

module.exports = Router;