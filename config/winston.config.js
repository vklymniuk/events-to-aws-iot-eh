module.exports = function (winston, level, destinations, logFilePath) {
    var logFilePath = (logFilePath || 'logs/app.log');
    var destinations = (destinations || ['file','console']);
    var level = (level || 'verbose').toLowerCase();
    console.log(`Setting a winston logger with ${level} log level`);
    console.log(`Setting a winston logger to ${destinations}`);
    var winstonTransports = [];

    if (destinations.indexOf('console') > -1) {
        winstonTransports.push(
            new winston.transports.Console(
            {
                colorize: true,
                level: level,
                prettyPrint: true,
                json:false,
                silent: false,
                timestamp: false,
            }
        ));
    }

    if (destinations.indexOf('file') > -1) {
        console.log(`Logs will be stored to ${logFilePath}`);
        winstonTransports.push(
            new winston.transports.File(
            {
                "timestamp": true,
                "json": false,
                "filename": logFilePath,
                "maxfiles": 5,
                "maxsize": 10485760,
                "level": level,
                "json": true
             }
        ));
    }

    var logger = new winston.createLogger({
        transports: winstonTransports
    });

    return logger;
};
