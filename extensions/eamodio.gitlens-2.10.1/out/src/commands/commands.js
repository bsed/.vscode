'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
exports.Commands = {
    CopyMessageToClipboard: 'gitlens.copyMessageToClipboard',
    CopyShaToClipboard: 'gitlens.copyShaToClipboard',
    DiffWithPrevious: 'gitlens.diffWithPrevious',
    DiffLineWithPrevious: 'gitlens.diffLineWithPrevious',
    DiffWithWorking: 'gitlens.diffWithWorking',
    DiffLineWithWorking: 'gitlens.diffLineWithWorking',
    ShowBlame: 'gitlens.showBlame',
    ShowBlameHistory: 'gitlens.showBlameHistory',
    ShowFileHistory: 'gitlens.showFileHistory',
    ShowQuickCommitDetails: 'gitlens.showQuickCommitDetails',
    ShowQuickFileHistory: 'gitlens.showQuickFileHistory',
    ShowQuickRepoHistory: 'gitlens.showQuickRepoHistory',
    ShowQuickRepoStatus: 'gitlens.showQuickRepoStatus',
    ToggleBlame: 'gitlens.toggleBlame',
    ToggleCodeLens: 'gitlens.toggleCodeLens'
};
class Command extends vscode_1.Disposable {
    constructor(command) {
        super(() => this.dispose());
        this._disposable = vscode_1.commands.registerCommand(command, this.execute, this);
    }
    dispose() {
        this._disposable && this._disposable.dispose();
    }
}
exports.Command = Command;
class EditorCommand extends vscode_1.Disposable {
    constructor(command) {
        super(() => this.dispose());
        this._disposable = vscode_1.commands.registerTextEditorCommand(command, this.execute, this);
    }
    dispose() {
        this._disposable && this._disposable.dispose();
    }
}
exports.EditorCommand = EditorCommand;
class ActiveEditorCommand extends vscode_1.Disposable {
    constructor(command) {
        super(() => this.dispose());
        this._disposable = vscode_1.commands.registerCommand(command, this._execute, this);
    }
    dispose() {
        this._disposable && this._disposable.dispose();
    }
    _execute(...args) {
        return this.execute(vscode_1.window.activeTextEditor, ...args);
    }
}
exports.ActiveEditorCommand = ActiveEditorCommand;
//# sourceMappingURL=commands.js.map