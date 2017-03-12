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
const quickPicks_1 = require("../quickPicks");
const path = require("path");
class ShowQuickCommitFileDetailsCommand extends commands_1.ActiveEditorCommand {
    constructor(git) {
        super(commands_1.Commands.ShowQuickCommitFileDetails);
        this.git = git;
    }
    execute(editor, uri, sha, commit, goBackCommand, options = { showFileHistory: true }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                if (!editor || !editor.document)
                    return undefined;
                uri = editor.document.uri;
            }
            const gitUri = yield gitProvider_1.GitUri.fromUri(uri, this.git);
            let repoPath = gitUri.repoPath;
            if (!sha) {
                if (!editor)
                    return undefined;
                const blameline = editor.selection.active.line - gitUri.offset;
                if (blameline < 0)
                    return undefined;
                try {
                    const blame = yield this.git.getBlameForLine(gitUri.fsPath, blameline, gitUri.sha, gitUri.repoPath);
                    if (!blame)
                        return vscode_1.window.showWarningMessage(`Unable to show commit file details. File is probably not under source control`);
                    sha = blame.commit.isUncommitted ? blame.commit.previousSha : blame.commit.sha;
                    repoPath = blame.commit.repoPath;
                    commit = blame.commit;
                }
                catch (ex) {
                    logger_1.Logger.error('[GitLens.ShowQuickCommitFileDetailsCommand]', `getBlameForLine(${blameline})`, ex);
                    return vscode_1.window.showErrorMessage(`Unable to show commit file details. See output channel for more details`);
                }
            }
            try {
                if (!commit || ((commit instanceof gitProvider_1.GitLogCommit) && commit.type !== 'file')) {
                    let log = yield this.git.getLogForFile(uri.fsPath, sha, undefined, undefined, 2);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to show commit file details`);
                    commit = system_1.Iterables.find(log.commits.values(), c => c.sha === sha);
                }
                const workingCommit = yield this.git.findMostRecentCommitForFile(commit.uri.fsPath, commit.sha);
                const workingFileName = !workingCommit ? commit.fileName : undefined;
                if (!goBackCommand) {
                    goBackCommand = new quickPicks_1.CommandQuickPickItem({
                        label: `go back \u21A9`,
                        description: `\u00a0 \u2014 \u00a0\u00a0 to details of \u00a0$(git-commit) ${sha}`
                    }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), sha, commit]);
                }
                const pick = yield quickPicks_1.CommitFileDetailsQuickPick.show(this.git, commit, workingFileName, uri, goBackCommand, new quickPicks_1.CommandQuickPickItem({
                    label: `go back \u21A9`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 to details of \u00a0$(file-text) ${path.basename(commit.fileName)} in \u00a0$(git-commit) ${sha}`
                }, commands_1.Commands.ShowQuickCommitFileDetails, [new gitProvider_1.GitUri(commit.uri, commit), sha, commit, goBackCommand, options]), { showFileHistory: options.showFileHistory });
                if (!pick)
                    return undefined;
                if (pick instanceof quickPicks_1.CommandQuickPickItem) {
                    return pick.execute();
                }
                return undefined;
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.ShowQuickCommitFileDetailsCommand]', ex);
                return vscode_1.window.showErrorMessage(`Unable to show commit file details. See output channel for more details`);
            }
        });
    }
}
exports.ShowQuickCommitFileDetailsCommand = ShowQuickCommitFileDetailsCommand;
//# sourceMappingURL=showQuickCommitFileDetails.js.map