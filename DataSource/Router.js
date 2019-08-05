'use strict';

const Config = require('../Config/Config');
const Queue = require('./Queue');
const PackagesContainer = require('./Package/PackagesContainer');

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

        // Was the Packages Container created locally?
        if (pkgcontainer.Sender == this.Config.Settings.Name) {
            // Yes? Loop through the packages for further routing.
            for (var i in pkgcontainer.Packages) {
                var dom = this.Config.DataSources[pkgcontainer.Packages[i].Database];
                // Is the Data Source for the current package local?
                if (dom.Domain == this.Config.Settings.Name) {
                    // Yes? Add to local routing packages container.
                    routeObj.Local.Packages.push(pkgcontainer.Packages[i]);
                } else {
                    // No? Are we a cloud server and the destination isn't? Run the transfer through the Server->Client connection.
                    console.log(this.Config.Domains[dom.Domain].IsCloud);
                    if ((this.Config.Settings.IsCloud && !this.Config.Domains[dom.Domain].IsCloud)) {
                        // Does the Package Container for said domain exist already?
                        if (typeof (routeObj.WebSocket.Server[dom.Domain]) == "undefined") {
                            // No? Create it
                            routeObj.WebSocket.Server[dom.Domain] = new PackagesContainer();
                            routeObj.WebSocket.Server[dom.Domain].id = pkgcontainer.id;
                            routeObj.WebSocket.Server[dom.Domain].Sender = pkgcontainer.Sender;
                            routeObj.WebSocket.Server[dom.Domain].Recipient = dom.Domain;
                        }
                        // Add the package to the packages container for said domain.
                        routeObj.WebSocket.Server[dom.Domain].Packages.push(pkgcontainer.Packages[i]);

                        // No? We are either not in the cloud or both me and the destination are cloud based.
                        // Route through a Client -> Server connection.
                    } else {
                        // Does the Package Container for said domain exist already?
                        if (typeof (routeObj.WebSocket.Client[dom.Domain]) == "undefined") {
                            // No? Create it.
                            routeObj.WebSocket.Client[dom.Domain] = new PackagesContainer();
                            routeObj.WebSocket.Client[dom.Domain].id = pkgcontainer.id;
                            routeObj.WebSocket.Client[dom.Domain].Sender = pkgcontainer.Sender;
                            routeObj.WebSocket.Client[dom.Domain].Recipient = dom.Domain;
                        }
                        // Add the package to the packages container for said domain.
                        routeObj.WebSocket.Client[dom.Domain].Packages.push(pkgcontainer.Packages[i]);
                    }
                }
            }
            // No? Are we te recipient of the packages container?
        } else if (pkgcontainer.Recipient == this.Config.Settings.Name) {
            // Yes? Route locally.
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

        // Calculate the amount of entries in an Object.
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

        // Get the size of an object.
        size = Object.size(routeObj.WebSocket.Server);
        if (size > 0) {
            for (var key in routeObj.WebSocket.Server) {
                if (routeObj.WebSocket.Server[key].Packages.length > 0) {
                    console.log(`WebSocket Server [${key}] routing: ${routeObj.WebSocket.Server[key].Packages.length}`);
                    this.RouteThroughWebSocketServer(routeObj.WebSocket.Server[key]);
                }
            }
        }

        // Return the value either through Websocket or Return Promise.
        // Did our request come from a WebSocket Connection?
        if (fromWebSocket > 0) {
            // Yes? Send the Packages back upon resolve.
            var self = this;
            queued.then(function (value) {
                // Did the request come from the server?
                if (fromWebSocket == 1) {
                    // Yes? Send it back through the server.
                    self.RouteThroughWebSocketServer(value, value.Sender);
                } else {
                    // No? Send it back through the client.
                    self.RouteThroughWebSocketClient(value, value.Sender);
                }
            });
            // No? We got our request from a Data Source Manager.
        } else {
            // Return the Promise for a resolved packages container.
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
        const Config = new (require("../Config/Config"))();
        const WebSocket = new (require("../WebSocket/WebSocket"))();
        var client;
        var reroute = false;
        console.log(Object.keys(WebSocket.Client.Clients.Clients)[0]);
        if (!Config.Settings.IsCloud && !Config.Domains[domain].IsCloud) {
            client = WebSocket.Client.Clients.Clients[Object.keys(WebSocket.Client.Clients.Clients)[0]];
            reroute = true;
        } else {
            client = WebSocket.Client.Clients.Clients[domain];
        }
        client.Send(pkgcontainer, reroute);
    }

    /**
     * Route the Packages Container off-network via a WebSocket Server
     * @param {PackagesContainer} pkgcontainer
     * @private
     */
    RouteThroughWebSocketServer(pkgcontainer) {
        var wss = new (require('../WebSocket/Server/Server'))();
        wss.SendToClient(pkgcontainer);
    }
}

module.exports = Router;