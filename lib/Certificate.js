"use strict";

class Certificate {
    /**
     * 
     * @param {Buffer} cert 
     * @param {Buffer} key 
     */
    constructor(cert, key) {
        this.Cert = cert;
        this.Key = key;
    }
}

module.exports = Certificate;