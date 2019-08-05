'use strict';
let singletonInstance = null;
class Logger {
    constructor() {
        if (!singletonInstance) {
            singletonInstance = this;
            this._loggers = [];
        }

        return singletonInstance;
    }

    AddLogger(logger) {
        this._loggers.push(logger);
    }

    RemoveLogger(logger) {
        try {
            for (var i in this._loggers) {
                if (this._loggers[i] == logger) {
                    this._loggers.splice(i, 1);
                    break;
                }
            }
        } catch {
            // DO NOTHING
        }
    }

    Log(obj) {
        var i;
        try {
            for (i in this._loggers) {
                this._loggers.Update(obj);
            }
            var config = new (require('../Config/Config'));
            if (config.Settings.MainLogger) {
                if (config.Settings.Domain != config.Settings.MainLogger) {
                    // Send to Websocket
                }
            }
        } catch (e) {
            this.RemoveLogger(this._loggers[i]);
        }
    }
}