'use strict';

class Tokens {
    constructor() {
        this.Token = require('./Token');
        this.TokenList = new (require('./TokenList'))();
    }
}

module.exports = Tokens;