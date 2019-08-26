"use strict";

const Domain = require('./Domain');
const Account = require('./Account');

class DataSource {
    /**
     * 
     * @param {string} name 
     * @param {string} type 
     * @param {string} path 
     * @param {Domain} domain 
     * @param {Account} account 
     * @param {string} datasource 
     * @param {object} options 
     */
    constructor (name, type, path, domain, account, datasource, options) {
        this.Name = name;
        this.type = type;
        this.Path = path;
        this.DataSource = datasource;
        this.Domain = domain;
        if (account != null && account != "" && typeof (account) != "undefined") {
            this.Account = account;
        }
        else {
            this.Account = new Account();
        }
        this.Options = options;
    }

    get User() {
        return this.Account.User;
    }
    set User(value) {
        this.Account.User = value;
    }
    get Password() {
        return this.Account.Password;
    }
    set Password(value) {
        this.Account.Password = value;
    }
}

module.exports = DataSource;