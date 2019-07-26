'use strict';
class IConnector {
    /**
     * On creation, add the Data Source Destination required to make a connection and query for data
     * @param {Object} destination the DataSourceDestination object required.
     * @public
     */
    constructor(destination) {        
        this._connectionstring = "";
        this._account = destination.Account;
        this._pass = destination.Password;
        this._path = destination.Path;
        this._dbname = destination.DbName;
        this._options = destination.Options;
    }

    /**
     * Sends a query to the Data Source
     * @param {string} query the query string to retrieve data
     * @returns {Object} returns a JSON Object
     * @public
     */
    Query(query) {
        // Todo connect, query, convert to object, return object
        return GenericObject
    }

    /**
     * Opens the connection to the Data Source
     * @public
     * */
    OpenConnection() {
        // ToDo: write connection
    }

    /**
     * Closes the connection to the Data Source
     * @public
     * */
    CloseConnection() {

    }
}


module.exports = IConnector;