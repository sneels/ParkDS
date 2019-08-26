"use strict";

let instance = null;
class logger {
    constructor() {
        if (!instance) {
            this.loggers = [];
            instance = this;
        }

        return instance;
    }

    /**
     * Send a log to the logger observers.
     * @param {Log} log 
     */
    Log (log) {
        for (var logger of this.loggers) {
            logger.Update(log);
        }
    }

    /**
     * Add an ILogObserver class as an Observer
     * @param {ILogObserver} logger
     */
    AddObserver(logger) {
        this.loggers.push(logger);
    }

    /**
     * Remove an ILogObserver class as an Observer
     * @param {ILogObserver} logger
     */
    RemoveObserver(logger) {
        try {
            for (var i in this.loggers) {
                if (this.loggers[i] == logger) {
                    this.loggers.splice(parseInt(i), 1);
                    break;
                }
            }
        }
        catch (_a) {
            // DO NOTHING
        }
    }
}

const Logger = {
    Instance: new logger()
};

module.exports = Logger;