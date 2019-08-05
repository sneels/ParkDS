'use strict';
const WebSocket = require('ws');
const https = require('https');
const md5 = require('md5');

const Config = new (require('../../Config/Config'))();
const PackagesContainer = require('../../DataSource/Package/PackagesContainer');

class Client {
    /**
     * Create a new WebSocket Client by providing a domain name and URL to an Authentication page
     * @param {String} domain
     * @param {String} authurl
     * @public
     */
    constructor(domain, authurl) {
        this.ws = null;
        this.Token = null;
        this.Retries = 0;
        this.Status = 0; // -1: Connection Timed Out, Manual Retry Required; 0: Not Connected; 1: Reconnecting; 2: Connected;

        this.Server = {
            Name: domain,
            Address: Config.Domains[domain].Path,
            Port: Config.Domains[domain].Port,
            Path: authurl
        };

        this.Name = Config.Settings.Name;
        this.Pass = Config.Settings.Password;
        this.Path = Config.Settings.Path;
        this._authstring;
        this._data;

        this._options;

        this.CreateAuthString();
        this.CreateData();
        this.CreateOptions(true, false)

    }

    /**
     * @private
     * */
    CreateAuthString() {
        var string = `${this.Name}:${this.Pass}@${this.Path}`
        this._authstring = md5(string);
    }

    /**
     * @private
     * */
    CreateData() {
        this._data = JSON.stringify({
            user: this.Name,
            pass: this._authstring
        });
    }

    /**
     * Create options by wether or not it requests the Certificate and/or reject unauthorized certificates
     * @param {Boolean} requestCert Request Certificate?
     * @param {Boolean} rejectUnauthorized Reject unauthorized Certificate?
     * @public
     */
    CreateOptions(requestCert, rejectUnauthorized) {
        var data = this._data;
        this._options = {
            hostname: this.Server.Address,
            port: this.Server.Port,
            path: this.Server.Path,
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            requestCert: requestCert,
            rejectUnauthorized: rejectUnauthorized
        }
    }

    /**
     * Connect to the WebSocket Server
     * @public
     */
    Connect() {
        if (this.Status >= 0 && this.Status <= 1) {
            var self = this;
            this.
            var now = new Date();
            var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
            console.log(`${time} [\x1b[32mData Source WebSocket Client \x1b[1m${this.Name}@${this.Path}\x1b[0m]: Requesting Auth Token...`);
            try {
                var req = https.request(self._options, function (res) {
                    if (res.statusCode == 200) {
                        self.Token = res.headers.authtoken;

                        now = new Date();
                        time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                        console.log(`${time} [\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[0m]: Token received: ${res.headers.authtoken}`);

                        try {
                            var ws = new WebSocket(`wss://${self.Server.Address}:${self.Server.Port}?authtoken=${res.headers.authtoken}`, {
                                rejectUnauthorized: false
                            });

                            var Clients = new (require("./ClientList"))();
                            ws.on("error", function (e) {
                                now = new Date();
                                time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                                console.error(`\x1b[31m${time} [\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[31m]: Connection failed: ${e}\x1b[0m`)
                                console.log(e)
                            });

                            ws.on("open", function () {
                                self.Status = 2;
                               // if (self.Retries > 0) {
                                    Clients.Add(self);
                               // }
                                self.Retries = 0;
                                Clients.Update();
                            });

                            ws.on("upgrade", function (e) {
                                console.log(`${time} [\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[0m]: Connected to server`);
                            });

                            ws.on("message", function (message) {
                                now = new Date();
                                time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                                console.log(`${time} [\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[0m]: Message received`);
                                
                                var dsp = self._CreatePackage(message);
                                if (dsp.ReturnToSender) {
                                    var Queue = new (require('../../DataSource/Queue'))();
                                    Queue.ResolvePackages(dsp.id, dsp.Packages)
                                } else {
                                    var Router = require('../../DataSource/Queue');
                                    var dsr = new Router();
                                    dsr.Route(dsp, 2);
                                }
                            });
                            ws.on("close", function (errc, errm) {
                                if (self.Status == 2) {
                                    self.Status = 1;
                                    now = new Date();
                                    time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                                    console.log(`\x1b[31m${time}[\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[0m\x1b[31m]: Connection terminated: Code ${errc}: ${errm}\x1b[0m`);
                                    Clients.Remove(self);
                                    Clients.Update();
                                    self.Reconnect();
                                }
                            });
                            self.ws = ws;
                            res.on('data', function (d) {
                            });
                        } catch (e) {
                            if (e.code == 'ECONNREFUSED') {
                                self.Reconnect();
                            }
                        }
                    } else if (res.statusCode == 404) {
                        self.Status = false;
                        self.Reconnect();
                    } else {
                        self.Status = false;
                        self.Reconnect();

                        now = new Date();
                        time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
                        console.error(`\x1b[31m${time} [\x1b[32mData Source WebSocket Client \x1b[1m${self.Name}@${self.Path}\x1b[31m]: Request failed\x1b[0m`);
                    }
                });

                req.on('error', function (error) {
                    console.log(error);
                    self.Status = false;
                    if (error.code == 'ECONNREFUSED') {
                        self.Reconnect();
                    }
                });

                req.write(this._data);
                req.end();
            } catch {
                self.Status = false;
                self.Reconnect();
            }
        }
    }

    Disconnect() {
        this.Status = 0;
        this.ws.close();
    }

    /**
     * Attempt to Reconnect to the server (max tries: 10)
     * @private
     * */
    Reconnect() {

        //if (this.Retries < 10) {
            var e = 0;
            if (this.Retries == 0) {
                e = 1;
            } else if (this.Retries == 9) {
                e = 600;
            } else {
                for (var i = 0; i <= this.Retries; i++) {
                    e += Math.pow(2, i);
                }
            }

            this.Retries++;
            var s = e * 1000;
            
            var self = this;
            setTimeout(function () {
                self.Connect();
            }, s);
       /* } else {
            this.Status = -1;
            ParkDS.WebSocket.Client.Clients.Update();
        }//*/
    }

    /**
     * 
     * @param {PackagesContainer} dspc
     */
    Send(dspc, reroute) {
        if (this.Status == 2) {
            var obj = this._CreateJSON(dspc);
            if (reroute) {
                obj = JSON.parse(obj);
                if (dspc.IsResolved) {
                    obj.reroute = dspc.Sender;
                } else {
                    obj.reroute = dspc.Recipient;
                }
                obj = JSON.stringify(obj);
            }
            this.ws.send(obj);
        } else {
            dspc.DeferredState.Reject();   
        }
    }

    /**
     * 
     * @param {String} json
     * @returns {PackagesContainer}
     * @private
     */
    _CreatePackage(json) {
        try {
            var obj = JSON.parse(json);
            var PackagesContainer = require('../../DataSource/Package/PackagesContainer');
            var dspc = new PackagesContainer(obj.packet);
            
            return dspc;
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 
     * @param {PackagesContainer} dspc
     * @returns {String}
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