"use strict";

const ServerClient = require('./ServerClient');
const WebSocket = require('ws');
let instance = null;
class serverclientlist {
    constructor() {
        if (!instance) {
            this.List = [];
            instance = this;
        }

        return instance;
    }
    /**
     * Add a WebSocket Server Client to the list.
     * @param {ServerClient} client The Client.
     */
    Add(client) {
        this.List.push(client);
    }

    /**
     * get a client by providing the websocket.
     * @param {WebSocket} ws 
     * @returns {ServerClient};
     */
    GetClient(ws) {
        for (var i in this.List) {
            if (this.List[i].WebSocket == ws) {
                return this.List[i];
            }
        }
    }

    /**
     * Get a client by providing the name.
     * @param {string} name 
     * @returns {ServerClient};
     */
    GetClientByName(name) {
        for (var i in this.List) {
            if (this.List[i].Token.User == name) {
                return this.List[i];
            }
        }
    }

    /**
     * Remove a client by providing a websocket.
     * @param {WebSocket} ws 
     */
    RemoveClient(ws) {
        for (var i in this.List) {
            if (this.List[i].WebSocket == ws) {
                this.List.splice(parseInt(i), 1);
            }
        }
    }
    /**
     * Remove the Server Client by searching by name
     * @param {string} name The name
     * @public
     */
    RemoveClientByName(name) {
        for (var i in this.List) {
            if (this.List[i].Token.User == name) {
                this.List.splice(parseInt(i), 1);
            }
        }
    }
}
const ServerClientList = {
    Instance: new serverclientlist()
};
module.exports = ServerClientList;