/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var cp = require('child_process');
var dmp = require('diff-match-patch');
/**
 * Extracts method out of current selection and replaces the current selection with a call to the extracted method.
 */
function extractMethod() {
    var editor = vscode_1.window.activeTextEditor;
    if (!editor) {
        vscode_1.window.showInformationMessage('No editor is active.');
        return;
    }
    if (editor.selections.length !== 1) {
        vscode_1.window.showInformationMessage('You need to have a single selection for extracting method');
        return;
    }
    var showInputBoxPromise = vscode_1.window.showInputBox({ placeHolder: 'Please enter the name for the extracted method' });
    showInputBoxPromise.then(function (methodName) {
        extractMethodUsingGoDoctor(methodName, editor.selection, editor).then(function (errorMessage) {
            if (errorMessage) {
                vscode_1.window.showErrorMessage(errorMessage);
            }
        });
    });
}
exports.extractMethod = extractMethod;
/**
 * Extracts method out of current selection and replaces the current selection with a call to the extracted method using godoctor.
 *
 * @param methodName name for the extracted method
 * @param selection the editor selection from which method is to be extracted
 * @param editor the editor that will be used to apply the changes from godoctor
 * @returns errorMessage in case the method fails, null otherwise
 */
function extractMethodUsingGoDoctor(methodName, selection, editor) {
    var godoctor = goPath_1.getBinPath('godoctor');
    var position = (selection.start.line + 1) + "," + (selection.start.character + 1) + ":" + (selection.end.line + 1) + "," + (selection.end.character + 1);
    return new Promise(function (resolve, reject) {
        var process = cp.execFile(godoctor, ['-pos', position, 'extract', methodName], {}, function (err, stdout, stderr) {
            if (err) {
                var errorMessageIndex = stderr.indexOf('Error:');
                return resolve(errorMessageIndex > -1 ? stderr.substr(errorMessageIndex) : stderr);
            }
            var d = new dmp.diff_match_patch();
            var patchText = stdout.substr(stdout.indexOf('@@'));
            var patches;
            try {
                patches = d.patch_fromText(patchText);
            }
            catch (e) {
                return resolve("Failed to parse the patches from godoctor: " + e.message);
            }
            applypatches(patches, editor).then(function (validEdit) {
                return resolve(validEdit ? null : 'Edits could not be applied to the document');
            });
        });
        process.stdin.end(editor.document.getText());
    });
}
exports.extractMethodUsingGoDoctor = extractMethodUsingGoDoctor;
/**
 * Applies the given set of patches to the document in the given editor
 *
 * @param patches array of patches to be applied
 * @param editor the TextEditor whose document will be updated
 */
function applypatches(patches, editor) {
    var totalEdits = [];
    patches.reverse().forEach(function (patch) {
        // Godoctor provides a diff for each line, but the text accompanying the diff does not end with '\n'
        // GetEditsFromDiffs(..) expects the '\n' to exist in the text wherever there is a new line.
        // So add one for each diff from getdoctor
        for (var i = 0; i < patch.diffs.length; i++) {
            patch.diffs[i][1] += '\n';
        }
        var edits = util_1.GetEditsFromDiffs(patch.diffs, patch.start1);
        totalEdits = totalEdits.concat(edits);
    });
    return editor.edit(function (editBuilder) {
        totalEdits.forEach(function (edit) {
            switch (edit.action) {
                case util_1.EditTypes.EDIT_INSERT:
                    editBuilder.insert(edit.start, edit.text);
                    break;
                case util_1.EditTypes.EDIT_DELETE:
                    editBuilder.delete(new vscode_1.Range(edit.start, edit.end));
                    break;
                case util_1.EditTypes.EDIT_REPLACE:
                    editBuilder.replace(new vscode_1.Range(edit.start, edit.end), edit.text);
                    break;
            }
        });
    });
}
//# sourceMappingURL=goExtractMethod.js.map