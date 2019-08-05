'use strict';
const PackagesContainer = require('./Package/PackagesContainer');
const Router = require('./Router');
class Manager {
    constructor() {
        var Config = new (require('../Config/Config'));
        this.PackagesContainer = new PackagesContainer();
        this.PackagesContainer.Sender = Config.Settings.Name;
    }

    /**
     * Adds a Package to the PackagesContainer (Requires an Execute())
     * @param {Package} pkg the Package
     * @public
     */
    Add(pkg) {
        this.PackagesContainer.Add(pkg);
        var now = new Date();

        // DEBUG LOGGING
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mManager\x1b[0m]: Package added to container (length: ${this.PackagesContainer.Packages.length})`);
    }

    /**
     * Adds a Package to the PackagesContainer and executes it async
     * @param {Package} pkg the Package
     * @returns {Promise<PackagesContainer>} TEST
     * @public
     */
    AddAsync(pkg) {
        var pc = new PackagesContainer();
        var Config = new (require('../Config/Config'));
        pc.Sender = Config.Settings.Name;
        pc.Add(pkg);

        // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mManager\x1b[0m]: Package Routed: (length: ${pc.Packages.length})`);

        var router = new Router()
        return router.Route(pc, 0);
    }

    /**
     * Execute the PackagesContainer and route it to the different Data Sources
     * @returns {Promise<PackagesContainer>}
     * @public
     * */
    Execute() {
        var router = new Router();

         // DEBUG LOGGING
        var now = new Date();
        var time = ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2) + ":" + ('0' + now.getSeconds()).slice(-2) + "." + ('00' + now.getUTCMilliseconds()).slice(-3);
        console.log(`${time} [\x1b[33mParkDS: \x1b[1mManager\x1b[0m]: Container sent to Router:`);

        return router.Route(this.PackagesContainer, 0);

    }
}

module.exports = Manager;