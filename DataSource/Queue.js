'use strict';
// Add required ParkDS Classes
const PackagesContainer = require('./Package/PackagesContainer');

let singletonInstance = null;

class Queue {
    constructor() {
        if (!singletonInstance) {
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
        }
        this._queue = [];

        return singletonInstance;
    }

    /**
     * Add a Data Source Packages Container to the Queue and promise to return it when resolved.
     * @param {PackagesContainer} pkgcontainer the Data Source Packages Container to be added to the Queue.
     * @returns {Promise<PackagesContainer>}
     * @public
     */
    Add(pkgcontainer) {
        this._queue.push(pkgcontainer)
        var dspcid = pkgcontainer.id;
        var q = this._queue;
        var qid = this.getID(dspcid);

        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mQueue\x1b[0m]: Container Added to Queue (Total: ${this._queue.length})`);

        // Resolve Queue with error on wait time-out
        setTimeout(function () {
            if (typeof q[qid] != 'undefined' && typeof q[qid].id !== 'undefined' && q[qid].id == dspcid) {
                q[qid].isResolved = true
                q[qid].Result = "Failed to grab the content, try again or contact IT Support";
                for (var i in q[qid].Packages) {
                    q[qid].Packages[i].Resolve();
                }
            }
        }, 15000);

        var p = pkgcontainer.GetPromise();

        // When the package is resolved and delivered, remove it from the queue
        p.then(function (value) {
            for (var i in q) {
                if (q[i].id == value.id) {
                    q.splice(i, 1);
                }
            }
        });

        return pkgcontainer.GetPromise();
    }

    /**
     * Get the Queue id
     * @param {String} pkgid
     * @returns {int}
     * @private
     */
    getID(pkgid) {
        for (var i in this._queue) {
            if (this._queue[i].id == pkgid) {
                return i;
            }
        }
    }

    /**
     * Resolves a package in the queue
     * @param {int} pkgcontainerID the Packages Container ID
     * @param {Package} pkg the Package
     * @public
     */
    ResolvePackage(pkgcontainerID, pkg) {
        for (var key in this._queue) {
            if (this._queue[key].id == pkgcontainerID) {
                for (var key2 in this._queue[key].Packages) {
                    if (this._queue[key].Packages[key2].id == pkg.id) {
                        this._queue[key].Packages[key2].Result = pkg.Result;
                        this._queue[key].Packages[key2].State = pkg.State;
                        this._queue[key].Packages[key2].ReturnToSender = pkg.ReturnToSender;
                        this._queue[key].Packages[key2].IsResolved = true;
                        this._queue[key].Packages[key2].Resolve();
                        break;
                    }
                }
                break;
            }
        }

        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mQueue\x1b[0m]: Package Resolved (Total Containers Left: ${this._queue.length})`);
    }

    /**
     * Resolves multiple packages from a container
     * @param {int} pkgcontainerID the Packages Container ID
     * @param {Array} pkg list of Packages
     * @public
     */
    ResolvePackages(pkgcontainerID, pkg) {
            for (var key in this._queue) {
                if (this._queue[key].id == pkgcontainerID) {
                    for (var key2 in this._queue[key].Packages) {
                        for (var i in pkg) {
                            if (this._queue[key].Packages[key2].id == pkg[i].id) {
                                this._queue[key].Packages[key2].Result = pkg[i].Result;
                                this._queue[key].Packages[key2].State = pkg[i].State;
                                this._queue[key].Packages[key2].ReturnToSender = pkg[i].ReturnToSender;
                                this._queue[key].Packages[key2].Resolve();
                                break;
                            }
                        }
                    }
                    break;
                }
            }

        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mQueue\x1b[0m]: Package Resolved (Total Containers Left: ${this._queue.length})`);
    }
}

module.exports = Queue;