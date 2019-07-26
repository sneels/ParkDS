'use strict';
class Servers {
    constructor() {
        this.Server = new (require('./Server'))();
        this.Clients = new (require('./Client/Clients'))();
        this.Tokens = new (require('./Token/Tokens'))();
    }
}

module.exports = Servers;