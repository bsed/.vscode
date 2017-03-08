"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var vscode_1 = require('vscode');
var path = require('path');
var opener = require('opener');
function updateDependencyCommand(codeLens, packageVersion) {
    var edits = [vscode_1.TextEdit.replace(codeLens.versionRange, packageVersion)];
    var edit = new vscode_1.WorkspaceEdit();
    edit.set(codeLens.documentUrl, edits);
    return vscode_1.workspace.applyEdit(edit);
}
exports.updateDependencyCommand = updateDependencyCommand;
function linkCommand(codeLens) {
    if (codeLens.package.meta.type === 'file') {
        var filePathToOpen = path.resolve(path.dirname(codeLens.documentUrl.fsPath), codeLens.package.meta.remoteUrl);
        opener(filePathToOpen);
        return;
    }
    opener(codeLens.package.meta.remoteUrl);
}
exports.linkCommand = linkCommand;
function updateDependenciesCommand(rootCodeLens, codeLenCollection) {
    var edits = codeLenCollection
        .filter(function (codeLens) { return codeLens != rootCodeLens; })
        .filter(function (codeLens) { return rootCodeLens.range.contains(codeLens.range); })
        .filter(function (codeLens) { return codeLens.command && codeLens.command.arguments; })
        .filter(function (codeLens) { return codeLens.package; })
        .filter(function (codeLens) { return !codeLens.package.meta || (codeLens.package.meta.type !== 'github' && codeLens.package.meta.type !== 'file'); })
        .map(function (codeLens) { return vscode_1.TextEdit.replace(codeLens.versionRange, codeLens.command.arguments[1]); });
    var edit = new vscode_1.WorkspaceEdit();
    edit.set(rootCodeLens.documentUrl, edits);
    return vscode_1.workspace.applyEdit(edit);
}
exports.updateDependenciesCommand = updateDependenciesCommand;
//# sourceMappingURL=commands.js.map