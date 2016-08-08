"use strict";
var fs = require('fs');
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(exports.LogLevel || (exports.LogLevel = {}));
var LogLevel = exports.LogLevel;
var Log = (function () {
    function Log(name) {
        this.name = name;
        this.configure();
    }
    Object.defineProperty(Log, "config", {
        set: function (newConfig) {
            if (Log.fileDescriptor !== undefined) {
                fs.closeSync(Log.fileDescriptor);
                Log.fileDescriptor = undefined;
            }
            Log._config = newConfig;
            if (Log._config.fileName) {
                try {
                    Log.fileDescriptor = fs.openSync(Log._config.fileName, 'w');
                }
                catch (e) { }
            }
            Log.logs.forEach(function (log) { return log.configure(); });
        },
        enumerable: true,
        configurable: true
    });
    Log.create = function (name) {
        return new Log(name);
    };
    Log.prototype.configure = function () {
        this.fileLevel = undefined;
        if (Log._config.fileName && Log._config.fileLevel) {
            this.fileLevel = Log._config.fileLevel[this.name];
            if (this.fileLevel === undefined) {
                this.fileLevel = Log._config.fileLevel['default'];
            }
            if (this.fileLevel === undefined) {
                this.fileLevel = LogLevel.Info;
            }
        }
        if (Log._config.consoleLevel) {
            this.consoleLevel = Log._config.consoleLevel[this.name];
            if (this.consoleLevel === undefined) {
                this.consoleLevel = Log._config.consoleLevel['default'];
            }
        }
        this.minLevel = this.fileLevel;
        if (this.consoleLevel && !(this.consoleLevel >= this.minLevel)) {
            this.minLevel = this.consoleLevel;
        }
    };
    Log.prototype.log = function (msg, level, displayLevel) {
        if (level >= this.minLevel) {
            var elapsedTime = (Date.now() - Log.startTime) / 1000;
            var elapsedTimeString = elapsedTime.toFixed(3);
            while (elapsedTimeString.length < 7) {
                elapsedTimeString = '0' + elapsedTimeString;
            }
            var logMsg = displayLevel + '|' + elapsedTimeString + '|' + this.name + ': ' + msg;
            if ((Log.fileDescriptor !== undefined) && (level >= this.fileLevel)) {
                fs.write(Log.fileDescriptor, logMsg + '\n');
            }
            if (level >= this.consoleLevel) {
                Log.consoleLog(logMsg);
            }
        }
    };
    Log.prototype.debug = function (msg) {
        this.log(msg, LogLevel.Debug, 'DEBUG');
    };
    Log.prototype.info = function (msg) {
        this.log(msg, LogLevel.Info, 'INFO ');
    };
    Log.prototype.warn = function (msg) {
        this.log(msg, LogLevel.Warn, 'WARN ');
    };
    Log.prototype.error = function (msg) {
        this.log(msg, LogLevel.Error, 'ERROR');
    };
    Log.startTime = Date.now();
    Log.logs = new Map();
    Log.consoleLog = console.log;
    return Log;
}());
exports.Log = Log;
Log.config = {
    fileName: '/tmp/vscode-firefox-debug.log',
    fileLevel: {
        'default': LogLevel.Debug
    },
    consoleLevel: {
        'default': LogLevel.Info,
    }
};
//# sourceMappingURL=log.js.map