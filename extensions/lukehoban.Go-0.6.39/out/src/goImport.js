/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
function listPackages() {
    return new Promise(function (resolve, reject) {
        cp.execFile(goPath_1.getBinPath('gopkgs'), [], function (err, stdout, stderr) {
            if (err && err.code === 'ENOENT') {
                vscode.window.showInformationMessage('The "gopkgs" command is not available.  Use "go get github.com/tpng/gopkgs" to install.');
                return reject();
            }
            var lines = stdout.toString().split('\n');
            var sortedlines = lines.sort().slice(1); // Drop the empty entry from the final '\n'
            return resolve(sortedlines);
        });
    });
}
exports.listPackages = listPackages;
function askUserForImport() {
    return listPackages().then(function (packages) {
        return vscode.window.showQuickPick(packages);
    });
}
function addImport(arg) {
    var p = arg ? Promise.resolve(arg) : askUserForImport();
    p.then(function (imp) {
        // Import name wasn't provided
        if (imp === undefined) {
            return null;
        }
        var _a = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText()), imports = _a.imports, pkg = _a.pkg;
        var multis = imports.filter(function (x) { return x.kind === 'multi'; });
        if (multis.length > 0) {
            // There is a multiple import declaration, add to the last one
            var closeParenLine_1 = multis[multis.length - 1].end;
            return vscode.window.activeTextEditor.edit(function (editBuilder) {
                editBuilder.insert(new vscode.Position(closeParenLine_1, 0), '\t"' + imp + '"\n');
            });
        }
        else if (imports.length > 0) {
            // There are only single import declarations, add after the last one
            var lastSingleImport_1 = imports[imports.length - 1].end;
            return vscode.window.activeTextEditor.edit(function (editBuilder) {
                editBuilder.insert(new vscode.Position(lastSingleImport_1 + 1, 0), 'import "' + imp + '"\n');
            });
        }
        else if (pkg && pkg.start >= 0) {
            // There are no import declarations, but there is a package declaration
            return vscode.window.activeTextEditor.edit(function (editBuilder) {
                editBuilder.insert(new vscode.Position(pkg.start + 1, 0), '\nimport (\n\t"' + imp + '"\n)\n');
            });
        }
        else {
            // There are no imports and no package declaration - give up
            return null;
        }
    });
}
exports.addImport = addImport;
//# sourceMappingURL=goImport.js.map