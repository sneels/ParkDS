'use strict';
const Client = require('./Client');
let singletonInstance = null;

class ClientList {
    constructor() {
        if (!singletonInstance) {
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
            this._observers = [];
            this.Clients = new Object();
        }

        return singletonInstance;
    }

    /**
     * Adds a WebSocket Client to the list
     * @param {Client} client the WebSocket Client
     */
    Add(client) {
        this.Clients[client.Server.Name] = client;
    }

    /**
     * Update the status of the Connection and Notify the Observers
     * @public
     * */
    Update() {
        var obj = []
        var Config = new (require('../../Config/Config'))();
        for (var key in Config.Domains) {
            if (key != Config.Settings.Name) {
                if (typeof (this.Clients[key]) != "undefined") {
                    obj.push({ Client: key, Status: this.Clients[key].Status });
                }
                else {
                    obj.push({ Client: key, Status: -1 });
                }
            }
        }

        this.Notify(obj)
    }

    /**
     * Add an Observer to the list of observers
     * @param {any} observer
     * @public
     */
    AddObserver(observer) {
        var exists = false
        for (var i in this._observers) {
            if (this._observers[i] == observer) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            this._observers.push(observer);
        }
        this.Update();

    }

    /**
     * Remove an Observer from the list
     * @param {any} observer
     * @public
     */
    RemoveObserver(observer) {
        var Config = new (require('../../Config/Config'))();
        for (var i in this._observers) {
            if (this._observers[i] == observer) {
                if (key != Config.Settings.Name) {
                    this._observers.splice(i);
                }
            }
        }
    }

    /**
     * Notify Observers of the new Status
     * @param {Object} value
     * @private
     */
    Notify(value) {
        for (var i in this._observers) {
            this._observers[i].Update(value);
        }

    }

    /**
     * Remove a client from the list
     * @param {Client} client
     * @public
     */
    Remove(client) {
        try {
            client.Close();
        }
        catch (e) {
            // DO NOTHING
        }

        delete this.Clients[client.Server.Name];
    }
}

module.exports = ClientList;