"use strict";

let instance = null;
class clientlist {
    constructor() {
        if (!instance) {
            this._list = [];
            instance = this;
        }

        return instance;
    }
    /**
     * Adds a WebSocket Client to the list
     * @param {Client} client the WebSocket Client
     */
    Add(client) {
        this._list.push(client);
    }
    /**
     * Remove a client from the list
     * @param {Client} client
     */
    Remove(client) {
        try {
            client.Close();
        }
        catch (e) {
            // DO NOTHING
        }
        for (var i in this._list) {
            if (this._list[i] == client) {
                this._list.slice(parseInt(i), 1);
            }
        }
    }
    get List() {
        return this._list;
    }
    GetClientByDomainName(name) {
        for (var i in this._list) {
            if (this._list[i].Domain == name) {
                return this._list[i];
            }
        }
    }
}

const ClientList = {
    Instance: new clientlist()
};

module.exports = ClientList;