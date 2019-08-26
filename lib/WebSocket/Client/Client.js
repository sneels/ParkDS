"use strict";

const ClientList = require('./ClientList');
const Config = require('../../Config/Config');
const Entity = require('../../Logger/Entity');
const https = require('https');
const Log = require('../../Logger/Log');
const LogType = require('../../Logger/LogType');
const md5 = require('md5');
const PackagesContainer = require('../../DataSource/Package/PackagesContainer');
const Queue = require('../../DataSource/Queue');
const Router = require('../../DataSource/Router');
const Token = require('../Server/Token/Token');
const WebSocket = require('ws');

class Client {
    /**
     * 
     * @param {string} domain 
     * @param {string} authurl 
     */
    constructor(domain, authurl) {
        this._config = Config.Instance;
        this._name = this._config.Settings.Name;
        this._path = this._config.Settings.Path;
        this._entity = new Entity();
        this._entity.Name = this._config.Settings.Name;

        this._entity.Domain = this._config.Settings.Name;
        this._retries = 0;
        this._status = 0;
        this._server = {
            Name: domain,
            Address: this._config.Domains.GetDomainByName(domain).Path,
            Port: this._config.Domains.GetDomainByName(domain).Port,
            Path: authurl
        };
        this.CreateAuthString();
        this.CreateData();
        this.CreateOptions(true, false);
    }
    get Name() {
        return this._name;
    }
    get Domain() {
        return this._server['Name'];
    }
    CreateAuthString() {
        var string = `${this._config.Settings.Account.User}:${this._config.Settings.Account.Password}@${this._path}`;
        this._authstring = md5(string);
    }
    CreateData() {
        this._data = JSON.stringify({
            user: this._config.Settings.Account.User,
            pass: this._authstring
        });
    }
    CreateOptions(requestCert, rejectUnauthorized) {
        var data = this._data;
        this._options = {
            hostname: this._server['Address'],
            port: this._server['Port'],
            path: this._server['Path'],
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            requestCert: requestCert,
            rejectUnauthorized: rejectUnauthorized
        };
    }
    requestToken(res) {
        var self = this;
    }
    Connect() {
        if (this._status >= 0 && this._status <= 1) {
            var self = this;
            Log.Register(this._entity, LogType.TRAFFIC, " Requesting Auth Token...");
            try {
                //var req = https.request(self._options, (this.requestToken).bind(this)); 
                var req = https.request(self._options, function (res) {
                    if (res.statusCode == 200) {
                        self._token = new Token(res.headers.authtoken['User'], res.headers.authtoken['Path'], res.headers.authtoken['IP']);
                        self._token.Token = res.headers.authtoken['Token'];
                        Log.Register(self._entity, LogType.TRAFFIC, `Token Received: ${res.headers.authtoken}`);
                        try {
                            var ws = new WebSocket(`wss://${self._server['Address']}:${self._server['Port']}?authtoken=${res.headers.authtoken}`, {
                                rejectUnauthorized: false
                            });
                            var Clients = ClientList.Instance;
                            ws.on("error", function (e) {
                                Log.Register(self._entity, LogType.TRAFFIC, "Connection Failed");
                                Log.Register(self._entity, LogType.ERROR, e);
                            });
                            ws.on("open", function () {
                                self._status = 2;
                                Clients.Add(self);
                                self._retries = 0;
                            });
                            ws.on("upgrade", function (e) {
                                Log.Register(self._entity, LogType.TRAFFIC, "Connected to Server");
                            });
                            ws.on("message", function (message) {
                                Log.Register(self._entity, LogType.TRAFFIC, `Message Received.`);
                                var obj = JSON.parse(message);
                                var dsp = self.createPackagesContainer(obj);
                                if (dsp.ReturnToSender) {
                                    var queue = Queue.Instance;
                                    queue.ResolvePackages(dsp);
                                }
                                else {
                                    var dsr = new Router();
                                    dsr.Route(dsp, 2);
                                }
                            });
                            ws.on("close", function (errc, errm) {
                                if (self._status == 2) {
                                    self._status = 1;
                                    Log.Register(self._entity, LogType.TRAFFIC, `Connection terminated: Code ${errc}: ${errm}.`);
                                    Clients.Remove(self);
                                    self.Reconnect();
                                }
                            });
                            self._ws = ws;
                            res.on('data', function (d) {
                            });
                        }
                        catch (e) {
                            if (e.code == 'ECONNREFUSED') {
                                self.Reconnect();
                            }
                        }
                    }
                    else if (res.statusCode == 404) {
                        self._status = 0;
                        self.Reconnect();
                        Log.Register(self._entity, LogType.TRAFFIC, `${self._name}@${self._path}\x1b[31m]: Request failed.`);
                    }
                    else {
                        self._status = 0;
                        self.Reconnect();
                        Log.Register(self._entity, LogType.TRAFFIC, `${self._name}@${self._path}\x1b[31m]: Request failed.`);
                    }
                    Log.Register(self._entity, LogType.STATUS, self._status);
                });
                req.on("error", function (err) {
                    self.Reconnect();
                    Log.Register(self._entity, LogType.ERROR, err);
                });
                req.write(this._data);
                req.end();
            }
            catch (e) {
                Log.Register(self._entity, LogType.ERROR, e);
                self._status = 0;
                self.Reconnect();
            }
        }
    }
    Disconnect() {
        this._status = 0;
        this._ws.close();
    }
    /**
     * Attempt to Reconnect to the server (max tries: 10)
     * @private
     * */
    Reconnect() {
        //if (this._retries < 10) {
        var e = 0;
        if (this._retries == 0) {
            e = 1;
        }
        else if (this._retries >= 9) {
            e = 600;
        }
        else {
            for (var i = 0; i <= this._retries; i++) {
                e += Math.pow(2, i);
            }
        }
        this._retries++;
        var s = e * 1000;
        var self = this;
        setTimeout(function () {
            self.Connect();
        }, s);
        /* } else {
             this._status = -1;
             ParkDS.WebSocket.Client.Clients.Update();
         }//*/
    }
    /**
     *
     * @param {PackagesContainer} dspc
     */
    Send(dspc, reroute) {
        if (this._status == 2) {
            var obj = this.createJSON(dspc);
            if (reroute) {
                obj = JSON.parse(obj);
                if (dspc.IsResolved) {
                    obj['reroute'] = dspc.Sender;
                }
                else {
                    obj['reroute'] = dspc.Recipient;
                }
                obj = JSON.stringify(obj);
            }
            this._ws.send(obj);
        }
        else {
            dspc.DeferredState.Reject();
        }
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
        obj["token"] = this._token;
        obj["packet"] = pkgcontainer.ToObject();
        return JSON.stringify(obj);
    }
}

module.exports = Client;