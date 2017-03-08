"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Debug {
    static SetConnection(conn) {
        Debug.connection = conn;
    }
    static info(message) {
        Debug.connection.sendNotification('serverDebugMessage', { type: 'info', message: message });
    }
    static error(message) {
        Debug.connection.sendNotification('serverDebugMessage', { type: 'error', message: message });
    }
    static warning(message) {
        Debug.connection.sendNotification('serverDebugMessage', { type: 'warning', message: message });
    }
}
exports.Debug = Debug;
//# sourceMappingURL=Debug.js.map