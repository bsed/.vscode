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
        }
    }
    info(message) {
        if (this.level >= interfaces_1.LogLevel.info) {
            this.logger.info(message);
        }
    }
    warn(message) {
        if (this.level >= interfaces_1.LogLevel.warn) {
            this.logger.warn(message);
        }
    }
    error(message) {
        if (this.level >= interfaces_1.LogLevel.error) {
            this.logger.error(message);
            this.window.showErrorMessage(message);
        }
    }
}
exports.RemoteConnectionAdapter = RemoteConnectionAdapter;
//# sourceMappingURL=remoteConnectionAdapter.js.map