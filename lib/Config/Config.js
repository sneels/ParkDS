"use strict";

const Account = require('./Account');
const Certificate = require('../Certificate');
const DataSourceList = require('./DataSourceList');
const DomainList = require('./DomainList');
const Settings = require('./Settings');

let instance = null;
class CFG {
    constructor() {
        if (!instance) {
            this.Account = new Account();
            this.Certificate = new Certificate();
            this.DataSources = new DataSourceList();
            this.Domains = new DomainList();
            this.Settings = new Settings();

            instance = this;
        }

        return instance;
    }
}

var Config = new Object({
    Instance: new CFG()
})
module.exports = Config;