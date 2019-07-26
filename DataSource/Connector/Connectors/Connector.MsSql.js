'use strict';

const MsSql = require('mssql');

const DeferredState = require('promised-deferred');
const IConnector = (new (require('./ParkDS'))).DataSource.Connector.IConnector;

class MsSqlConnector extends IConnector {
    /**
     * On creation, add the Data Source Destination required to make a connection and query for data
     * @param {DataSourceDestination} dsd the DataSourceDestination object required.
     */
    constructor(destination) {
        super(destination);
        this.config = {
            user: this._account,
            password: this._pass,
            server: this._path,
            database: this._dbname
        };
        this.connection;
        this.pool;
    }

    OpenConnection() {
        this.connection = MsSql.connect(this.config);
    }

    /**
     * Sends a query to the MsSql Database
     * @param {string} query the query string to retrieve data
     * @returns {Object} returns a JSON Object
     */
    Query(query, bindings) {
        var def = new DeferredState();
        const pool = this.connection
            const ps = new MsSql.PreparedStatement();
            var obj = new Object();
            for (var i in bindings) {
                var type;
                switch(bindings[i].Type) {
                    case "nvarchar":
                        type = MsSql.NVarChar(50);
                        break;
                }
                ps.input(bindings[i].Name, type);
                obj[bindings[i].Name] = bindings[i].Value;
            }

            ps.prepare(query, err => {
                if (err === null) {
                    ps.execute(obj, (err, result) => {
                        if (err === null) {
                            var res = new Object({ rows: result.recordset });
                            ps.unprepare(err => {
                                if (err === null) {
                                    def.Resolve(res);
                                }
                                else {
                                    console.log(err);
                                    def.Resolve("Failed: " + err)
                                }
                                //pool.close();
                            });
                        } else {
                            def.Resolve("Failed: " + err)
                            //pool.close();
                        }
                    });
                } else {
                    def.Resolve("Failed: " + err)
                    //pool.close();
                }
            });
        return def.Promise();
    }

    CloseConnection() {
        this.connection.close();
    }
}

module.exports = MsSqlConnector;