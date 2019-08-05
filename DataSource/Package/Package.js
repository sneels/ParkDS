'use strict';
const IPackage = require('./IPackage');
class Package extends IPackage {
    constructor(obj) {
        super();
        this.Name = "";
        this.Query = new Object({ String: "", Bindings: [] });
        this.Database = "";
        this.ContainerId = "";
        this.Result = new Object();
        var p = new IPackage();
        if (typeof (obj) == "object") {
            this.id = obj.id;
            this.State = obj.State;
            this.IsResolved = obj.IsResolved;
            this.ReturnToSender = obj.ReturnToSender;
            this.Name = obj.Name;
            this.Database = obj.Database;
            this.ContainerId = obj.ContainerId;
            this.Query = obj.Query;
            this.Result = obj.Result;  
        }
    }

    /**
     * Resolves it's state and returns itself through the promise.
     * @public
     * */
    Resolve() {
        this.State = 1;
        this.DeferredState.Resolve(this);
    }

    /**
     * Reject the Package, provide an Error to clarify what went wrong.
     * @param {Error} err the Error
     * @public
     */
    Reject(err) {
        this.State = -1;
        this.Result = err;
        this.DeferredState.Reject(this);
    }

    /**
     * Conver the Package to a generic Object
     * @returns {Object}
     * @public
     * */
    ToObject() {
        var obj = new Object();
        obj.id = this.id;
        obj.State = this.State;
        obj.IsResolved = this.IsResolved;
        obj.ReturnToSender = this.ReturnToSender;
        obj.Name = this.Name;
        obj.Database = this.Database;
        obj.ContainerId = this.ContainerId;
        obj.Query = this.Query;
        obj.Result = this.Result;

        return obj;
    }
}

module.exports = Package;