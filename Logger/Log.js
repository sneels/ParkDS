'use strict';

class Log {
    constructor() {
        this.Timestamp = 0;
        this.Entity = new Object({
            Domain: "",
            Source: ""
        });
        this.Type = "";
        this.Content = null;
    }

    static Type() {
        const Enum = require('node-enumjs');
        const types = Enum.define("types", ["ERROR", "TRAFFIC", "STATUS"]);

        return types;
    }
}