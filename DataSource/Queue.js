'use strict';
// Add required ParkDS Classes
const PackagesContainer = require('./Package/PackagesContainer');

let singletonInstance = null;

class Queue {
    constructor() {
        if (!singletonInstance) {
            // If null, set singletonInstance to this Class 
            singletonInstance = this;
            this.Loggers = [];
            this._queue = [];
        }

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

        // Log
        this.Log(`Container Added to Queue(Total: ${this._queue.length})`);

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

        return p;
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

        this.Log(`Package Resolved (Total Containers Left: ${this._queue.length})`);
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

        this.Log(`Package Resolved (Total Containers Left: ${this._queue.length})`);
    }

    Log(message, isError) {
        var obj;
        if (isError) {
            obj = new Object({
                Name: "\x1b[33mParkDS: \x1b[1mQueue\x1b[0m",
                Time: new Date(),
                Error: message
            });
        } else {
            obj = new Object({
                Name: "\x1b[33mParkDS: \x1b[1mQueue\x1b[0m",
                Time: new Date(),
                Message: message
            });
        }
        for (var i in this.Loggers) {
            this.Loggers[i].Log(obj);
        }
    }

    /**
     * Add a logging tool to the Queue (REQUIRES method Log(obj))
     * @param {Object} observer The logging observer
     */
    AddLogObserver(observer) {
        this.Loggers.push(observer);
    }
}

module.exports = Queue;