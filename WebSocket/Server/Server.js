'use strict';

// Add required Libraries
const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');
const url = require('url');
const qs = require('querystring');

const Client = require('./Client/Client');
const ClientList = require('./Client/ClientList');
const TokenList = require('./Token/TokenList');

let singletonInstance = null;
class Server {
    constructor() {
        if (!singletonInstance) {
            this.list = [];
            this.wsServer;
            this.server
            this.clientList;
            this.tokenList;
            this.port;
            this.status = 0;
            this.observers = [];
            this.clientList = new ClientList();
            this.tokenList = new TokenList();

            singletonInstance = this;
        }

        // Returns the initiated Class
        return singletonInstance;
    }

    /**
     * Initialize the WebSocket Server by providing the Listening Port + Certification + Key
     * @param {int} port The Listening Port
     * @param {fs} certification The Certification
     * @param {fs} key The Key
     * @public
     */
    Initialize(port, certification, key) {
        this.port = port
        var self = this;

        // SSL Server Start
        this.server = https.createServer({
            cert: certification,
            key: key
        },
            function (req, res) {
                switch (req.url) {
                    case "/auth":
                        if (req.method == 'POST') {
                            var body = '';
                            req.on('data', function (data) {
                                body += data;
                            });

                            req.on('end', function () {

                                var ParkDS = new (require('../../ParkDS'));
                                var post = JSON.parse(qs.unescape(body));
                                var md5 = require('md5');
                                var cfg = ParkDS.Config;
                                var domain;
                                for (var key in cfg.Domains) {
                                    if (cfg.Domains[key].Name == post.user) {
                                        domain = cfg.Domains[key];
                                    }
                                }

                                if (typeof (domain) !== "undefined" && domain.hasOwnProperty("Name")) {
                                    var hashstr = domain.Name + ":" + cfg.Settings.Password + "@" + domain.Path;
                                    var hash = md5(hashstr);
                                    if (hash == post.pass) {

                                        var TokenList = ParkDS.WebSocket.Server.Tokens.TokenList;

                                        var Token = ParkDS.WebSocket.Server.Tokens.Token;
                                        var ip;

                                        if (req.headers['x-forwarded-for']) {
                                            ip = req.headers['x-forwarded-for'].split(",")[0];
                                        } else if (req.connection && req.connection.remoteAddress) {
                                            ip = req.connection.remoteAddress;
                                        } else {
                                            ip = req.ip;
                                        }

                                        var token = new Token(domain.Name, domain.Path, ip);
                                        TokenList.Add(token);
                                        res.writeHead(200, { 'Content-Type': 'application/json', 'authtoken': token.Token });
                                        res.end("Authentication for Websockets");
                                    } else {
                                        res.statusCode = 401;
                                        res.end();
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.end();
                                }
                            });
                        }
                        else {
                            res.statusCode = 404;
                            res.end();
                        }
                        break;

                    case "acp/login":

                        break;

                    default:
                        res.writeHead(404)
                        break;
                }

                var now = new Date();
                var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                console.log(time + " [\x1b[36mHTTPS Server\x1b[0m]: " + "URL Accessed: " + req.url);
            });

        this.server.on('listening', function () {
            self.status = 1;
            self.NotifyObservers();
            var now = new Date();
            var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
            console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: WebSocket Server is now running and listening to port \x1b[33m" + self.port + "\x1b[0m");
        });
        var server = this.server;

        // WebSocket Server Start
        this.wsServer = new WebSocket.Server({
            server,
            verifyClient: function (info, done) {
                let query = url.parse(info.req.url, true).query;
                try {
                    var token = self.tokenList.Get(query.authtoken);
                    if (token != "" || typeof (token) != "undefined") {
                        var ip = info.req.socket._handle._parentWrap.remoteAddress;
                        if (token.IP == ip) {
                            info.req.token = token;
                            done(true);
                        } else {
                            self.OnError("Unauthorized Connection Attempt");
                            done(false, 401);
                        }
                    } else {
                        self.OnError("Unauthorized Connection Attempt");
                        done(false, 401);
                    }
                }
                catch (e) {
                   self.OnError("Unauthorized Connection Attempt");
                   done(false, 401);
                }
            }
        });
    }

    /**
     * Start the server
     * @public
     */
    Start() {
        var server = this.server;
        var self = this;
        var ParkDS = new (require('../../ParkDS'))();
        this.wsServer.on('connection', function connection(ws, request) {
            var client = new Client();

            var token = request.token;
            var now = new Date();
            var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
            
            try {
                if (token == self.tokenList.Get(token.Token)) {
                    self.tokenList.Remove(token.Token);
                    client.Token = token;

                    ws.on('message', function (message) {
                        try {
                            
                            var now = new Date();
                            var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                            console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: Message Received.\x1b[0m");

                            var dsp = self._CreatePackage(message);
                            if (dsp.ReturnToSender) {
                                    ParkDS.DataSource.Queue.ResolvePackages(dsp.id, dsp.Packages)
                            } else {
                                var dsr = new ParkDS.DataSource.Router();
                                dsr.Route(dsp, 1);
                            }
                        }
                        catch (e) {
                            self.OnError(e);
                            ws.close(1008, "Client not registered");
                        }
                    });

                    ws.on("close", function (code, reason) {
                        if (reason == "") {
                            reason = "Connection Terminated Abnormally";
                        }
                        var now = new Date();
                        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                        console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: Client [\x1b[32m\x1b[1m" + token.User + "@" + token.Path + "\x1b[0m] Disconnected with Code: \x1b[33m" + code + " \x1b[31m" + reason + "\x1b[0m");

                        self.clientList.RemoveClientByName(token.User);
                        self.NotifyObservers();
                    });

                    ws.on("error", function (e) {
                        var now = new Date();
                        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                        console.error(`\x1b[31m${time} [\x1b[35mParkDS WebSocket Server\x1b[31m]: ${e}\x1b[0m`);
                    });

                    client.ws = ws;
                    self.clientList.Add(client);

                    self.NotifyObservers();
                }
            }
            catch (e) {

            }
        });
        
        this.server.listen(this.port);
        
    }

    /**
     * Send a DataSource Packages Container to the client from target domain
     * @param {PackagesContainer} pkgcontainer the Packages Container
     * @public
     */
    SendToClient(pkgcontainer) {
        try {
            if (pkgcontainer.ReturnToSender) {
                this.clientList.GetClientByName(pkgcontainer.Sender).Send(pkgcontainer);
            } else {
                this.clientList.GetClientByName(pkgcontainer.Recipient).Send(pkgcontainer);
            }
        } catch {
            pkgcontainer.Reject();
        }
    }

    /**
     * Convert a JSON string to q Data Source Packages Container
     * @param {string} json The JSON string
     * @returns {PackagesContainer} The Data Source Packages Container
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
     * Create a Stringified JSON from a Data Source Packages Container
     * @param {PackagesContainer} dspc the Packages Container
     * @private
     */
    _CreateJSON(dspc) {
        var obj = new Object();
        obj.token = this.Token;
        obj.packet = dspc.ToObject();
        return JSON.stringify(obj);
    }

    // Observer Pattern

    /**
     * Get the status of the server and the connections connected to it
     * @returns {Object}
     * @private
     * */
    GetStatus() {
        const ParkDS = new (require('../../ParkDS'))();
        var obj = {
            Server: ParkDS.Config.Settings.Name, Status: this.status, Clients: []
        };
        for (var key in ParkDS.Config.Domains) {
            if (key != ParkDS.Config.Settings.Name) {
                if (this.clientList.GetClientByName(key)) {
                    var cs = new Object({ Client: key, Status: 1 })
                    obj.Clients.push(cs);
                }
                else {
                    var cs = new Object({ client: key, Status: 0 })
                    obj.Clients.push(cs);
                }
            }
        }
        return obj;
    }

    /**
     * Notify All Observers for Status Changes
     * @private
     * */
    NotifyObservers() {
        for (var i in this.observers) {
            this.observers[i].Update(this.GetStatus());
        }
    }

    /**
     * Add an observer to the list (REQUIRES an Update(value) method!)
     * @param {class} observer
     * @public
     */
    AddObserver(observer) {
        var exists = false
        for (var i in this.observers) {
            if (this.observers[i] == observer) {
                exists = true
            }
        }
        if (!exists) {
            this.observers.push(observer);
        }
        this.NotifyObservers();
    }

    /**
     * Removes an existing observer from the list;
     * @param {any} observer
     * @public
     */
    RemoveObserver(observer) {
        for (var i in this.observers) {
            if (this.observers[i] == observer) {
                this.observers.splice(i);
            }
        }
    }
}

module.exports = Server;