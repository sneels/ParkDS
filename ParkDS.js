'use strict';

const Test = function () {
    const c = require('./Config/Config');
    const d = require('./DataSource/DataSource');
    const cfg = new c();
    const ds = new d();
    this.Certificate = {
        Cert: "",
        Key: ""
    };

    const Start = function () {
        var wss = new (require('./WebSocket/Server/Server'))();
        wss.Initialize(this.Config.Settings.Port, this.Certificate.Cert, this.Certificate.Key);
        wss.Start();
        for (var domain in cfg.Domains) {
            if ((domain != cfg.Settings.Name) && cfg.Domains[domain].IsCloud) {

                var wsClient = new (require('./WebSocket/Client/Client'))(domain, "/auth");
                new (require('./WebSocket/Client/ClientList'))().Add(wsClient);
                wsClient.Connect();
            }
        }
    }

    const Stop = function () {
        var wss = new (require('./WebSocket/Server/Server'))();
        wss.Stop();

        var clients = new (require('./WebSocket/Client/ClientList'))();
        for (var domain in cfg.Domains) {
            if ((domain != cfg.Settings.Name) && cfg.Domains[domain].IsCloud) {
                clients.Remove(clients.Clients[domain]);
                wsClient.Disconnect();
            }
        }
    }

    return {
        Start: Start,
        Stop: Stop
    }
}
/**
 * Class representing a Data Source Park.
 * */ 
class ParkDS {
   /**
    * Create a new `ParkDS`
    * */ 
    constructor() {
   
       var c = new (require('./Config/Config'))();
       var d = new (require('./DataSource/DataSource'))();

       this.Config = c;
       this.DataSource = d;
       this.Certificate = {
           Cert: "",
           Key: ""
       };

    }

    Start() {
       var wss = new (require('./WebSocket/Server/Server'))();
       wss.Initialize(this.Config.Settings.Port, this.Certificate.Cert, this.Certificate.Key);
       wss.Start();
       for (var domain in this.Config.Domains) {
           if ((domain != this.Config.Settings.Name) && this.Config.Domains[domain].IsCloud) {

               var wsClient = new (require('./WebSocket/Client/Client'))(domain, "/auth");
               new (require('./WebSocket/Client/ClientList'))().Add(wsClient);
               wsClient.Connect();
           }
       }
    }

    Stop() {
       var wss = new (require('./WebSocket/Server/Server'))();
       wss.Initialize();
       wss.Stop();

       var clients = new (require('./WebSocket/Client/ClientList'))();
       for (var domain in clients.Clients) {
           if ((domain != this.Config.Settings.Name) && this.Config.Domains[domain].IsCloud) {
               clients.Remove(clients.Clients[domain]);
               wsClient.Disconnect();
           }
       }

    }
}
//*/
module.exports = ParkDS;