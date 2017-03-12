'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
exports.Commands = {
    CloseUnchangedFiles: 'gitlens.closeUnchangedFiles',
    CopyMessageToClipboard: 'gitlens.copyMessageToClipboard',
    CopyShaToClipboard: 'gitlens.copyShaToClipboard',
    DiffDirectory: 'gitlens.diffDirectory',
    DiffWithNext: 'gitlens.diffWithNext',
    DiffWithPrevious: 'gitlens.diffWithPrevious',
    DiffLineWithPrevious: 'gitlens.diffLineWithPrevious',
    DiffWithWorking: 'gitlens.diffWithWorking',
    DiffLineWithWorking: 'gitlens.diffLineWithWorking',
    OpenChangedFiles: 'gitlens.openChangedFiles',
    ShowBlame: 'gitlens.showBlame',
    ShowBlameHistory: 'gitlens.showBlameHistory',
    ShowFileHistory: 'gitlens.showFileHistory',
    ShowQuickCommitDetails: 'gitlens.showQuickCommitDetails',
    ShowQuickCommitFileDetails: 'gitlens.showQuickCommitFileDetails',
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
function openEditor(uri, pinned = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!pinned)
                return yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.Open, uri);
            const document = yield vscode_1.workspace.openTextDocument(uri);
            return vscode_1.window.showTextDocument(document, (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.viewColumn) || 1, true);
        }
        catch (ex) {
            return undefined;
        }
    });
}
exports.openEditor = openEditor;
//# sourceMappingURL=commands.js.map