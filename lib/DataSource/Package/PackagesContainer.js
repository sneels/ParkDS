"use strict";

const GenericPackage = require('./GenericPackage');
const Package = require('./Package');

class PackagesContainer extends GenericPackage {
    /**
     * 
     * @param {object} obj 
     */
    constructor (obj) {
        super();
   
        this.Packages = [];
        this.PackageStates = [];
        if (obj != null) {
            this.id = obj['id'];
            this.State = obj['State'];
            this.ReturnToSender = obj['ReturnToSender'];
            this.Sender = obj['Sender'];
            this.Recipient = obj['Recipient'];
            for (var i in obj['Packages']) {
                var pkg = new Package(obj['Packages'][i]);
                this.Add(pkg);
            }
        }
    }

    /**
     * Add a package to the container.
     * @param {Package} pkg 
     */
    Add(pkg) {
        pkg.ContainerId = this.id;
        this.PackageStates.push(pkg.Promise());
        this.Packages.push(pkg);
    }

    /**
     * Create a promise of data.
     */
    Promise() {
        let self = this;
        Promise.all(this.PackageStates).then(function () {
            self.Resolve();
        }).catch(function (error) {
            self.Reject(error);
        });
        return new Promise((resolve, reject) => {
            self._resolve = resolve;
            self._reject = reject;
        });
    }

    /**
     * Resolve the container.
     */
    Resolve() {
        this.State = 1;
        this.ReturnToSender = true;
        this.IsResolved = true;
        this._resolve(this);
    }

    /**
     * Reject the container and provide an error.
     * @param {Error} error 
     */
    Reject(error) {
        this._isResolved = true;
        if (this.State != -1) {
            for (var i in this.Packages) {
                if (!this.Packages[i].IsResolved) {
                    this.Packages[i].Reject(error);
                }
            }
        }
        this.State = -1;
        this.ReturnToSender = true;
        this._reject(this);
    }

    /**
     * Returns the class in a generic Object format
     * @returns {Object}
     * */
    ToObject() {
        var obj = new Object();
        obj['id'] = this.id;
        obj['State'] = this.State;
        obj['ReturnToSender'] = this.ReturnToSender;
        obj['Sender'] = this.Sender;
        obj['Recipient'] = this.Recipient;
        obj['Packages'] = [];
        for (var p of this.Packages) {
            obj['Packages'].push(p.ToObject());
        }
        return obj;
    }
}

module.exports = PackagesContainer;