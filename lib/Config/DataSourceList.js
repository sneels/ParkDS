"use strict";

const DataSource = require('./DataSource');

class DataSourceList {
    constructor() {
        this.List = [];
    }

    /**
     * 
     * Add a data source to the list.
     * @param {data source} data source 
     */
    Add(datasource) {
        this.List.push(datasource);
    }

    /**
     * Remove a data source from the list.
     * @param {data source} data source 
     */
    Remove (datasource) {
        var self = this;
        this.List.forEach(function(ds, index) {
            if (ds == datasource) {
                self.List.splice(index, 1);
            }
        });
    }

    GetDataSourceByName(name) {
        let datasource;
        for (var ds of this.List) {
            
            if (ds.Name == name) {
                datasource = ds;
            }
        }

        if (datasource == null) {
            throw new Error(`data source '${name}' does not exist`);
        }

        return datasource;
    }
}

module.exports = DataSourceList;