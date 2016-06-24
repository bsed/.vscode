/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
"use strict";
var vscode_1 = require('vscode');
var async_1 = require('./utils/async');
var exec = require('child_process').exec;
var Crane = (function () {
    function Crane(languageClient) {
        var _this = this;
        this.langClient = languageClient;
        this.delayers = Object.create(null);
        var subscriptions = [];
        vscode_1.workspace.onDidChangeTextDocument(function (e) { return _this.onChangeTextHandler(e.document); }, null, subscriptions);
        vscode_1.workspace.onDidCloseTextDocument(function (textDocument) { delete _this.delayers[textDocument.uri.toString()]; }, null, subscriptions);
        vscode_1.workspace.onDidSaveTextDocument(function (document) { return _this.handleFileSave(); });
        this.disposable = vscode_1.Disposable.from.apply(vscode_1.Disposable, subscriptions);
        if (!this.statusBarItem) {
            this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
            this.statusBarItem.hide();
        }
        this.doInit();
    }
    Crane.prototype.doInit = function () {
        console.log("Crane Initialised...");
        this.statusBarItem.text = "$(zap) Processing source files...";
        this.statusBarItem.tooltip = "Crane is processing the PHP source files in your workspace to build code completion suggestions";
        this.statusBarItem.show();
        // Send request to server to build object tree for all workspace files
        this.processAllFilesInWorkspace();
    };
    Crane.prototype.reportBug = function () {
        var openCommand;
        switch (process.platform) {
            case 'darwin':
                openCommand = 'open ';
                break;
            case 'win32':
                openCommand = 'start ';
                break;
            default:
                return;
        }
        exec(openCommand + "https://github.com/HvyIndustries/crane/issues");
    };
    Crane.prototype.handleFileSave = function () {
        var editor = vscode_1.window.activeTextEditor;
        if (editor == null)
            return;
        var document = editor.document;
        this.buildObjectTreeForDocument(document);
    };
    Crane.prototype.processAllFilesInWorkspace = function () {
        if (vscode_1.workspace.rootPath == undefined)
            return;
        var requestType = { method: "buildObjectTreeForWorkspace" };
        this.langClient.sendRequest(requestType);
    };
    Crane.prototype.onChangeTextHandler = function (textDocument) {
        var _this = this;
        // Only parse PHP files
        if (textDocument.languageId != "php")
            return;
        var key = textDocument.uri.toString();
        var delayer = this.delayers[key];
        if (!delayer) {
            delayer = new async_1.ThrottledDelayer(250);
            this.delayers[key] = delayer;
        }
        delayer.trigger(function () { return _this.buildObjectTreeForDocument(textDocument); });
    };
    Crane.prototype.buildObjectTreeForDocument = function (document) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var path = document.fileName;
            var text = document.getText();
            var requestType = { method: "buildObjectTreeForDocument" };
            _this.langClient.sendRequest(requestType, { path: path, text: text }).then(function () { return resolve(); });
        });
    };
    Crane.prototype.dispose = function () {
        this.disposable.dispose();
        this.statusBarItem.dispose();
    };
    return Crane;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Crane;
//# sourceMappingURL=crane.js.map