'use strict';

class Clients {
    constructor() {
        this.Client = require('./Client');
        this.Clients = new (require('./ClientList'))();
    }
}

module.exports = Clients;