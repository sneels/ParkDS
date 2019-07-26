'use strict';

/**
 * Class representing a Data Source Park.
 * */
class ParkDS {
    /**
     * Create a new `ParkDS`
     * */
    constructor() {
        /** @private {Array} private array */
        this._observers = [];
        this._status = new Object({
            WebSocket: {
                Server: {
                    Server: "",
                    Status: 0,
                    Clients: []
                },
                Clients: []
            },
            DataSources: []
        });

        this.Config = new (require('./Config/Config'))();
        this.DataSource = new (require('./DataSource/DataSource'))();
        this.WebSocket = new (require('./WebSocket/WebSocket'))();
    }

    // Observer Pattern
    /**
     * Add an observer to the list
     * @param {any} observer
     * @returns {Boolean}
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

        this.WebSocket.Server.Server.AddObserver(this);
        this.WebSocket.Client.Clients.AddObserver(this);
        this.Update();
        return true
    }

    /**
     * Remove an observer from the list
     * @param {any} observer
     */
    RemoveObserver(observer) {
        for (var i in this._observers) {
            if (this._observers[i] == observer) {
                this._observers.splice(i);
            }
        }
    }

    /**
     * Update this object from the Obserable
     * @param {any} value
     * @private
     */
    Update(value) {
        if (typeof (value) != "undefined") {
            if (value['Server']) {
                this._status.WebSocket.Server = value;
            } else {
                this._status.WebSocket.Clients = value;
            }


            this.Notify()
        }
    }

    /**
     * Notify any observers on changes
     * */
    Notify() {
        for (var i in this._observers) {
            this._observers[i].Update(this._status);
        }

    }
}

module.exports = ParkDS;