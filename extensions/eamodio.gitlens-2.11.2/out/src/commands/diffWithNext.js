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
const constants_1 = require("../constants");
const gitProvider_1 = require("../gitProvider");
const logger_1 = require("../logger");
const path = require("path");
class DiffWithNextCommand extends commands_1.ActiveEditorCommand {
    constructor(git) {
        super(commands_1.Commands.DiffWithNext);
        this.git = git;
    }
    execute(editor, uri, commit, rangeOrLine) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                if (!editor || !editor.document)
                    return undefined;
                uri = editor.document.uri;
            }
            let line = (editor && editor.selection.active.line) || 0;
            if (typeof rangeOrLine === 'number') {
                line = rangeOrLine || line;
                rangeOrLine = undefined;
            }
            if (!commit || !(commit instanceof gitProvider_1.GitLogCommit) || rangeOrLine instanceof vscode_1.Range) {
                const gitUri = yield gitProvider_1.GitUri.fromUri(uri, this.git);
                try {
                    if (!gitUri.sha) {
                        if (yield this.git.isFileUncommitted(gitUri.fsPath, gitUri.repoPath)) {
                            return vscode_1.commands.executeCommand(commands_1.Commands.DiffWithWorking, uri);
                        }
                    }
                    const sha = (commit && commit.sha) || gitUri.sha;
                    const log = yield this.git.getLogForFile(gitUri.fsPath, undefined, gitUri.repoPath, rangeOrLine, sha ? undefined : 2);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to open diff. File is probably not under source control`);
                    commit = (sha && log.commits.get(sha)) || system_1.Iterables.first(log.commits.values());
                }
                catch (ex) {
                    logger_1.Logger.error('[GitLens.DiffWithNextCommand]', `getLogForFile(${gitUri.fsPath})`, ex);
                    return vscode_1.window.showErrorMessage(`Unable to open diff. See output channel for more details`);
                }
            }
            if (!commit.nextSha) {
                return vscode_1.commands.executeCommand(commands_1.Commands.DiffWithWorking, uri);
            }
            try {
                const [rhs, lhs] = yield Promise.all([
                    this.git.getVersionedFile(commit.nextUri.fsPath, commit.repoPath, commit.nextSha),
                    this.git.getVersionedFile(commit.uri.fsPath, commit.repoPath, commit.sha)
                ]);
                yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.Diff, vscode_1.Uri.file(lhs), vscode_1.Uri.file(rhs), `${path.basename(commit.uri.fsPath)} (${commit.sha}) ↔ ${path.basename(commit.nextUri.fsPath)} (${commit.nextSha})`);
                return yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.RevealLine, { lineNumber: line, at: 'center' });
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.DiffWithNextCommand]', 'getVersionedFile', ex);
                return vscode_1.window.showErrorMessage(`Unable to open diff. See output channel for more details`);
            }
        });
    }
}
exports.DiffWithNextCommand = DiffWithNextCommand;
//# sourceMappingURL=diffWithNext.js.map