'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode_1 = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var characterCounter = new CharacterCounter();
    var controller = new CharacterCounterController(characterCounter);
    context.subscriptions.push(controller);
    context.subscriptions.push(characterCounter);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
var CharacterCounter = (function () {
    function CharacterCounter() {
    }
    CharacterCounter.prototype.getCharacterCount = function (doc) {
        return doc.getText().length;
    };
    CharacterCounter.prototype.updateCharacterCount = function () {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
        }
        var editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        var doc = editor.document;
        if (doc.languageId === "markdown") {
            var characterCount = this.getCharacterCount(doc);
            this._statusBarItem.text = characterCount !== 1 ? "$(pencil) " + characterCount + " Characters" : "$(pencil) 1 Character";
            this._statusBarItem.show();
        }
        else {
            this._statusBarItem.hide();
        }
    };
    CharacterCounter.prototype.dispose = function () {
        this._statusBarItem.dispose();
    };
    return CharacterCounter;
}());
exports.CharacterCounter = CharacterCounter;
var CharacterCounterController = (function () {
    function CharacterCounterController(characterCounter) {
        this._characterCounter = characterCounter;
        this._characterCounter.updateCharacterCount();
        var subscriptions = [];
        vscode_1.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode_1.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        this._disposable = vscode_1.Disposable.from.apply(vscode_1.Disposable, subscriptions);
    }
    CharacterCounterController.prototype._onEvent = function () {
        this._characterCounter.updateCharacterCount();
    };
    CharacterCounterController.prototype.dispose = function () {
        this._disposable.dispose();
    };
    return CharacterCounterController;
}());
exports.CharacterCounterController = CharacterCounterController;
//# sourceMappingURL=extension.js.map