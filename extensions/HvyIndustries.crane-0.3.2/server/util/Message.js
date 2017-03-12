/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root
 * for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of
 * JCKD (UK) Ltd
 */
"use strict";
/**
 * List of message types
 */
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Info"] = 1] = "Info";
    MessageType[MessageType["Success"] = 2] = "Success";
    MessageType[MessageType["Trace"] = 3] = "Trace";
    MessageType[MessageType["Warning"] = 4] = "Warning";
    MessageType[MessageType["Error"] = 5] = "Error";
    MessageType[MessageType["Status"] = 6] = "Status";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
;
/**
 * The debug/messaging class
 */
class Message {
    /**
     * Initialize with the specified connection
     */
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * Sends a message to the client
     */
    sendMessage(type, message) {
        // sends the message to the error console
        message = '[crane server] : ' + message;
        console.log(message);
        if (type === MessageType.Error) {
            this.connection.console.error(message);
        }
        else if (type === MessageType.Info) {
            this.connection.console.info(message);
        }
        else if (type === MessageType.Warning) {
            this.connection.console.warn(message);
        }
        else {
            this.connection.console.log(message);
        }
        return this;
    }
    /**
     * Shows an information message
     */
    info(message) {
        return this.sendMessage(MessageType.Info, message);
    }
    /**
     * Shows an information message
     */
    success(message) {
        return this.sendMessage(MessageType.Success, message);
    }
    /**
     * Shows a trace message
     */
    trace(message) {
        return this.sendMessage(MessageType.Trace, message);
    }
    /**
     * Shows a trace message
     */
    error(message) {
        return this.sendMessage(MessageType.Error, message);
    }
    /**
     * Shows a trace message
     */
    warning(message) {
        return this.sendMessage(MessageType.Warning, message);
    }
    /**
     * Shows a message into the status bar
     */
    status(message) {
        return this.sendMessage(MessageType.Status, message);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Message;
//# sourceMappingURL=Message.js.map