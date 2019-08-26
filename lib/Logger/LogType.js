"use strict";
class LogType {
    constructor() {
    }
    
    static get TRAFFIC() {
        return "TRAFFIC";
    }

    static get ERROR() {
        return "ERROR";
    }

    static get STATUS() {
        return "STATUS";
    }
}
module.exports = LogType;