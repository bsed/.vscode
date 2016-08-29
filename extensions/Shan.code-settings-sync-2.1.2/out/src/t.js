/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
const vscode = require('vscode');
function activate(context) {
    let previewUri = vscode.Uri.parse('css-preview://authority/css-preview');
    class TextDocumentContentProvider {
        constructor() {
            this._onDidChange = new vscode.EventEmitter();
        }
        provideTextDocumentContent(uri) {
            return "text";
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        update(uri) {
            this._onDidChange.fire(uri);
        }
    }
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('css-preview', provider);
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });
    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    });
    let disposable = vscode.commands.registerCommand('extension.showCssPropertyPreview', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'CSS Property Preview').then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });
    let highlight = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(200,200,200,.35)' });
    vscode.commands.registerCommand('extension.revealCssRule', (uri, propStart, propEnd) => {
        for (let editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() === uri.toString()) {
                let start = editor.document.positionAt(propStart);
                let end = editor.document.positionAt(propEnd + 1);
                editor.setDecorations(highlight, [new vscode.Range(start, end)]);
                setTimeout(() => editor.setDecorations(highlight, []), 1500);
            }
        }
    });
    context.subscriptions.push(disposable, registration);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=t.js.map