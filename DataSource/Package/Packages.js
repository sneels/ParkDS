'use strict';

class Packages {
    constructor() {
        this.IPackage = require('./IPackage');
        this.Package = require('./Package');
        this.PackagesContainer = require('./PackagesContainer');
    }
}

module.exports = Packages;