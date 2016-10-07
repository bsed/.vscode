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
    if (event.contentChanges[0].text !== ">" && event.contentChanges[0].text !== "/") {
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
    var originalPosition = selection.start.translate(0, 1);
    var excludedTags = config.get("excludedTags", []);
    var isSublimeText3Mode = config.get("SublimeText3Mode", false);
    if (isSublimeText3Mode) {
        var text = editor.document.getText(new vscode.Range(new vscode.Position(0, 0), originalPosition));
        var last2chars = "";
        if (text.length > 2) {
            last2chars = text.substr(text.length - 2);
        }
        if (last2chars === "</") {
            var regex = /<(\/?[a-zA-Z][a-zA-Z0-9]*)(?:\s[^\s<>]*?[^\s/<>=]+?)*?>/g;
            var result = null;
            var stack_1 = [];
            while ((result = regex.exec(text)) !== null) {
                var isStartTag = result[1].substr(0, 1) !== "/";
                var tag = isStartTag ? result[1] : result[1].substr(1);
                if (excludedTags.indexOf(tag) === -1) {
                    if (isStartTag) {
                        stack_1.push(tag);
                    }
                    else if (stack_1.length > 0) {
                        var lastTag = stack_1[stack_1.length - 1];
                        if (lastTag === tag) {
                            stack_1.pop();
                        }
                    }
                }
            }
            if (stack_1.length > 0) {
                editor.edit(function (editBuilder) {
                    editBuilder.insert(originalPosition, stack_1[stack_1.length - 1] + ">");
                });
            }
        }
    }
    else {
        var textLine = editor.document.lineAt(selection.start);
        var text = textLine.text.substring(0, selection.start.character + 1);
        var result_1 = /<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^\s<>]*?[^\s/<>=]+?)*?>$/.exec(text);
        if (result_1 !== null) {
            if (excludedTags.indexOf(result_1[1]) === -1) {
                editor.edit(function (editBuilder) {
                    editBuilder.insert(originalPosition, "</" + result_1[1] + ">");
                }).then(function () {
                    editor.selection = new vscode.Selection(originalPosition, originalPosition);
                });
            }
        }
    }
}
//# sourceMappingURL=extension.js.map