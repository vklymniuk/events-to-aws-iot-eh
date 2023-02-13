/* eslint no-console: 0 */ // --> OFF
const nconf = require('nconf');
const winston = require('winston');
const options = {};
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const ENV_USER = 'USER';
const ENV_LOG_LEVEL = 'LOG_LEVEL';
const ENV_LOG_FILE_PATH = 'LOG_FILE_PATH';
const ENV = 'ENV';
const ENV_LOG_DESTINATION = 'LOG_DESTINATION';
const ENV_MACHINE_NAME = 'MACHINE_NAME';
const DEV_SUFFIX = '-dev';
const ENV_APP_VERSION = 'APP_VER';

const CONFIG_FOLDER = './config';

loadConfig();

function loadConfig() {
    loadEnv();
    setUser();
    loadConfigFiles();
    setLoggerWithProperties();

    if (isDev()) {
        setDevProperties();
    }

    setAppVerEnvironmentVariable();
    global.DEFAULTS = nconf.get();
}

function setAppVerEnvironmentVariable() {
    process.env[ENV_APP_VERSION] = require('./package.json').version;
}

function isDev() {
    let environment = nconf.get(ENV);
    return environment && environment.toLowerCase() == 'dev';
}

function setDevProperties() {
    global.dev = true;
}

function loadEnv() {
    /*
         environment variables are expected to be in the format of key_value to correctly be nested and replace in the configuration object
         example:
         in order to override
         {
             connection: {
                 host: "hello"
             }
         }
         env name must be connection_host
     */
    nconf.env({
        separator: '_',
    });
}

function setUser() {
    var user = nconf.get(ENV_USER);
    if (user) {
        options.user = user;
    }
}

function loadConfigFiles() {
    let config = getCascadedConfig();
    nconf.defaults(config);
}

function getCascadedConfig() {
    let prod = loadJsonFileIfExists(`${CONFIG_FOLDER}/config.json`);
    let merged = prod;
    if (isTest()) {
        let test = loadJsonFileIfExists(`${CONFIG_FOLDER}/config.test.json`);
        merged = _.merge(merged, test);
    }
    if (isDev()) {
        let dev = loadJsonFileIfExists(`${CONFIG_FOLDER}/config.dev.json`);
        merged = _.merge(merged, dev);
    }
    return merged;
}

function loadJsonFileIfExists(filePath) {
    try {
        return require(filePath);
    }
    catch(e) {
        if (_.startsWith(e.message, 'Cannot find module')) {
            return {};
        }
        throw e;
    }
}

function setLoggerWithProperties() {
    let logDestination = nconf.get(ENV_LOG_DESTINATION) || 'console';
    let logFilePath = nconf.get(ENV_LOG_FILE_PATH);
    let logLevel = nconf.get(ENV_LOG_LEVEL) || 'VERBOSE';
    let logger = require('./config/winston.config.js')(winston, logLevel, [logDestination], logFilePath);
    global.appLogger = logger;
}


function isTest() {
    return typeof global.it === 'function';
}