# ParkDS: A Cross-Domain Data Source Collection
 ParkDS is a simple library that allows for several Data sources *(databases, file servers, etc.)* to be able to connect to eachother in a safe and quick way by using SSL WebSocket connections between each domain.

# Table of Contents
* [Installation](#installation)
* [Usage](#usage)
  * [Setting Up ParkDS](#usageSetup)
    * [Single-Domain](#usageSetupSingle)
      * [Preview Connectors](#usagePreviewConnectors)
        * [MS SQL](#usagePreviewConnectorsMssql)
        * [My SQL](#usagePreviewConnectorsMysql)
   * [Cross-Domain](#usageSetupMulti)
<a name="installation"/>

# Installation
`npm install parkds`

<a name="usage"/>

# Usage

<a name="usageSetup"/>

## Setting Up ParkDS

First off, you'll need to build your ParkDS Config, how you store that config is up to you. In the example it will be hard coded, but you could easily work with a JSON file or something else.
***NOTE: When a domain is considered cloud it means it can act as a websocket server, if not, it can only make a websocket client connection to a server, you require a 'cloud' domain if you are working cross domain***

<a name="usageSetupSingle"/>

### Setting up the config for Single-Domain
**The configuration:**
```javascript
const ParkDS = require('parkds');
const Config = ParkDS.Config.Instance;

// We need to add at least one domain for ParkDS to work, so do just that.
const domain = new ParkDS.Config.Domain();
domain.Name = "Local";
domain.Path = "local.example.org";
domain.Port = 443;
domain.IsCloud = false; // Important if you are working in single-domain, setting this to true will start an arbitrary websocket server.
domain.Account.User = "user";
domain.Account.Passworkd = "pass";

Config.Domains.Add(domain);

// Let's add a MySql database
const datasource = new ParkDS.Config.DataSource();
datasource.Name = "MyMySqlDB";
datasource.Type = "MySql";
datasource.Domain = "Local" // this has to be the name of the domain we added to the config
datasource.Path = "path.to.mysql.database";
datasource.Option = {} // This may be relevant later, see the Creating a Connector section

Config.DataSources.Add(datasource);

const datasource2 = new ParkDS.Config.DataSource();
datasource2.Name = "MsSqlDatabase";
datasource2.Type = "mssql";
datasource2.Domain = "Local" // this has to be the name of the domain we added to the config
datasource2.Path = "path.to.mssql.database";
datasource2.Option = {} // This may be relevant later, see the Creating a Connector section

Config.DataSources.Add(datasource2);
```
<a name="usagePreviewConnectors"/>

#### Preview connectors

<a name="usagePreviewConnectorsMssql"/>

**MS SQL:**
```javascript
"use strict";
const mssql = require("mssql");
const ParkDS = require('parkds');
const EConnector = ParkDS.Connectors.EConnector;
const Log = ParkDS.Logger.Log;
const Entity = ParkDS.Logger.Entity;
const LogType = ParkDS.Logger.LogType;
const Config = ParkDS.Config.Instance;

class MsSqlConnector extends EConnector {
    constructor(ds) {
        super(ds);
        this._entity = new Entity();
        this._entity.Name = "Ms Sql Connector";
        this._entity.Domain = Config.Settings.Name;
        this._config = {
            user: ds.User,
            password: ds.Password,
            server: ds.Path,
            database: ds.Datasource
        };
        this._pool = new mssql.ConnectionPool(this._config);
    }
    /**
     * Sends a query to the MsSql Database
     * @param {string} query the query string to retrieve data
     * @returns {Object} returns a JSON Object
     */
    Query(query) {
        var resolve;
        var reject;
        var obj = new Object();
        const ps = new mssql.PreparedStatement(this._pool);
        for (var i in query.Bindings) {
            var type;
            switch (query.Bindings[i].Type) {
                case "nvarchar":
                    type = mssql.NVarChar(50);
                    break;
            }
            ps.input(query.Bindings[i].Name, type);
            obj[query.Bindings[i].Name] = query.Bindings[i].Value;
        }
        ps.prepare(query.String, err => {
            if (err) {
                Log.Register(this._entity, LogType.ERROR, err);
                reject(err);
            }
            else {
                ps.execute(obj, (err, result) => {
                    if (err) {
                        Log.Register(this._entity, LogType.ERROR, err);
                        var e = new Object({
                            Error: {
                                Code: err.code,
                                Number: err.originalError.info.number,
                                Message: err.originalError.info.message,
                                State: null,
                                Fatal: null
                            }
                        });
                        reject(e);
                    }
                    else {
                        var res = new Object({ rows: result.recordset });
                        ps.unprepare(err => {
                            if (err) {
                                Log.Register(this._entity, LogType.ERROR, err);
                                reject(err);
                            }
                            else {
                                resolve(res);
                            }
                        });
                    }
                });
            }
        });
        return new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
    }
    OpenConnection() {
        this._pool.connect(err => {
            var e;
            if (err) {
                
                e = new Object({
                    Status: 0,
                    Error: {
                        Code: err.originalError.code,
                        Message: err.originalError.message,
                        Type: err.name
                    }
                });
            }
            else {
                e = new Object({
                    Status: 2
                });
            }
            Log.Register(this._entity, LogType.ERROR, err);
        });
    }
    /**
     * Close the connection to the MsSQl Database
     * */
    CloseConnection() {
        this._pool.close();
    }
}
module.exports = MsSqlConnector;
```
<a name="usagePreviewConnectorsMysql"/>

**My SQL:**
```javascript
"use strict";
const MySql = require("mysql");
const ParkDS = require('parkds');
const EConnector = ParkDS.Connectors.EConnector;
const Log = ParkDS.Logger.Log;
const Entity = ParkDS.Logger.Entity;
const LogType = ParkDS.Logger.LogType;
const Config = ParkDS.Config.Instance;

class MySqlconnector extends EConnector {
    constructor(ds) {
        super(ds);
        this._entity = new Entity();
        this._entity.Name = "Ms Sql Connector";
        this._entity.Domain = Config.Settings.Name;
        this._config = {
            host: ds.Path,
            user: ds.User,
            password: ds.Password,
            database: ds.Datasource
        };
    }
    OpenConnection() {
        this._status = 1;
        try {
            this._pool = MySql.createPool(this._config);
        }
        catch (e) {
            Log.Register(this._entity, LogType.ERROR, e);
            // Add logging
        }
    }
    CloseConnection() {
        this._status = 0;
        try {
            this._connection.end();
        }
        catch (e) {
            Log.Register(this._entity, LogType.ERROR, e);
        }
    }
    /**
     * Sends a query to a MySql Database
     * @param {string} query the query string to retrieve data
     * @returns {Object} returns a JSON Object
     */
    Query(query) {
        var self = this;
        var binds = [];
        var resolve;
        var reject;
        for (var i in query.Bindings) {
            binds.push(query.Bindings[i].Value);
        }
        this._pool.getConnection(function (err, connection) {
            if (err) {
                Log.Register(this._entity, LogType.ERROR, err);
                var e = new Object({
                    Error: {
                        Code: err.code,
                        Number: err.errno,
                        Message: err.sqlMessage,
                        State: err.sqlState,
                        Fatal: err.fatal
                    }
                });
                resolve(e);
            }
            else {
                connection.query(query.String, binds, function (err, rows) {
                    connection.release();
                    if (err) {
                        Log.Register(this._entity, LogType.ERROR, err);
                        var e = new Object({
                            Error: {
                                Code: err.code,
                                Number: err.errno,
                                Message: err.sqlMessage,
                                State: err.sqlState,
                                Fatal: err.fatal
                            }
                        });
                        resolve(e);
                    }
                    else {
                        resolve(self.ParseToObject(rows));
                    }
                });
            }
        });
        return new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
    }
    /**
     * Give an Array to receive an object the system works with.
     * @param {Array} rows the rows needing to be processed.
     * @returns {Object} with field Rows where all data is stored.
     */
    ParseToObject(rows) {
        var result = new Object({ rows: [] });
        for (var i = 0; i < rows.length; i++) {
            var row = new Object();
            for (var cname in rows[i]) {
                row[cname] = rows[i][cname];
            }
            result['rows'].push(row);
        }
        return result;
    }
}
module.exports = MySqlconnector;
```
<a name="usageSetupMulti"/>

### Setting up the config for Cross-Domain

```javascript
const ParkDS = require('parkds');
const Config = ParkDS.Config.Instance;
// Let's add a cloud domain
let domain = new ParkDS.Config.Domain();
domain.Name = "Cloud1";
domain.Path = "cloud1.example.org";
domain.Port = 443;
domain.IsCloud = true;
domain.Account.User = "user";
domain.Account.Passworkd = "pass";

// Add the domain to the Config list
Config.Domains.Add(domain);


domain = new ParkDS.Config.Domain();
domain.Name = "Cloud1";
domain.Path = "cloud1.example.org";
domain.Port = 443;
domain.IsCloud = true;
domain.Account.User = "user";
domain.Account.Passworkd = "pass";

// Add the domain to the Config list
Config.Domains.Add(domain);
```
