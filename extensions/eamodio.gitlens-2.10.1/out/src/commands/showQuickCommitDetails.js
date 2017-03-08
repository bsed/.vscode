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
class ShowQuickCommitDetailsCommand extends commands_1.ActiveEditorCommand {
    constructor(git) {
        super(commands_1.Commands.ShowQuickCommitDetails);
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
                        return vscode_1.window.showWarningMessage(`Unable to show commit details. File is probably not under source control`);
                    sha = blame.commit.isUncommitted ? blame.commit.previousSha : blame.commit.sha;
                    repoPath = blame.commit.repoPath;
                    return vscode_1.commands.executeCommand(commands_1.Commands.ShowQuickFileHistory, uri, undefined, blame.commit);
                }
                catch (ex) {
                    logger_1.Logger.error('[GitLens.ShowQuickCommitDetails]', `getBlameForLine(${blameline})`, ex);
                    return vscode_1.window.showErrorMessage(`Unable to show commit details. See output channel for more details`);
                }
            }
            try {
                let pick;
                let alreadyPickedCommit = !!commit;
                let workingFileName;
                if (!alreadyPickedCommit) {
                    let log = yield this.git.getLogForRepo(repoPath, sha, 0);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to show commit details`);
                    commit = system_1.Iterables.first(log.commits.values());
                    pick = yield quickPicks_1.CommitDetailsQuickPick.show(commit, uri, goBackCommand);
                    if (!pick)
                        return undefined;
                    if (!(pick instanceof quickPicks_1.CommitWithFileStatusQuickPickItem)) {
                        return pick.execute();
                    }
                    const workingCommit = yield this.git.findMostRecentCommitForFile(pick.uri.fsPath, pick.sha);
                    workingFileName = !workingCommit ? pick.fileName : undefined;
                    log = yield this.git.getLogForFile(pick.gitUri.fsPath, pick.sha, undefined, undefined, 2);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to show commit details`);
                    commit = system_1.Iterables.find(log.commits.values(), c => c.sha === commit.sha);
                    uri = pick.gitUri || uri;
                }
                else {
                    const workingCommit = yield this.git.findMostRecentCommitForFile(commit.uri.fsPath, commit.sha);
                    workingFileName = !workingCommit ? commit.fileName : undefined;
                }
                pick = yield quickPicks_1.CommitFileDetailsQuickPick.show(this.git, commit, workingFileName, uri, new quickPicks_1.CommandQuickPickItem({
                    label: `go back \u21A9`,
                    description: null
                }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), sha, commit, goBackCommand, options]), alreadyPickedCommit
                    ? goBackCommand
                    : new quickPicks_1.CommandQuickPickItem({
                        label: `go back \u21A9`,
                        description: null
                    }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), sha, undefined, goBackCommand, options]), { showFileHistory: options.showFileHistory });
                if (!pick)
                    return undefined;
                if (pick instanceof quickPicks_1.CommandQuickPickItem) {
                    return pick.execute();
                }
                return undefined;
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.ShowQuickCommitDetailsCommand]', ex);
                return vscode_1.window.showErrorMessage(`Unable to show commit details. See output channel for more details`);
            }
        });
    }
}
exports.ShowQuickCommitDetailsCommand = ShowQuickCommitDetailsCommand;
//# sourceMappingURL=showQuickCommitDetails.js.map