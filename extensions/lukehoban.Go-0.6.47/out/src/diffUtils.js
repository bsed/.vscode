/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
var vscode_1 = require('vscode');
var goPath_1 = require('../src/goPath');
var jsDiff = require('diff');
var diffToolAvailable = null;
function isDiffToolAvailable() {
    if (diffToolAvailable == null) {
        diffToolAvailable = goPath_1.getBinPathFromEnvVar('diff', 'PATH', false) != null;
    }
    return diffToolAvailable;
}
exports.isDiffToolAvailable = isDiffToolAvailable;
(function (EditTypes) {
    EditTypes[EditTypes["EDIT_DELETE"] = 0] = "EDIT_DELETE";
    EditTypes[EditTypes["EDIT_INSERT"] = 1] = "EDIT_INSERT";
    EditTypes[EditTypes["EDIT_REPLACE"] = 2] = "EDIT_REPLACE";
})(exports.EditTypes || (exports.EditTypes = {}));
var EditTypes = exports.EditTypes;
;
var Edit = (function () {
    function Edit(action, start) {
        this.action = action;
        this.start = start;
        this.text = '';
    }
    // Creates TextEdit for current Edit
    Edit.prototype.apply = function () {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                return vscode_1.TextEdit.insert(this.start, this.text);
            case EditTypes.EDIT_DELETE:
                return vscode_1.TextEdit.delete(new vscode_1.Range(this.start, this.end));
            case EditTypes.EDIT_REPLACE:
                return vscode_1.TextEdit.replace(new vscode_1.Range(this.start, this.end), this.text);
        }
    };
    // Applies Edit using given TextEditorEdit
    Edit.prototype.applyUsingTextEditorEdit = function (editBuilder) {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                editBuilder.insert(this.start, this.text);
                break;
            case EditTypes.EDIT_DELETE:
                editBuilder.delete(new vscode_1.Range(this.start, this.end));
                break;
            case EditTypes.EDIT_REPLACE:
                editBuilder.replace(new vscode_1.Range(this.start, this.end), this.text);
                break;
        }
    };
    // Applies Edits to given WorkspaceEdit
    Edit.prototype.applyUsingWorkspaceEdit = function (workspaceEdit, fileUri) {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                workspaceEdit.insert(fileUri, this.start, this.text);
                break;
            case EditTypes.EDIT_DELETE:
                workspaceEdit.delete(fileUri, new vscode_1.Range(this.start, this.end));
                break;
            case EditTypes.EDIT_REPLACE:
                workspaceEdit.replace(fileUri, new vscode_1.Range(this.start, this.end), this.text);
                break;
        }
    };
    return Edit;
}());
exports.Edit = Edit;
/**
 * Uses diff module to parse given array of IUniDiff objects and returns edits for files
 *
 * @param diffOutput jsDiff.IUniDiff[]
 *
 * @returns Array of FilePatch objects, one for each file
 */
function parseUniDiffs(diffOutput) {
    var filePatches = [];
    diffOutput.forEach(function (uniDiff) {
        var edit = null;
        var edits = [];
        uniDiff.hunks.forEach(function (hunk) {
            var startLine = hunk.oldStart;
            hunk.lines.forEach(function (line) {
                switch (line.substr(0, 1)) {
                    case '-':
                        if (edit == null) {
                            edit = new Edit(EditTypes.EDIT_DELETE, new vscode_1.Position(startLine - 1, 0));
                        }
                        edit.end = new vscode_1.Position(startLine, 0);
                        startLine++;
                        break;
                    case '+':
                        if (edit == null) {
                            edit = new Edit(EditTypes.EDIT_INSERT, new vscode_1.Position(startLine - 1, 0));
                        }
                        else if (edit.action === EditTypes.EDIT_DELETE) {
                            edit.action = EditTypes.EDIT_REPLACE;
                        }
                        edit.text += line.substr(1) + '\n';
                        break;
                    case ' ':
                        startLine++;
                        if (edit != null) {
                            edits.push(edit);
                        }
                        edit = null;
                        break;
                }
            });
            if (edit != null) {
                edits.push(edit);
            }
        });
        filePatches.push({ fileName: uniDiff.oldFileName, edits: edits });
    });
    return filePatches;
}
/**
 * Returns a FilePatch object by generating diffs between given oldStr and newStr using the diff module
 *
 * @param fileName string: Name of the file to which edits should be applied
 * @param oldStr string
 * @param newStr string
 *
 * @returns A single FilePatch object
 */
function getEdits(fileName, oldStr, newStr) {
    if (process.platform === 'win32') {
        oldStr = oldStr.split('\r\n').join('\n');
        newStr = newStr.split('\r\n').join('\n');
    }
    var unifiedDiffs = jsDiff.structuredPatch(fileName, fileName, oldStr, newStr, '', '');
    var filePatches = parseUniDiffs([unifiedDiffs]);
    return filePatches[0];
}
exports.getEdits = getEdits;
/**
 * Uses diff module to parse given diff string and returns edits for files
 *
 * @param diffStr : Diff string in unified format. http://www.gnu.org/software/diffutils/manual/diffutils.html#Unified-Format
 *
 * @returns Array of FilePatch objects, one for each file
 */
function getEditsFromUnifiedDiffStr(diffstr) {
    // Workaround for the bug https://github.com/kpdecker/jsdiff/issues/135 
    if (diffstr.startsWith('---')) {
        diffstr = diffstr.split('---').join('Index\n---');
    }
    var unifiedDiffs = jsDiff.parsePatch(diffstr);
    var filePatches = parseUniDiffs(unifiedDiffs);
    return filePatches;
}
exports.getEditsFromUnifiedDiffStr = getEditsFromUnifiedDiffStr;
//# sourceMappingURL=diffUtils.js.map