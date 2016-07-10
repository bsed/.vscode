"use strict";
var path = require('path');
var vscode_1 = require('vscode');
var vscode_languageclient_1 = require('vscode-languageclient');
function activate(context) {
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    var serverModulePath = path.join(__dirname, '..', 'server', 'server.js');
    // break on start options
    // let debugOptions = { execArgv: ["--nolazy", "--debug=6004", "--debug-brk"] };
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    var serverOptions = {
        run: { module: serverModulePath },
        debug: { module: serverModulePath, options: debugOptions }
    };
    var clientOptions = {
        documentSelector: ['typescript', 'typescriptreact'],
        synchronize: {
            configurationSection: 'tslint',
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/tslint.json')
        }
    };
    var client = new vscode_languageclient_1.LanguageClient('tslint', serverOptions, clientOptions);
    function applyTextEdits(uri, documentVersion, edits) {
        var textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage("ESLint fixes are outdated and can't be applied to the document.");
            }
            textEditor.edit(function (mutator) {
                for (var _i = 0, edits_1 = edits; _i < edits_1.length; _i++) {
                    var edit = edits_1[_i];
                    mutator.replace(vscode_languageclient_1.Protocol2Code.asRange(edit.range), edit.newText);
                }
            }).then(function (success) {
                if (!success) {
                    vscode_1.window.showErrorMessage('Failed to apply ESLint fixes to the document. Please consider opening an issue with steps to reproduce.');
                }
            });
        }
    }
    context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, 'tslint.enable').start(), vscode_1.commands.registerCommand('tslint.applySingleFix', applyTextEdits), vscode_1.commands.registerCommand('tslint.applySameFixes', applyTextEdits), vscode_1.commands.registerCommand('tslint.applyAllFixes', applyTextEdits));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map