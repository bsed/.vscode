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
    execute(editor, uri, sha, commit, goBackCommand) {
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
                    commit = blame.commit;
                }
                catch (ex) {
                    logger_1.Logger.error('[GitLens.ShowQuickCommitDetailsCommand]', `getBlameForLine(${blameline})`, ex);
                    return vscode_1.window.showErrorMessage(`Unable to show commit details. See output channel for more details`);
                }
            }
            try {
                if (!commit || !(commit instanceof gitProvider_1.GitLogCommit) || commit.type !== 'repo') {
                    let log = yield this.git.getLogForRepo(repoPath, sha, 2);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to show commit details`);
                    commit = system_1.Iterables.first(log.commits.values());
                }
                if (!goBackCommand) {
                    goBackCommand = new quickPicks_1.CommandQuickPickItem({
                        label: `go back \u21A9`,
                        description: `\u00a0 \u2014 \u00a0\u00a0 to repository history`
                    }, commands_1.Commands.ShowQuickRepoHistory, [new gitProvider_1.GitUri(commit.uri, commit)]);
                }
                const pick = yield quickPicks_1.CommitDetailsQuickPick.show(commit, uri, goBackCommand);
                if (!pick)
                    return undefined;
                if (!(pick instanceof quickPicks_1.CommitWithFileStatusQuickPickItem)) {
                    return pick.execute();
                }
                return vscode_1.commands.executeCommand(commands_1.Commands.ShowQuickCommitFileDetails, pick.gitUri, pick.sha, undefined, new quickPicks_1.CommandQuickPickItem({
                    label: `go back \u21A9`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 to details of \u00a0$(git-commit) ${pick.sha}`
                }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), sha, commit, goBackCommand]));
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