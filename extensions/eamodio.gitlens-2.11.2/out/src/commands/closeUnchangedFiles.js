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
const activeEditorTracker_1 = require("../activeEditorTracker");
const commands_1 = require("./commands");
const comparers_1 = require("../comparers");
const logger_1 = require("../logger");
const path = require("path");
class CloseUnchangedFilesCommand extends commands_1.ActiveEditorCommand {
    constructor(git, repoPath) {
        super(commands_1.Commands.CloseUnchangedFiles);
        this.git = git;
        this.repoPath = repoPath;
    }
    execute(editor, uri, uris) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                uri = editor && editor.document && editor.document.uri;
            }
            try {
                if (!uris) {
                    const repoPath = yield this.git.getRepoPathFromUri(uri, this.repoPath);
                    if (!repoPath)
                        return vscode_1.window.showWarningMessage(`Unable to close unchanged files`);
                    const statuses = yield this.git.getStatusesForRepo(repoPath);
                    if (!statuses)
                        return vscode_1.window.showWarningMessage(`Unable to close unchanged files`);
                    uris = statuses.map(_ => vscode_1.Uri.file(path.resolve(repoPath, _.fileName)));
                }
                const editorTracker = new activeEditorTracker_1.ActiveEditorTracker();
                let active = vscode_1.window.activeTextEditor;
                let editor = active;
                do {
                    if (editor) {
                        if ((editor.document && editor.document.isDirty) ||
                            uris.some(_ => comparers_1.UriComparer.equals(_, editor.document && editor.document.uri))) {
                            if (!active) {
                                active = editor;
                            }
                            editor = yield editorTracker.awaitNext(500);
                        }
                        else {
                            if (active === editor) {
                                active = undefined;
                            }
                            editor = yield editorTracker.awaitClose(500);
                        }
                    }
                    else {
                        if (active === editor) {
                            active = undefined;
                        }
                        editor = yield editorTracker.awaitClose(500);
                    }
                } while ((!active && !editor) || !comparers_1.TextEditorComparer.equals(active, editor, { useId: true, usePosition: true }));
                editorTracker.dispose();
                return undefined;
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.CloseUnchangedFilesCommand]', ex);
                return vscode_1.window.showErrorMessage(`Unable to close unchanged files. See output channel for more details`);
            }
        });
    }
}
exports.CloseUnchangedFilesCommand = CloseUnchangedFilesCommand;
//# sourceMappingURL=closeUnchangedFiles.js.map