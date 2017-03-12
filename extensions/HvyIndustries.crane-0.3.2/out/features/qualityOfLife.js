/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class QualityOfLife {
    constructor() {
        let subscriptions = [];
        vscode.workspace.onDidChangeTextDocument((e) => this.onChangeTextHandler(e.document), null, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(editor => { this.onChangeEditorHandler(editor); }, null, subscriptions);
        this.disposable = vscode.Disposable.from(...subscriptions);
        this.todoCommentDecoration = vscode.window.createTextEditorDecorationType({
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            color: "rgba(91, 199, 235, 1)",
            overviewRulerColor: 'rgba(144, 195, 212, 0.7)' // Light Blue
        });
        this.styleTodoComments();
    }
    onChangeEditorHandler(editor) {
        this.styleTodoComments();
    }
    onChangeTextHandler(textDocument) {
        // Style todo comments as blue (+ add marker in sidebar)
        this.styleTodoComments();
    }
    styleTodoComments() {
        var editor = vscode.window.activeTextEditor;
        if (editor == null)
            return;
        // Reset any existing todo style decorations
        editor.setDecorations(this.todoCommentDecoration, []);
        var matchedLines = [];
        // Parse document searching for regex match
        for (var i = 0; i < editor.document.lineCount; i++) {
            var line = editor.document.lineAt(i);
            var regex = /(\/\/|#)(\stodo|todo)/ig;
            var result = regex.exec(line.text);
            if (result != null) {
                var lineOption = { range: new vscode.Range(i, result.index, i, 99999) };
                matchedLines.push(lineOption);
            }
        }
        editor.setDecorations(this.todoCommentDecoration, matchedLines);
    }
    dispose() {
        this.disposable.dispose();
    }
}
exports.default = QualityOfLife;
//# sourceMappingURL=qualityOfLife.js.map