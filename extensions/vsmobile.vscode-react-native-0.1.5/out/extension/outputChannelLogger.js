// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var logHelper_1 = require("../common/log/logHelper");
var OutputChannelLogger = (function () {
    function OutputChannelLogger(outputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.show();
    }
    OutputChannelLogger.prototype.logInternalMessage = function (logLevel, message) {
        console.log(this.getFormattedInternalMessage(logLevel, message));
    };
    OutputChannelLogger.prototype.logMessage = function (message, formatMessage) {
        if (formatMessage === void 0) { formatMessage = true; }
        this.outputChannel.appendLine(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    };
    OutputChannelLogger.prototype.logError = function (errorMessage, error, logStack) {
        if (logStack === void 0) { logStack = true; }
        this.logMessage(errorMessage, /* formatMessage */ false);
    };
    OutputChannelLogger.prototype.logStreamData = function (data, stream) {
        this.outputChannel.append(data.toString());
    };
    OutputChannelLogger.prototype.setFocusOnLogChannel = function () {
        this.outputChannel.show();
    };
    OutputChannelLogger.prototype.getFormattedMessage = function (message) {
        return "######### " + message + " ##########";
    };
    OutputChannelLogger.prototype.getFormattedInternalMessage = function (logLevel, message) {
        return (logHelper_1.LogHelper.INTERNAL_TAG + " [" + logHelper_1.LogLevel[logLevel] + "] " + message);
    };
    return OutputChannelLogger;
}());
exports.OutputChannelLogger = OutputChannelLogger;

//# sourceMappingURL=outputChannelLogger.js.map
