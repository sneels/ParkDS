"use strict";

const Token = require('./Token');

let instance = null;
class tokenlist {
    constructor() {
        if (!instance) {
            this.Tokens = [];
            instance = this;
        }

        return this;
    }

    /**
     * Add a token to the list.
     * @param {Token} token 
     */
    Add(token) {
        this.Tokens.push(token);
        var self = this;
        setTimeout(function () {
        }, 10000);
    }

    /**
     * Get a token by providing the Unique Token Value
     * @param {string} token 
     */
    GetToken(token) {
        for (var i in this.Tokens) {
            if (this.Tokens[i].Token == token.Token) {
                return this.Tokens[i];
            }
        }
        throw new Error("Token does not exist!");
    }

    /**
     * Get a token by providing the name;
     * @param {string} token 
     */
    GetTokenByName(token) {
        for (var i in this.Tokens) {
            if (this.Tokens[i].Token == token) {
                return this.Tokens[i];
            }
        }
        throw new Error("Token does not exist!");
    }
    
    /**
     * Remove a token by providing the unique token value.
     * @param {string} token 
     */
    Remove(token) {
        for (var i in this.Tokens) {
            if (this.Tokens[i].Token == token.Token) {
                this.Tokens.splice(parseInt(i), 1);
                break;
            }
        }
    }
}
const TokenList = {
    Instance: new tokenlist()
};
module.exports = TokenList;