"use strict";

const Account = require('./Account');

class Domain {
    constructor() {
        this.Account = new Account();
        this.Name = "";
        this.Path = "";
        this.Port = 0;
        this.IsCloud = false;
    }
}

module.exports = Domain;