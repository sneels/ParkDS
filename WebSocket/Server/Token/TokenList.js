'use strict';

const Token = require('./Token');

let singletonInstance = null;
class TokenList {

    constructor() {
        if (!singletonInstance) {
            this.tokens = new Object();
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
        }
        return singletonInstance;
    }

    /**
     * Add a token to the list.
     * @param {Token} token The token that needs to be added to the list.
     * @public
     */
    Add(token) {
        var self = this;
        this.tokens[token.Token] = token;
        setTimeout(function () {
            self.Remove(token.Token);
        }, 10000);
    }

    /**
     * Get the list of tokens
     * @returns {Object}
     * @public
     * */
    Tokens() {
        return this.tokens;
    }
    /**
     * Get the token from the list by providing the token string.
     * @param {String} token
     * @returns {Token}
     * @public
     */
    Get(token) {
        return this.tokens[token];
    }

    /**
     * Remove the token from the list by providing the token string.
     * @param {string} token The token string.
     * @public
     */
    Remove(token) {
        delete this.tokens[token];
    }
}
module.exports = TokenList;