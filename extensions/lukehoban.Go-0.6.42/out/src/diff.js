/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var dmp = require('diff-match-patch');
var EDIT_DELETE = 0;
var EDIT_INSERT = 1;
var EDIT_REPLACE = 2;
var Edit = (function () {
    function Edit(action, start) {
        this.action = action;
        this.start = start;
        this.text = "";
    }
    Edit.prototype.apply = function () {
        switch (this.action) {
            case EDIT_INSERT:
                return vscode.TextEdit.insert(this.start, this.text);
            case EDIT_DELETE:
                return vscode.TextEdit.delete(new vscode.Range(this.start, this.end));
            case EDIT_REPLACE:
                return vscode.TextEdit.replace(new vscode.Range(this.start, this.end), this.text);
        }
    };
    return Edit;
})();
function computeEdits(from, to) {
    var d = new dmp.diff_match_patch();
    var diffs = d.diff_main(from, to);
    var line = 0;
    var character = 0;
    var edits = [];
    var edit = null;
    for (var _i = 0; _i < diffs.length; _i++) {
        var _a = diffs[_i], diffKind = _a[0], diffText = _a[1];
        var start = new vscode.Position(line, character);
        // Compute the line/character after the diff is applied.
        for (var _b = 0; _b < diffText.length; _b++) {
            var c = diffText[_b];
            if (c == '\n') {
                character = 0;
                line++;
            }
            else {
                character++;
            }
        }
        switch (diffKind) {
            case dmp.DIFF_DELETE:
                if (edit == null) {
                    edit = new Edit(EDIT_DELETE, start);
                }
                else if (edit.action != EDIT_DELETE) {
                    throw new Error("cannot format due to an internal error.");
                }
                edit.end = new vscode.Position(line, character);
                break;
            case dmp.DIFF_INSERT:
                if (edit == null) {
                    edit = new Edit(EDIT_INSERT, start);
                }
                else if (edit.action == EDIT_DELETE) {
                    edit.action = EDIT_REPLACE;
                }
                // insert and replace edits are all relative to the original state
                // of the document, so inserts should reset the current line/character
                // position to the start.		
                line = start.line;
                character = start.character;
                edit.text += diffText;
                break;
            case dmp.DIFF_EQUAL:
                if (edit != null) {
                    edits.push(edit.apply());
                    edit = null;
                }
                break;
        }
    }
    if (edit != null) {
        edits.push(edit.apply());
    }
    return edits;
}
exports.computeEdits = computeEdits;
//# sourceMappingURL=diff.js.map