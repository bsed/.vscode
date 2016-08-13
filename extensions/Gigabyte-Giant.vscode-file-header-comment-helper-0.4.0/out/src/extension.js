"use strict";
var vscode = require("vscode");
var commands = require("./commands");
function activate(context) {
    var insertFileHeaderComment = vscode.commands.registerCommand("extension.insertFileHeaderComment", commands.insertFileHeaderComment);
    context.subscriptions.push(insertFileHeaderComment);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map