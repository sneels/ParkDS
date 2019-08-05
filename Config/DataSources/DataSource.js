'use strict';

class ConfigDataSource {
    constructor() {
        this.Name = "";
        this.DataSourceType = "";
        this.Path = "";
        this.Account = "";
        this.Password = "";
        this.DbName = "";
        this.Options = new Object();
    }
}

module.exports = ConfigDataSource;