"use strict";
const ghcModInterfaces_1 = require('../ghcModInterfaces');
class RemoteConnectionAdapter {
    constructor(connection, level) {
        this.level = level || ghcModInterfaces_1.LogLevel.error;
        this.logger = connection.console;
        this.window = connection.window;
    }
    setLogLevel(level) {
        this.level = level;
    }
    log(message) {
        if (this.level >= ghcModInterfaces_1.LogLevel.log) {
            this.logger.log(message);
        }
    }
    info(message) {
        if (this.level >= ghcModInterfaces_1.LogLevel.info) {
            this.logger.info(message);
        }
    }
    warn(message) {
        if (this.level >= ghcModInterfaces_1.LogLevel.warn) {
            this.logger.warn(message);
        }
    }
    error(message) {
        if (this.level >= ghcModInterfaces_1.LogLevel.error) {
            this.logger.error(message);
            this.window.showErrorMessage(message);
        }
    }
}
exports.RemoteConnectionAdapter = RemoteConnectionAdapter;
//# sourceMappingURL=remoteConnectionAdapter.js.map