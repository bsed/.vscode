/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path_1 = require('path');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
function vscodeKindFromGoCodeClass(kind) {
    switch (kind) {
        case 'const':
        case 'package':
        case 'type':
            return vscode.CompletionItemKind.Keyword;
        case 'func':
            return vscode.CompletionItemKind.Function;
        case 'var':
            return vscode.CompletionItemKind.Field;
        case 'import':
            return vscode.CompletionItemKind.Module;
    }
    return vscode.CompletionItemKind.Property; // TODO@EG additional mappings needed?
}
var GoCompletionItemProvider = (function () {
    function GoCompletionItemProvider() {
        this.gocodeConfigurationComplete = false;
    }
    GoCompletionItemProvider.prototype.provideCompletionItems = function (document, position, token) {
        return this.ensureGoCodeConfigured().then(function () {
            return new Promise(function (resolve, reject) {
                var filename = document.fileName;
                if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
                    return resolve([]);
                }
                var inString = false;
                if ((document.lineAt(position.line).text.substring(0, position.character).match(/\"/g) || []).length % 2 === 1) {
                    inString = true;
                }
                // get current word
                var wordAtPosition = document.getWordRangeAtPosition(position);
                var currentWord = '';
                if (wordAtPosition && wordAtPosition.start.character < position.character) {
                    var word = document.getText(wordAtPosition);
                    currentWord = word.substr(0, position.character - wordAtPosition.start.character);
                }
                if (currentWord.match(/^\d+$/)) {
                    return resolve([]);
                }
                var offset = document.offsetAt(position);
                var gocode = goPath_1.getBinPath('gocode');
                // Unset GOOS and GOARCH for the `gocode` process to ensure that GOHOSTOS and GOHOSTARCH
                // are used as the target operating system and architecture. `gocode` is unable to provide
                // autocompletion when the Go environment is configured for cross compilation.
                var env = Object.assign({}, process.env, { GOOS: '', GOARCH: '' });
                // Spawn `gocode` process
                var p = cp.execFile(gocode, ['-f=json', 'autocomplete', filename, 'c' + offset], { env: env }, function (err, stdout, stderr) {
                    try {
                        if (err && err.code === 'ENOENT') {
                            vscode.window.showInformationMessage('The "gocode" command is not available.  Use "go get -u github.com/nsf/gocode" to install.');
                        }
                        if (err)
                            return reject(err);
                        var results = JSON.parse(stdout.toString());
                        var suggestions = [];
                        // 'Smart Snippet' for package clause
                        // TODO: Factor this out into a general mechanism
                        if (!document.getText().match(/package\s+(\w+)/)) {
                            var defaultPackageName = path_1.basename(document.fileName) === 'main.go'
                                ? 'main'
                                : path_1.basename(path_1.dirname(document.fileName));
                            var packageItem = new vscode.CompletionItem('package ' + defaultPackageName);
                            packageItem.kind = vscode.CompletionItemKind.Snippet;
                            packageItem.insertText = 'package ' + defaultPackageName + '\r\n\r\n';
                            suggestions.push(packageItem);
                        }
                        if (results[1]) {
                            for (var _i = 0, _a = results[1]; _i < _a.length; _i++) {
                                var suggest = _a[_i];
                                if (inString && suggest.class !== 'import')
                                    continue;
                                var item = new vscode.CompletionItem(suggest.name);
                                item.kind = vscodeKindFromGoCodeClass(suggest.class);
                                item.detail = suggest.type;
                                var conf = vscode.workspace.getConfiguration('go');
                                if (conf.get('useCodeSnippetsOnFunctionSuggest') && suggest.class === 'func') {
                                    var params = util_1.parameters(suggest.type.substring(4));
                                    var paramSnippets = [];
                                    for (var i in params) {
                                        var param = params[i].trim();
                                        if (param) {
                                            param = param.replace('{', '\\{').replace('}', '\\}');
                                            paramSnippets.push('{{' + param + '}}');
                                        }
                                    }
                                    item.insertText = suggest.name + '(' + paramSnippets.join(', ') + '){{}}';
                                }
                                suggestions.push(item);
                            }
                            ;
                        }
                        resolve(suggestions);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
                p.stdin.end(document.getText());
            });
        });
    };
    // TODO: Shouldn't lib-path also be set?
    GoCompletionItemProvider.prototype.ensureGoCodeConfigured = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // TODO: Since the gocode daemon is shared amongst clients, shouldn't settings be
            // adjusted per-invocation to avoid conflicts from other gocode-using programs?
            if (_this.gocodeConfigurationComplete) {
                return resolve();
            }
            var gocode = goPath_1.getBinPath('gocode');
            var autobuild = vscode.workspace.getConfiguration('go')['gocodeAutoBuild'];
            cp.execFile(gocode, ['set', 'propose-builtins', 'true'], {}, function (err, stdout, stderr) {
                cp.execFile(gocode, ['set', 'autobuild', autobuild], {}, function (err, stdout, stderr) {
                    resolve();
                });
            });
        });
    };
    return GoCompletionItemProvider;
}());
exports.GoCompletionItemProvider = GoCompletionItemProvider;
//# sourceMappingURL=goSuggest.js.map