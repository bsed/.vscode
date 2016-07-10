/**
 * Copyright (C) 2016 Yang Lin (MIT License)
 * @author Yang Lin <linyang95@aol.com>
 */
'use strict';
var vscode = require('vscode');
var scanner_1 = require('./scanner');
var PHPDocumentSymbolProvider = (function () {
    function PHPDocumentSymbolProvider() {
    }
    PHPDocumentSymbolProvider.prototype.provideDocumentSymbols = function (document, token) {
        return new Promise(function (resolve) {
            new scanner_1.Scanner(document.fileName, function (sombols) {
                var data = [];
                for (var index = 0; index < sombols.length; index++) {
                    var item = sombols[index];
                    var type = void 0;
                    switch (item.type) {
                        case scanner_1.tokenEnum.T_CLASS:
                            type = vscode.SymbolKind.Class;
                            break;
                        case scanner_1.tokenEnum.T_FUNCTION:
                            type = vscode.SymbolKind.Function;
                            break;
                        default:
                            continue;
                    }
                    var lineNo = item.lineNo - 1;
                    var start = Math.max(0, item.start - 1);
                    var end = Math.max(0, item.end - 1);
                    var range = new vscode.Range(new vscode.Position(lineNo, start), new vscode.Position(lineNo, end));
                    data.push(new vscode.SymbolInformation(item.text, type, range));
                }
                resolve(data);
            });
        }).then(function (value) {
            return value;
        });
    };
    return PHPDocumentSymbolProvider;
}());
function activate(context) {
    var selector = {
        language: 'php',
        scheme: 'file'
    };
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new PHPDocumentSymbolProvider));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map