'use strict';
const vscode = require("vscode");
const PathAutoCompleteProvider_1 = require("./features/PathAutoCompleteProvider");
function activate(context) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('*', new PathAutoCompleteProvider_1.PathAutocomplete(), '/'));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map