'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const comparers_1 = require("./comparers");
const constants_1 = require("./constants");
class BlameabilityTracker extends vscode_1.Disposable {
    constructor(git) {
        super(() => this.dispose());
        this.git = git;
        this._onDidChange = new vscode_1.EventEmitter();
        const subscriptions = [];
        subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(this._onActiveTextEditorChanged, this));
        subscriptions.push(vscode_1.workspace.onDidSaveTextDocument(this._onTextDocumentSaved, this));
        subscriptions.push(this.git.onDidBlameFail(this._onBlameFailed, this));
        this._disposable = vscode_1.Disposable.from(...subscriptions);
        this._onActiveTextEditorChanged(vscode_1.window.activeTextEditor);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    dispose() {
        this._disposable && this._disposable.dispose();
        this._documentChangeDisposable && this._documentChangeDisposable.dispose();
    }
    _onActiveTextEditorChanged(editor) {
        this._editor = editor;
        let blameable = editor && editor.document && !editor.document.isDirty;
        if (blameable) {
            blameable = this.git.getBlameability(editor.document.fileName);
        }
        this._subscribeToDocumentChanges();
        this.updateBlameability(blameable, true);
    }
    _onBlameFailed(key) {
        const fileName = this._editor && this._editor.document && this._editor.document.fileName;
        if (!fileName || key !== this.git.getCacheEntryKey(fileName))
            return;
        this.updateBlameability(false);
    }
    _onTextDocumentChanged(e) {
        if (!comparers_1.TextDocumentComparer.equals(this._editor && this._editor.document, e && e.document))
            return;
        setTimeout(() => this.updateBlameability(!e.document.isDirty), 1);
    }
    _onTextDocumentSaved(e) {
        if (!comparers_1.TextDocumentComparer.equals(this._editor && this._editor.document, e))
            return;
        this.updateBlameability(!e.isDirty);
    }
    _subscribeToDocumentChanges() {
        this._unsubscribeToDocumentChanges();
        this._documentChangeDisposable = vscode_1.workspace.onDidChangeTextDocument(this._onTextDocumentChanged, this);
    }
    _unsubscribeToDocumentChanges() {
        this._documentChangeDisposable && this._documentChangeDisposable.dispose();
        this._documentChangeDisposable = undefined;
    }
    updateBlameability(blameable, force = false) {
        if (!force && this._isBlameable === blameable)
            return;
        vscode_1.commands.executeCommand(constants_1.BuiltInCommands.SetContext, 'gitlens:isBlameable', blameable);
        this._onDidChange.fire({
            blameable: blameable,
            editor: this._editor
        });
    }
}
exports.BlameabilityTracker = BlameabilityTracker;
//# sourceMappingURL=blameabilityTracker.js.map