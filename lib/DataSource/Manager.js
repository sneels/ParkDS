"use strict";

const PackagesContainer = require('./Package/PackagesContainer');
const Config = require('../Config/Config');
const Log = require('../Logger/Log');
const Entity = require('../Logger/Entity');
const LogType = require('../Logger/LogType');
const Router = require('./Router');

class Manager {
    constructor () {
        this._pkgcontainer = new PackagesContainer();
        this._config = Config.Instance;
        this._entity = new Entity();

        this._pkgcontainer.Sender = this._config.Settings.Name;

        this._entity.Name = "ParkDS Manager";
        this._entity.Domain = this._config.Settings.Name;
    }

    /**
     * Adds a Package to the Packages Container (Requires Manager.Execute() to be processed).
     * @param {Package} pkg
     */
    Add(pkg) {
        this._pkgcontainer.Add(pkg);
        Log.Register(this._entity, LogType.TRAFFIC, `Package added to Container: ${this._pkgcontainer}`);
        Log.Register(this._entity, LogType.TRAFFIC, `Package added to Container: ${this._pkgcontainer.Packages}`);
        // LOGGING TRAFFIC:
        Log.Register(this._entity, LogType.TRAFFIC, `Package added to Container, Total Packages: ${this._pkgcontainer.Packages.length}`);
    }

    /**
     * Adds a package to a container and execute immediatly.
     * @param {Package} pkg
     * @returns {Promise<Package>}
     */
    AddAsync(pkg) {
        const pc = new PackagesContainer();
        pc.Sender = this._config.Settings.Name;
        pc.Add(pkg);
        Log.Register(this._entity, LogType.TRAFFIC, `Package added to Container: ${pc}`);
        Log.Register(this._entity, LogType.TRAFFIC, `Package added to Container: ${pc.Packages}`);
        // LOGGING TRAFFIC:
        Log.Register(this._entity, LogType.TRAFFIC, `Package Routed. Total Packages: ${pc.Packages.length}`);
        var router = new Router();
        return router.Route(pc, 0);
        // todo: add routing
    }

    /**
     * Execute the Packages Container.
     * @returns {Promise<Package>}
     */
    Execute() {
        var router = new Router();
        // LOGGING: TRAFFIC
        Log.Register(this._entity, LogType.TRAFFIC, `Container Routed. Total Packages: ${this._pkgcontainer.Packages.length}`);
        return router.Route(this._pkgcontainer, 0);
    }
}

module.exports = Manager;