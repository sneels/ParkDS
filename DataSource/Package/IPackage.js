'use strict';

class IPackage {
    constructor() {
        var DeferredState = require('promised-deferred');
        this.id = require('uuid/v1')(); // ToDo: Generate Unique ID
        this.DeferredState = new DeferredState();
        this.State = false;
        this.ReturnToSender = 0;
        this.IsResolved = false;
    }

    /**
     * @returns Creates a promise to return itself when completed.
     * @public
     * */
    GetPromise() {
        return this.DeferredState.Promise();
    }

    /**
     * Resolves it's state.
     * @public
     * */
    Resolve() {
        this.State = 1;
        this.DeferredState.Resolve();
    }

    /**
     * Reject the Promise (Provide a code and message to clarify the reason for rejection) 
     * @param {any} code the code
     * @param {any} message the message
     * @public
     */
    Reject(code, message) {
        this.State = -1;
        this.DeferredState.Reject(code, message)
    }
}

module.exports = IPackage;