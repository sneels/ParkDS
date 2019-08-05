'use strict';
// Add required Libraries
const MySql = require('mysql');
const DeferredState = require('promised-deferred');

const IConnector = (new (require('../../..'))).DataSource.Connector.IConnector;

class MySqlConnector extends IConnector {

    /**
     * On creation, add the Data Source Destination required to make a connection and query for data
     * @param {Object} destination the DataSourceDestination object required.
     */
    constructor(destination) {
        super(destination);
        this.config = {
            host: this._path,
            user: this._account,
            password: this._pass,
            database: this._dbname
        };
        this._connection;
    }

    OpenConnection() {
        this._connection = MySql.createConnection(this.config);
        this._connection.connect();
    }

    /**
     * Sends a query to a MySql Database
     * @param {string} query the query string to retrieve data
     * @returns {Object} returns a JSON Object
     */
    Query(query, bindings) {
        //this._connection = MySql.createConnection(this.config);
        var def = new DeferredState();
        var self = this;

        //this.OpenConnection();
        var binds = [];
        for (var i in bindings) {
            binds.push(bindings[i].Value);
        }
        this._connection.query(query, binds, function (err, rows) {
            if (err) {
                def.Resolve(Error(err));
            } else {
                def.Resolve(self.ParseToObject(rows));
            }
        });
        return def.Promise();
        //this.CloseConnection();
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
            result.rows.push(row);
        }
        return result;
    }

    CloseConnection() {
        this._connection.end();
    }
}

module.exports = MySqlConnector;