"use strict";
const interfaces_1 = require('../interfaces');
class RemoteConnectionAdapter {
    constructor(connection, level) {
        this.level = level || interfaces_1.LogLevel.error;
        this.logger = connection.console;
        this.window = connection.window;
    }
    setLogger(logger) {
        this.logger = logger.console;
    }
    setLogLevel(level) {
        this.level = level;
    }
    log(message) {
        if (this.level >= interfaces_1.LogLevel.log) {
            this.logger.log(message);
            console.log(message);
        }
    }
    info(message, actions, callback) {
        if (this.level >= interfaces_1.LogLevel.info) {
            this.logger.info(message);
            console.info(message);
            if (actions && callback) {
                let messageActionItems = actions.map((action) => { return { title: action }; });
                this.window.showInformationMessage(message, ...messageActionItems).then(selected => {
                    callback(selected.title);
                });
            }
        }
    }
    warn(message, actions, callback) {
        if (this.level >= interfaces_1.LogLevel.warn) {
            this.logger.warn(message);
            console.warn(message);
            if (actions && callback) {
                let messageActionItems = actions.map((action) => { return { title: action }; });
                this.window.showWarningMessage(message, ...messageActionItems).then(selected => {
                    callback(selected.title);
                });
            }
        }
    }
    error(message, actions, callback) {
        if (this.level >= interfaces_1.LogLevel.error) {
            this.logger.error(message);
            console.error(message);
            if (actions && callback) {
                let messageActionItems = actions.map((action) => { return { title: action }; });
                this.window.showErrorMessage(message, ...messageActionItems).then(selected => {
                    callback(selected.title);
                });
            }
        }
    }
}
exports.RemoteConnectionAdapter = RemoteConnectionAdapter;
//# sourceMappingURL=remoteConnectionAdapter.js.map