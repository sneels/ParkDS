"use strict";
const ParkDS = require('./lib/ParkDS');

// Config Classes
ParkDS.Config = {
    DataSource: require('./lib/Config/DataSource'),
    Domain: require('./lib/Config/Domain'),
    Account: require('./lib/Config/Account'),
    Instance: require('./lib/Config/Config').Instance
};

// Packages
ParkDS.Packages = {
    Package: require('./lib/DataSource/Package/Package'),
    PackagesContainer: require('./lib/DataSource/Package/PackagesContainer'),
    Queries: {
        Binding: require('./lib/DataSource/Package/Binding'),
        Query: require('./lib/DataSource/Package/Query')
    }
};

ParkDS.Manager = require('./lib/DataSource/Manager');
ParkDS.Queue = (require('./lib/DataSource/Queue')).Instance;

// Connectors
ParkDS.Connectors = {
    Instance: (require('./lib/DataSource/Connector/ConnectorList')).Instance,
    EConnector: require('./lib/DataSource/Connector/EConnector')
};

// Logger
ParkDS.Logger = {
    Log: require('./lib/Logger/Log'),
    LogType: require('./lib/Logger/LogType'),
    ILogObserver: require('./lib/Logger/ILogObserver'),
    Entity: require('./lib/Logger/Entity'),
    Instance: (require('./lib/Logger/Logger')).Instance
};

module.exports = ParkDS;