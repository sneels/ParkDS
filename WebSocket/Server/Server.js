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
const Log = require('../../Logger/Log');
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
        console.log(Log.Type());
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

                                var post = JSON.parse(qs.unescape(body));
                                var md5 = require('md5');
                                var cfg = new (require('../../Config/Config'));
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

                                        var TokenList = new (require('./Token/TokenList'));

                                        var Token = require('./Token/Token');
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
        this.wsServer.on('connection', (this.OnConnection.bind(this)));
        this.server.listen(this.port);
        
    }

    Stop() {
        this.wsServer.close(function (e) {

        });
        this.server.close(function (e) {

        });
    }

    /**
     * On Connection Event Handler
     * @param {WebSocket} ws
     * @param {any} request
     */
    OnConnection(ws, request) {
        var client = new Client();
        //console.
        var token = request.token;
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(time + " [\x1b[35mParkDS WebSocket Server\x1b[0m]: Client connected.\x1b[0m");
        try {
            if (token == this.tokenList.Get(token.Token)) {
                client.Token = token;
                this.tokenList.Remove(token.Token);

                // Client Event Handlers
                ws.on('message', (client.OnMessage).bind(client));
                ws.on('close', (client.OnClose).bind(client));

                client.ws = ws;
                this.clientList.Add(client);

                this.NotifyObservers();
            }
        }
        catch (e) {
        }
    
    }

    OnError(e) {
        console.log(e);
    }

    /**
     * Send a DataSource Packages Container to the client from target domain
     * @param {PackagesContainer} pkgcontainer the Packages Container
     * @public
     */
    SendToClient(pkgcontainer) {
        try {
            if (pkgcontainer.ReturnToSender == 1) {
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
        var PackagesContainer = new (require('../../DataSource/Package/PackagesContainer'))();
        var Package = new (require('../../DataSource/Package/Package'))();
        try {
            var obj = JSON.parse(json);
            var dspc = new PackagesContainer();
            dspc.id = obj.packet.id;
            dspc.State = obj.packet.IsResolved;
            dspc.ReturnToSender = obj.packet.ReturnToSender;
            dspc.Recipient = obj.packet.Recipient;
            dspc.Sender = obj.packet.Sender;

            for (var i in obj.packet.Packages) {
                var dsp = new Package();
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
        const Config = new (require('../../Config/Config'))();
        var obj = {
            Server: Config.Settings.Name, Status: this.status, Clients: []
        };
        for (var key in Config.Domains) {
            if (key != Config.Settings.Name) {
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