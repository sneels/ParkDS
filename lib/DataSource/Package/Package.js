"use strict";

const Binding = require('./Binding');
const ErrorToJson = require('error-to-json');
const GenericPackage = require('./GenericPackage');
const Query = require('./Query');
const Result = require('./Result');

class Package extends GenericPackage {
    /**
     * Create a new package.
     * @param {object} obj 
     */
    constructor(obj) {
        super();
        this.Query = new Query();
        this.Result = new Result();
        
        this.ContainerId = "";
            if (obj) {
                this.id = obj['id'];
                this.State = obj['State'];
                this.IsResolved = obj['IsResolved'];
                this.ReturnToSender = obj['ReturnToSender'];
                this.Name = obj['Name'];
                this.DataSource = obj['DataSource'];
                this.ContainerId = obj['ContainerId'];
                this.Query.String = obj['Query']['String'];
                for (var b of obj['Query']['Bindings']) {
                    let binding = new Binding(b['Name'], b['Value'], b['Type']);
                    this.Query.Bindings.push(binding);
                }
                var result = new Result();
                result.Data = obj['Result']['Data'];
                if (obj['Result']['Error'] != null) {
                    var json = JSON.stringify(obj["Result"]["Error"]);
                    result.Error = ErrorToJSON.parse(json);
                }
                this.Result = result;
            }
    }

    Promise() {
        let self = this;
        return new Promise((resolve, reject) => {
            self._resolve = resolve;
            self._reject = reject;
        });
    }

    Resolve() {
        this.State = 1;
        this._resolve(this);
    }

    Reject(error) {
        this.State = -1;
        this._result.Error = error;
        this._reject(this);
    }

    ToObject() {
        let obj = new Object();
        obj['id'] = this.id;
        obj['State'] = this.State;
        obj['IsResolved'] = this.IsResolved;
        obj['ReturnToSender'] = this.ReturnToSender;
        obj['Name'] = this.Name;
        obj['DataSource'] = this.DataSource;
        obj['ContainerId'] = this.ContainerId;
        obj['Query'] = new Object();
        obj['Query']["String"] = this.Query.String;
        obj['Query']["Bindings"] = [];
        for (var i in this.Query.Bindings) {
            let binding = {
                Name: this.Query.Bindings[i].Name,
                Value: this.Query.Bindings[i].Value,
                Type: this.Query.Bindings[i].Type
            };
            obj['Query']["Bindings"].push(binding);
        }
        var result = new Object();
        result['Error'] = null;
        result['Data'] = this.Result.Data;
        if (this.Result.Error != null) {
            result['Error'] = JSON.parse(ErrorToJSON(this.Result.Error));
        }
        obj['Result'] = result;
        return obj;
    }
}

module.exports = Package;