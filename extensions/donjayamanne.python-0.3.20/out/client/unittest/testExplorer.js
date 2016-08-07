'use strict';
var vscode = require('vscode');
var testManager_1 = require('./testManager');
var contracts_1 = require('./contracts');
var htmlGenerator = require('./htmlGenerator');
var fs = require('fs');
var testSchema = 'python-test-explorer';
var previewUri = vscode.Uri.parse(testSchema + '://authority/css-preview');
var testManager;
var filesRetreived;
var TextDocumentContentProvider = (function () {
    function TextDocumentContentProvider() {
        this._onDidChange = new vscode.EventEmitter();
    }
    TextDocumentContentProvider.prototype.provideTextDocumentContent = function (uri) {
        var _this = this;
        if (!filesRetreived) {
            testManager.getTestFiles().then(function (tests) {
                filesRetreived = true;
                _this.tests = tests;
                _this.lastError = null;
                _this.update(uri);
            }).catch(function (error) {
                filesRetreived = true;
                _this.lastError = error;
                _this.update(uri);
            });
        }
        return this.createTestExplorerView();
    };
    Object.defineProperty(TextDocumentContentProvider.prototype, "onDidChange", {
        get: function () {
            return this._onDidChange.event;
        },
        enumerable: true,
        configurable: true
    });
    TextDocumentContentProvider.prototype.update = function (uri) {
        this._onDidChange.fire(uri);
    };
    TextDocumentContentProvider.prototype.createTestExplorerView = function () {
        if (this.lastError) {
            this.lastError = null;
            return htmlGenerator.generateErrorView('Unknown Error', this.lastError);
        }
        else {
            var vw = this.generateTestExplorer();
            fs.writeFileSync('/Users/donjayamanne/Desktop/Development/Node/testRunner/test.1.html', vw);
            return vw;
        }
    };
    TextDocumentContentProvider.prototype.errorMessage = function (error) {
        return "\n            <body>\n                " + error + "\n            </body>";
    };
    TextDocumentContentProvider.prototype.generateTestExplorer = function () {
        var now = new Date().toString();
        var innerHtml = '';
        var menuHtml = htmlGenerator.generateHtmlForMenu(testManager.status);
        switch (testManager.status) {
            case contracts_1.TestStatus.Unknown:
            case contracts_1.TestStatus.Discovering: {
                innerHtml = htmlGenerator.generateDiscoveringHtmlView();
                break;
            }
            case contracts_1.TestStatus.Idle:
            case contracts_1.TestStatus.Running: {
                innerHtml = htmlGenerator.generateTestExplorerHtmlView(this.tests, testManager.status);
                break;
            }
        }
        return "\n                " + htmlGenerator.TREE_STYLES + "\n                <style>\n                    body {\n                        black;\n                    }\n                </style>\n                <body>\n                    <div>\n                        " + menuHtml + "\n                    </div><hr/>\n                    <div>\n                        <ol class=\"ts-tree \" id=\"\">\n                            " + innerHtml + "\n                        </ol>\n                    </div>\n                </body>\n                ";
    };
    return TextDocumentContentProvider;
}());
function activate(context, ouputChannel) {
    var provider = new TextDocumentContentProvider();
    var registration = vscode.workspace.registerTextDocumentContentProvider(testSchema, provider);
    var disposable = vscode.commands.registerCommand('python.viewTestExplorer', function () {
        previewUri = vscode.Uri.parse(testSchema + '://authority/css-preview' + new Date().getTime().toString());
        filesRetreived = false;
        testManager = new testManager_1.TestManager(vscode.workspace.rootPath, vscode.workspace.rootPath);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Python Test Explorer').then(function (success) {
        }, function (reason) {
            vscode.window.showErrorMessage(reason);
        });
    });
    context.subscriptions.push(disposable, registration);
    disposable = vscode.commands.registerCommand('python.runAllUnitTests', function (runTests) {
        testManager.getTestFiles().then(function (tests) {
            testManager.runTest().then(function () {
                provider.update(previewUri);
            }).catch(function (err) {
                vscode.window.showErrorMessage('There was an error in running the tests, view the output Channel');
                ouputChannel.appendLine(err);
                ouputChannel.show();
            });
        });
    });
    disposable = vscode.commands.registerCommand('python.runUnitTest', function (type, rawPath) {
        testManager.getTestFiles().then(function (tests) {
            testManager.runTest().then(function () {
                provider.update(previewUri);
            }).catch(function (err) {
                vscode.window.showErrorMessage('There was an error in running the tests, view the output Channel');
                ouputChannel.appendLine(err);
                ouputChannel.show();
            });
        });
    });
    disposable = vscode.commands.registerCommand('python.discoverUnitTests', function (runTests) {
        filesRetreived = false;
        provider.update(previewUri);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=testExplorer.js.map