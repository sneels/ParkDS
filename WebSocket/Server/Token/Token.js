'use strict';

class Token {
    constructor(user, path, ip) {
        this.User = user;
        this.Path = path;
        this.IP = ip;
        this.Token = (require('uuid/v1'))();
    }
}

module.exports = Token;