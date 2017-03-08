'use strict';
var vscode = require("vscode");
var spec_generator_1 = require("./spec-generator");
// constance
var NAME = 'specGenerator';
var COMMAND = 'generate';
// default configuration
var config = {
    variableName: 'result',
    doubleQuote: true,
    semicolon: true,
    style: 'chai',
    es6: true
};
// read extension configuration
function readConfig() {
    var settings = vscode.workspace.getConfiguration(NAME);
    config = Object.assign({}, config, settings);
}
function toSpecGeneratorOption(config, special) {
    if (special === void 0) { special = false; }
    return {
        variableName: config.variableName,
        specs: [],
        special: special,
        quote: config.doubleQuote ? '"' : '\'',
        semicolon: config.semicolon,
        style: config.style,
        es6: config.es6,
    };
}
function activate(context) {
    // initialize configuration
    readConfig();
    // reload configuration on change
    vscode.workspace.onDidChangeConfiguration(readConfig);
    var disposable = vscode.commands.registerCommand(NAME + "." + COMMAND, function () {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        try {
            var target = eval('(' + text + ')');
            var specs_1 = spec_generator_1.generateSpec(target, toSpecGeneratorOption(config, false));
            editor.edit(function (edit) {
                edit.replace(editor.selection, specs_1.join('\n'));
            });
        }
        catch (e) {
            var specs_2 = spec_generator_1.generateSpec(text, toSpecGeneratorOption(config, true));
            if (specs_2.length != 0) {
                editor.edit(function (edit) {
                    edit.replace(editor.selection, specs_2.join('\n'));
                });
            }
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map