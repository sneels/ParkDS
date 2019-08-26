"use strict";

const Config = require('../../Config/Config');
const Entity = require('../../Logger/Entity');
const https = require('https');
const Log = require('../../Logger/Log');
const LogType = require('../../Logger/LogType');
const md5 = require('md5');
const qs = require('querystring');
const ServerClient = require('./Client/ServerClient');
const ServerClientList = require('./Client/ServerClientList');
const Token = require('./Token/Token');
const TokenList = require('./Token/TokenList');
const url = require('url');
const WebSocket = require('ws');

let instance = null;

class WSS {
    constructor() {
        if (!instance){            
        this._tokenList = TokenList.Instance;
        this._status = 0;
        this._entity = new Entity();
        this._config = Config.Instance;
        this._clientList = ServerClientList.Instance;
        this._entity.Name = "ParkDS WebSocket Server";
        this._entity.Domain = this._config.Settings.Name;

        instance = this;
        }

        return instance;
    }

    /**
     * Initialize the WebSocket Server by providing the Listening Port + Certification + Key
     * @param {number} port 
     * @param {Buffer} certification 
     * @param {Buffer} key 
     */
    Init(port, certification, key) {
        var self = this;
        this._port = port;
        this._https = https.createServer({
            cert: certification,
            key: key
        }, function (req, res) {
            switch (req.url) {
                case "/auth":
                    if (req.method == 'POST') {
                        var body = '';
                        req.on('data', function (data) {
                            body += data;
                        });
                        req.on('end', function () {
                            var post = JSON.parse(qs.unescape(body));
                            var cfg = Config.Instance;
                            var domain;
                            for (var key in cfg.Domains.List) {
                                if (cfg.Domains.List[key].Name == post.user) {
                                    domain = cfg.Domains.List[key];
                                }
                            }
                            if (domain != null) {
                                var hashstr = domain.Account.User + ":" + domain.Account.Password + "@" + domain.Path;
                                var hash = md5(hashstr);
                                if (hash == post['pass']) {
                                    var tokenlist = TokenList.Instance;
                                    var ip;
                                    if (req.headers['x-forwarded-for']) {
                                        ip = req.headers['x-forwarded-for'].toString().split(",")[0];
                                    }
                                    else if (req.connection && req.connection.remoteAddress) {
                                        ip = req.connection.remoteAddress;
                                    }
                                    var token = new Token(domain.Name, domain.Path, ip);
                                    tokenlist.Add(token);
                                    res.writeHead(200, { 'Content-Type': 'application/json', 'authtoken': token.Token });
                                    res.end("Authentication for Websockets");
                                }
                                else {
                                    res.statusCode = 401;
                                    res.end();
                                }
                            }
                            else {
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
                    res.writeHead(404);
                    break;
            }
            Log.Register(self._entity, LogType.TRAFFIC, `URL Accessed: ${req.url}`);
        });
        this._https.on('listening', (this.OnListening).bind(this));
        var server = this._https;
        this._wss = new WebSocket.Server({
            server,
            verifyClient: function (info, done) {
                let query = url.parse(info.req.url, true).query;
                try {
                    var token = self._tokenList.GetTokenByName(query.authtoken.toString());
                    if (token != null) {
                        var ip = info.req.socket._handle._parentWrap.remoteAddress;
                        if (token.IP == ip) {
                            info.req.token = token;
                            done(true, 200);
                        }
                        else {
                            self.OnError("Unauthorized Connection Attempt");
                            done(false, 401);
                        }
                    }
                    else {
                        self.OnError("Unauthorized Connection Attempt");
                        done(false, 401);
                    }
                }
                catch (e) {
                    Log.Register(self._entity, LogType.ERROR, e);
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
        this._wss.on('connection', (this.OnConnection.bind(this)));
        this._https.listen(this._port);
    }
    
    /**
     * Stop the server
     * */
    Stop() {
        this._wss.close(function (e) {
        });
        this._https.close(function (e) {
        });
    }

    OnListening() {
        this._status = 1;
        Log.Register(this._entity, LogType.STATUS, 1);
        Log.Register(this._entity, LogType.TRAFFIC, `WebSocket Server is now running and listening to port ${this._port}`);
    }

    SendToClient(pkgcontainer) {
        var self = this;
        try {
            if (pkgcontainer.ReturnToSender) {
                this._clientList.GetClientByName(pkgcontainer.Sender).Send(pkgcontainer);
                Log.Register(this._entity, LogType.TRAFFIC, `Sending package to ${pkgcontainer.Sender} // Return To Sender`);
            }
            else {
                this._clientList.GetClientByName(pkgcontainer.Recipient).Send(pkgcontainer);
                Log.Register(this._entity, LogType.TRAFFIC, `Sending package to ${pkgcontainer.Recipient}`);
            }
        }
        catch (e) {
            
            Log.Register(this._entity, LogType.ERROR, e);
        }
    }
    /**
    * On Connection Event Handler
    * @param {WebSocket} ws
    * @param {any} request
    */
    OnConnection(ws, request) {
        var client = new ServerClient();
        //console.
        var token = request.token;
        Log.Register(this._entity, LogType.TRAFFIC, "Client Connected.");
        try {
            if (token == this._tokenList.GetTokenByName(token.Token)) {
                client.Token = token;
                this._tokenList.Remove(token.Token);
                // Client Event Handlers
                ws.on('message', (client.OnMessage).bind(client));
                ws.on('close', (client.OnClose).bind(client));
                client.WebSocket = ws;
                this._clientList.Add(client);
            }
        }
        catch (e) {
            Log.Register(this._entity, LogType.ERROR, e);
        }
    }
    OnError(e) {
        Log.Register(this._entity, LogType.ERROR, e);
    }
}

const Server = {
    Instance: new WSS()
};

module.exports = Server;