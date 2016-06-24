// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
/**
 * Formatter for the Output channel.
 */
var logHelper_1 = require("./logHelper");
var ConsoleLogger = (function () {
    function ConsoleLogger() {
    }
    ConsoleLogger.prototype.logMessage = function (message, formatMessage) {
        if (formatMessage === void 0) { formatMessage = true; }
        console.log(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    };
    ConsoleLogger.prototype.logError = function (errorMessage, error, logStack) {
        if (logStack === void 0) { logStack = true; }
        console.error(this.getFormattedMessage(errorMessage));
        // Print the error stack if necessary
        if (logStack && error && error.stack) {
            console.error("Stack: " + error.stack);
        }
    };
    ConsoleLogger.prototype.logStreamData = function (data, stream) {
        stream.write(data.toString());
    };
    ConsoleLogger.prototype.logInternalMessage = function (logLevel, message) {
        this.logMessage(this.getFormattedInternalMessage(logLevel, message), /* formatMessage */ false);
    };
    ConsoleLogger.prototype.setFocusOnLogChannel = function () {
        // Do nothing - console takes focus automatically upon logging
        return;
    };
    ConsoleLogger.prototype.getFormattedMessage = function (message) {
        return logHelper_1.LogHelper.MESSAGE_TAG + " " + message + "\n";
    };
    ConsoleLogger.prototype.getFormattedInternalMessage = function (logLevel, message) {
        return (logHelper_1.LogHelper.INTERNAL_TAG + " [" + logHelper_1.LogLevel[logLevel] + "] " + message + "\n");
    };
    return ConsoleLogger;
}());
exports.ConsoleLogger = ConsoleLogger;
var StreamLogger = (function () {
    function StreamLogger(stream) {
        this.stream = stream;
    }
    StreamLogger.prototype.logMessage = function (message, formatMessage) {
        if (formatMessage === void 0) { formatMessage = true; }
        this.stream.write(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    };
    StreamLogger.prototype.logError = function (errorMessage, error, logStack) {
        if (logStack === void 0) { logStack = true; }
        this.logMessage(errorMessage);
        if (logStack && error && error.stack) {
            this.logMessage("Stack: " + error.stack, /* formatMessage */ false);
        }
    };
    StreamLogger.prototype.logStreamData = function (data, stream) {
        stream.write(data.toString());
    };
    StreamLogger.prototype.logInternalMessage = function (logLevel, message) {
        this.logMessage(this.getFormattedInternalMessage(logLevel, message), /* formatMessage */ false);
    };
    StreamLogger.prototype.getFormattedMessage = function (message) {
        return logHelper_1.LogHelper.MESSAGE_TAG + " " + message + "\n";
    };
    StreamLogger.prototype.getFormattedInternalMessage = function (logLevel, message) {
        return (logHelper_1.LogHelper.INTERNAL_TAG + " [" + logLevel + "] " + message + "\n");
    };
    StreamLogger.prototype.setFocusOnLogChannel = function () {
        // Do nothing
        return;
    };
    return StreamLogger;
}());
exports.StreamLogger = StreamLogger;

//# sourceMappingURL=loggers.js.map
