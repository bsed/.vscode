'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const protocolClient_1 = require('./protocolClient');
const vscode_1 = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
class MyProtocolClient extends protocolClient_1.ProtocolClient {
    constructor() {
        super(...arguments);
        this.isActive = false;
    }
    start(port) {
        return new Promise((resolve, reject) => {
            let conn = net.connect(port, '127.0.0.1', () => {
                this.connect(conn, conn);
                this.isActive = true;
                resolve();
            });
            conn.on('error', (err) => {
                reject();
                this.isActive = false;
            });
            conn.on('end', () => {
                this.isActive = false;
            });
        });
    }
}
exports.MyProtocolClient = MyProtocolClient;
var connection = null;
function withSession(operation) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connection || !connection.isActive) {
            connection = yield createConnection();
        }
        try {
            return yield operation(connection);
        }
        catch (e) {
            yield vscode_1.window.showErrorMessage('Could not send command: ' + e.message);
            throw e;
        }
    });
}
exports.withSession = withSession;
function createConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let extInfoPath = path.join(os.tmpdir(), 'vscode-lldb-session');
            let data = fs.readFileSync(extInfoPath, 'utf8');
            let port = parseInt(data);
            let client = new MyProtocolClient();
            yield client.start(port);
            return client;
        }
        catch (err) {
            yield vscode_1.window.showErrorMessage('Could not establish connection to debug adapter: ' + err.message);
            throw err;
        }
    });
}
//# sourceMappingURL=adapterSession.js.map