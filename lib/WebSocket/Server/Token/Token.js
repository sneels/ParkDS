"use strict";

const UUID = require('uuid/v1');

class Token {
    constructor(user, path, ip) {
        this.User = user;
        this.Path = path;
        this.IP = ip;
        this.Token = UUID();
    }
}

module.exports = Token;