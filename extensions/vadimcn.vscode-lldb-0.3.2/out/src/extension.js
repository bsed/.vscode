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
const ps = require('ps-node');
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.showDisassembly', () => showDisassembly(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.toggleDisassembly', () => toggleDisassembly(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.displayFormat', () => displayFormat(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.launchDebugServer', () => launchDebugServer(context)));
    context.subscriptions.push(vscode_1.commands.registerCommand('lldb.pickProcess', () => pickProcess(context)));
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
function pickProcess(context) {
    return __awaiter(this, void 0, void 0, function* () {
        ps.lookup((err, list) => {
            console.log('xxx', list[0]);
        });
    });
}
//# sourceMappingURL=extension.js.map