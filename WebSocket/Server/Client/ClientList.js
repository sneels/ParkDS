'use strict';
const WebSocket = require('ws');
const Client = require('./Client');

let singletonInstance = null;
class ClientList {
    constructor() {
        if (!singletonInstance) {

            this._list = [];
            singletonInstance = this;
        }

        return singletonInstance;
    }
    /**
     * Add a WebSocket Server Client
     * @param {Client} client
     * @public
     */
    Add(client) {
        this._list.push(client);
    }

    /**
     * Get the Server Client by providing the ws
     * @param {WebSocket} ws The WebSocket Client
     * @returns {Client}
     * @public
     */
    GetClient(ws) {
        for (var i in this._list) {
            if (this._list[i].WebSocket == ws) {
                return this._list[i];
            }
        }

        throw new Error("Client not found");
    }

    /**
     * Get the Server Client by searching by name
     * @param {string} name The name
     * @returns {Client}
     * @public
     */
    GetClientByName(name) {
        for (var i in this._list) {
            if (this._list[i].Token.User == name) {
                return this._list[i];
            }
        }
    }

    /**
     * Remove the Server Client by searching by name
     * @param {string} name The name
     * @public
     */
    RemoveClientByName(name) {
        for (var i in this._list) {
            if (this._list[i].Token.User == name) {
                this._list.splice(i, 1);
            }
        }
    }
}

module.exports = ClientList