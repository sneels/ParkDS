"use strict";
const Logger = require('./Logger');
const Entity = require('./Entity');
const LogType = require('./LogType').LogType;;
class Log {
    /**
     * Create a new Log Object.
     * @param {Entity} entity 
     * @param {string} type 
     * @param {any} content 
     */
    constructor(entity, type, content) {
        this.Type = type;
        this.Entity = entity;
        this.Content = content;
        this.TimeStamp = new Date();
    }

    /**
     * Register a new log.
     * @param {Entity} entity 
     * @param {string} type 
     * @param {any} content 
     */
    static Register(entity, type, content) {
        var log = new Log(entity, type, content);
        log.sendToLogger(log);
    }

    /**
     * Send a log object to the logger.
     * @param {Log} log 
     */
    sendToLogger(log) {
        var logger = Logger.Instance;
        logger.Log(log);
    }
}

module.exports = Log;