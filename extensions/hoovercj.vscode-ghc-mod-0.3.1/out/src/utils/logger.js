'use strict';
const vscode_1 = require('vscode');
var Logger;
(function (Logger) {
    (function (LogLevel) {
        LogLevel[LogLevel["none"] = 0] = "none";
        LogLevel[LogLevel["error"] = 1] = "error";
        LogLevel[LogLevel["warn"] = 2] = "warn";
        LogLevel[LogLevel["info"] = 3] = "info";
        LogLevel[LogLevel["log"] = 4] = "log";
    })(Logger.LogLevel || (Logger.LogLevel = {}));
    var LogLevel = Logger.LogLevel;
    let logLevel = LogLevel.none;
    Logger.setLogLevel = function (level) {
        logLevel = level;
    };
    // log methods include an optional level argument to allow
    // overriding the logger logLevel for a specific call.
    Logger.log = function (message, level) {
        if (logLevel >= LogLevel.log || level >= LogLevel.log) {
            console.log(message);
        }
    };
    Logger.info = function (message, level) {
        if (logLevel >= LogLevel.info || level >= LogLevel.info) {
            console.info(message);
        }
    };
    Logger.warn = function (message, level) {
        if (logLevel >= LogLevel.warn || level >= LogLevel.warn) {
            console.warn(message);
        }
    };
    Logger.error = function (message, level) {
        if (logLevel >= LogLevel.error || level >= LogLevel.error) {
            console.error(message);
            vscode_1.window.showErrorMessage(message);
        }
    };
})(Logger = exports.Logger || (exports.Logger = {}));
//# sourceMappingURL=logger.js.map