'use strict';
var vscode = require('vscode');
function activate(context) {
    console.log('Congratulations, your extension "auto-close-tag" is now active!');
    vscode.workspace.onDidChangeTextDocument(function (event) {
        insertCloseTag(event);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
function insertCloseTag(event) {
    if (event.contentChanges[0].text !== ">") {
        return;
    }
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    var languageId = editor.document.languageId;
    var config = vscode.workspace.getConfiguration('auto-close-tag');
    var languages = config.get("activationOnLanguage", ["*"]);
    if (languages.indexOf("*") === -1 && languages.indexOf(languageId) === -1) {
        return;
    }
    var selection = editor.selection;
    var textLine = editor.document.lineAt(selection.start);
    var originalPosition = selection.start.translate(0, 1);
    var text = textLine.text.substring(0, selection.start.character + 1);
    var result = /<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^\s<>]*?[^\s/<>]+?)*?>$/g.exec(text);
    if (result !== null) {
        var excludedTags = config.get("excludedTags", []);
        if (excludedTags.indexOf(result[1]) === -1) {
            editor.edit(function (editBuilder) {
                editBuilder.insert(originalPosition, "</" + result[1] + ">");
            }).then(function () {
                editor.selection = new vscode.Selection(originalPosition, originalPosition);
            });
        }
    }
}
//# sourceMappingURL=extension.js.map