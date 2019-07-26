'use strict';

class WebSocket {
    constructor() {
        this.Client = new (require('./Client/Clients'))();
        this.Server = new (require('./Server/Servers'))();
    }
}

module.exports = WebSocket;