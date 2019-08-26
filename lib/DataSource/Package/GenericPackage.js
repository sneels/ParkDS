"use strict";

const UUID = require('uuid/v1');

class GenericPackage {
    constructor() {
        this.id = UUID();
        this.State = 0;
        this.ReturnToSender = false;
        this.IsResolved = false;
    }
}

module.exports = GenericPackage;