"use strict";

const Config = require('../Config/Config');
const Entity = require('../Logger/Entity');
const Log = require('../Logger/Log');
const LogType = require('../Logger/LogType');
const Package = require('./Package/Package');
const PackagesContainer = require('./Package/PackagesContainer');

let instance = null;

class queue {
    constructor() {
        if (!instance) {
            this._queue = [];
            this._entity = new Entity();
            this._config = Config.Instance;
            this._entity.Name = "ParkDS Queue";
            this._entity.Domain = this._config.Settings.Name;

            instance = this;
        }

        return instance;
    }

    /**
     * Add a packages container to the queue.
     * @param {PackagesContainer} pkgcontainer
     * @returns {Promise<PackagesContainer>}
     */
    Add(pkgcontainer) {
        this._queue.push(pkgcontainer);
        Log.Register(this._entity, LogType.TRAFFIC, `Container Added (Queue Size: ${this._queue.length})`);
        let p = pkgcontainer.Promise();
        let self = this;
        //let q = this._queue;
        setTimeout(function () {
            self.remove(pkgcontainer);
        }, 15000);
        p.then((this.remove).bind(this)).catch((this.remove).bind(this));
        /*p.then(function (value:PackagesContainer) {
            for (var i in q) {
                if (q[i].id == value.id) {
                    q.splice(i, 1);
                }
            }
        });*/
        return p;
    }
    /**
     * resolve a package in the queue.
     * @param {Package} pkg 
     */
    ResolvePackage(pkg) {
        let qid = this.getId(pkg.ContainerId);
        if (typeof (this._queue[qid]) != "undefined" && typeof this._queue[qid].id !== 'undefined' && this._queue[qid].id == pkg.ContainerId) {
            for (var i in this._queue[qid].Packages) {
                if (this._queue[qid].Packages[i].id == pkg.id) {
                    this._queue[qid].Packages[i].Result = pkg.Result;
                    this._queue[qid].Packages[i].State = pkg.State;
                    this._queue[qid].Packages[i].ReturnToSender = pkg.ReturnToSender;
                    this._queue[qid].Packages[i].IsResolved = true;
                    if (pkg.State == 1) {
                        this._queue[qid].Packages[i].Resolve();
                    }
                    else {
                        this._queue[qid].Packages[i].Reject(pkg.Result.Error);
                    }
                }
            }
        }
    }

    /**
     * Resolve multiple packages.
     * @param {PackagesContainer} pkgcontainer 
     */
    ResolvePackages(pkgcontainer) {
        let qid = this.getId(pkgcontainer.id);
        if (typeof (this._queue[qid]) != "undefined" && typeof this._queue[qid].id !== 'undefined' && this._queue[qid].id == pkgcontainer.id) {
            for (var i in this._queue[qid].Packages) {
                for (var j in pkgcontainer.Packages) {
                    if (this._queue[qid].Packages[i].id == pkgcontainer.Packages[j].id) {
                        this._queue[qid].Packages[i].Result = pkgcontainer.Packages[j].Result;
                        this._queue[qid].Packages[i].State = pkgcontainer.Packages[j].State;
                        this._queue[qid].Packages[i].ReturnToSender = pkgcontainer.Packages[j].ReturnToSender;
                        if (pkgcontainer.Packages[j].State == 1) {
                            this._queue[qid].Packages[i].Resolve();
                        }
                        else {
                            if (pkgcontainer.Packages[j].State == -1) {
                                this._queue[qid].Packages[i].Reject(pkgcontainer.Packages[j].Result.Error);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * PRIVATE
     */
    getId(pkgcontainerId) {
        for (var i in this._queue) {
            if (this._queue[i].id == pkgcontainerId) {
                return parseInt(i);
            }
        }
    }

    /**
     * PRIVATE
     */
    remove(pkgcontainer) {
        for (var i in this._queue) {
            if (this._queue[i].id == pkgcontainer.id) {
                this._queue.splice(parseInt(i), 1);
            }
        }
    }
}

const Queue = {
    Instance: new queue()
};

module.exports = Queue;