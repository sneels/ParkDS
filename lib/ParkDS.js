"use strict";

const Logger = require("./Logger/Logger");
const Config = require("./Config/Config");
const ConnectorList = require("./DataSource/Connector/ConnectorList");
const Server = require("./WebSocket/Server/Server");
const Client = require("./WebSocket/Client/Client");
const ClientList = require("./WebSocket/Client/ClientList");

class ParkDS {
    constructor() {
        this._logger = Logger.Instance;
        this._config = Config.Instance;
        this._connectors = ConnectorList.Instance;
    }
    
    get Connectors() {
        return this._connectors;
    }
    Start() {
        if (this._config.Settings.IsCloud) {
            var wss = Server.Instance;
            wss.Init(this._config.Settings.Port, this._config.Certificate.Cert, this._config.Certificate.Key);
            wss.Start();
        }
        for (var i in this._config.Domains.List) {
            var domain = this._config.Domains.List[i];
            if ((domain.Name != this._config.Settings.Name) && this._config.Domains.List[i].IsCloud) {
                var wsClient = new Client(domain.Name, "/auth");
                wsClient.Connect();
            }
        }
        this._connectors.ConnectAll();
    }
    Stop() {
        if (this._config.Settings.IsCloud) {
            var wss = Server.Instance;
            wss.Stop();
        }
        for (var domain in this._config.Domains.List) {
            if ((domain != this._config.Settings.Name) && this._config.Domains.List[domain].IsCloud) {
                var wsClient = new Client(domain, "/auth");
                ClientList.Instance.Remove(wsClient);
                wsClient.Disconnect();
            }
        }
    }
}

module.exports = ParkDS;