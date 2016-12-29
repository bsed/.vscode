'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode_1 = require('vscode');
const adapterSession_1 = require('./adapterSession');
const util_1 = require('util');
const cp = require('child_process');
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.showDisassembly', () => showDisassembly(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.toggleDisassembly', () => toggleDisassembly(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.displayFormat', () => displayFormat(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.launchDebugServer', () => launchDebugServer(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.pickProcess', () => pickProcess(context, false)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.pickMyProcess', () => pickProcess(context, true)));
}
exports.activate = activate;
function showDisassembly(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let selection = yield vscode_1.window.showQuickPick(['always', 'auto', 'never']);
        adapterSession_1.withSession(session => session.send('showDisassembly', { value: selection }));
    });
}
function toggleDisassembly(context) {
    return __awaiter(this, void 0, void 0, function* () {
        adapterSession_1.withSession(session => session.send('showDisassembly', { value: 'toggle' }));
    });
}
function displayFormat(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let selection = yield vscode_1.window.showQuickPick(['auto', 'hex', 'decimal', 'binary']);
        adapterSession_1.withSession(session => session.send('displayFormat', { value: selection }));
    });
}
function launchDebugServer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let terminal = vscode_1.window.createTerminal('LLDB Debug Server');
        terminal.sendText('cd ' + context.extensionPath + '\n');
        terminal.sendText('lldb -b -O "script import adapter; adapter.run_tcp_server()"\n');
    });
}
function pickProcess(context, currentUserOnly) {
    return __awaiter(this, void 0, void 0, function* () {
        let is_windows = process.platform == 'win32';
        var command;
        if (!is_windows) {
            if (currentUserOnly)
                command = 'ps x';
            else
                command = 'ps ax';
        }
        else {
            if (currentUserOnly)
                command = 'tasklist /V /FO CSV /FI "USERNAME eq ' + process.env['USERNAME'] + '"';
            else
                command = 'tasklist /V /FO CSV';
        }
        let stdout = yield new Promise((resolve, reject) => {
            cp.exec(command, (error, stdout, stderr) => {
                if (error)
                    reject(error);
                else
                    resolve(stdout);
            });
        });
        let lines = stdout.split('\n');
        let items = [];
        var re, idx;
        if (!is_windows) {
            re = /^\s*(\d+)\s+.*?\s+.*?\s+.*?\s+(.*)()$/;
            idx = [1, 2, 3];
        }
        else {
            // name, pid, ..., window title
            re = /^"([^"]*)","([^"]*)",(?:"[^"]*",){6}"([^"]*)"/;
            idx = [2, 1, 3];
        }
        for (var i = 1; i < lines.length; ++i) {
            let groups = re.exec(lines[i]);
            if (groups) {
                let pid = parseInt(groups[idx[0]]);
                let name = groups[idx[1]];
                let descr = groups[idx[2]];
                let item = { label: util_1.format('%d: %s', pid, name), description: descr, pid: pid };
                items.unshift(item);
            }
        }
        let item = yield vscode_1.window.showQuickPick(items);
        if (item) {
            return item.pid;
        }
        else {
            throw Error('Cancelled');
        }
    });
}
//# sourceMappingURL=extension.js.map