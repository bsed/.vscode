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
const system_1 = require("../system");
const vscode_1 = require("vscode");
const commands_1 = require("./commands");
const gitProvider_1 = require("../gitProvider");
const logger_1 = require("../logger");
const copy_paste_1 = require("copy-paste");
class CopyMessageToClipboardCommand extends commands_1.ActiveEditorCommand {
    constructor(git, repoPath) {
        super(commands_1.Commands.CopyMessageToClipboard);
        this.git = git;
        this.repoPath = repoPath;
    }
    execute(editor, uri, sha, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                uri = editor && editor.document && editor.document.uri;
            }
            try {
                if (!uri) {
                    const log = yield this.git.getLogForRepo(this.repoPath, undefined, 1);
                    if (!log)
                        return undefined;
                    message = system_1.Iterables.first(log.commits.values()).message;
                    copy_paste_1.copy(message);
                    return undefined;
                }
                const gitUri = yield gitProvider_1.GitUri.fromUri(uri, this.git);
                if (!message) {
                    if (!sha) {
                        if (editor && editor.document && editor.document.isDirty)
                            return undefined;
                        const line = (editor && editor.selection.active.line) || gitUri.offset;
                        const blameline = line - gitUri.offset;
                        if (blameline < 0)
                            return undefined;
                        try {
                            const blame = yield this.git.getBlameForLine(gitUri.fsPath, blameline, gitUri.sha, gitUri.repoPath);
                            if (!blame)
                                return undefined;
                            if (blame.commit.isUncommitted)
                                return undefined;
                            sha = blame.commit.sha;
                            if (!gitUri.repoPath) {
                                gitUri.repoPath = blame.commit.repoPath;
                            }
                        }
                        catch (ex) {
                            logger_1.Logger.error('[GitLens.CopyMessageToClipboardCommand]', `getBlameForLine(${blameline})`, ex);
                            return vscode_1.window.showErrorMessage(`Unable to copy message. See output channel for more details`);
                        }
                    }
                    const log = yield this.git.getLogForFile(gitUri.fsPath, sha, gitUri.repoPath, undefined, 1);
                    if (!log)
                        return undefined;
                    const commit = log.commits.get(sha);
                    if (!commit)
                        return undefined;
                    message = commit.message;
                }
                copy_paste_1.copy(message);
                return undefined;
            }
            catch (ex) {
                logger_1.Logger.error('GitLens.CopyMessageToClipboardCommand', ex);
                return vscode_1.window.showErrorMessage(`Unable to copy message. See output channel for more details`);
            }
        });
    }
}
exports.CopyMessageToClipboardCommand = CopyMessageToClipboardCommand;
//# sourceMappingURL=copyMessageToClipboard.js.map