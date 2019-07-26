'use strict';

var IPackage = require('./IPackage');
var Package = require('./Package');

class PackagesContainer extends IPackage {
    constructor() {
        super();
        this.Sender = "";
        this.Recipient = "";
        this.Packages = [];
        this.PackageStates = [];
    }

    /**
     * Adds a Data Source Package to the list of Packages and track their Deferred State.
     * @param {Package} pkg Data Source Package to be added and tracked.
     * @public
     */
    Add(pkg) {
        pkg.ContainerId = this.id;
        this.PackageStates.push(pkg.GetPromise());
        this.Packages.push(pkg);
    }

    /**
     * @returns a promise to send itself back when all packages are resolved.
     * @public
     * */
    GetPromise() {
        var self = this;
        Promise.all(this.PackageStates).then(function () {
            self.Resolve();
        });

        return this.DeferredState.Promise();
    }

    /**
     * Resolve the package container and return a value (only call this in case of a failure)
     * @public
     */
    Resolve() {
        this.State = 1;
        this.ReturnToSender = true;
        this.DeferredState.Resolve(this);
    }

    /**
     * Returns the class in a generic Object format
     * @returns {Object}
     * @public
     * */
    ToObject() {
        var obj = new Object();
        obj.id = this.id;
        obj.State = this.State;
        obj.ReturnToSender = this.ReturnToSender;
        obj.Code = this.Code;
        obj.Sender = this.Sender;
        obj.Recipient = this.Recipient;
        obj.Packages = [];

        for (var i in this.Packages) {
            obj.Packages.push(this.Packages[i].ToObject());
        }

        return obj;
    }
}

module.exports = PackagesContainer