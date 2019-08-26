"use strict";

const Account = require('./Account');
const Domain = require('./Domain');

class Settings {
    /**
     * 
     * @param {Domain} domain 
     * @param {Account} account 
     * @param {Account} admin 
     */
    constructor(domain, account, admin) {
        if (domain == null || domain == "") {
            this.Domain = new Domain();
        } else {
            this.Domain = domain;
        }

        if (account == null || account == "") {
            this.Account = new Account();
        } else {
            this.Account = account;
        }
        
        if (admin == null || admin == "") {
            this.Admin = new Account();
        } else {
            this.Admin = admin;
        }
    }

    /**
     * 
     * @param {Domain} domain 
     * @param {Account} account 
     * @param {Account} admin 
     */
    Set(domain, account, admin) {
        if (domain != null && domain != "") {
            this.Domain = domain;
        }

        if (account != null && account != "") {
            this.Account = account;
        }
        
        if (admin != null && admin != "") {
            this.Admin = admin;
        }
    }

    get Name() {
        return this.Domain.Name;
    }
    set Name(value) {
        this.Domain.Name = value;
    }
    get Path() {
        return this.Domain.Path;
    }
    set Path(value) {
        this.Domain.Path = value;
    }
    get Port() {
        return this.Domain.Port;
    }
    set Port(value) {
        this.Domain.Port = value;
    }
    get IsCloud() {
        return this.Domain.IsCloud;
    }
    set IsCloud(value) {
        this.Domain.IsCloud = value;
    }
}

module.exports = Settings;