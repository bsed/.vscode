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
const commands_1 = require("./commands");
const gitProvider_1 = require("../gitProvider");
const logger_1 = require("../logger");
const quickPicks_1 = require("../quickPicks");
class ShowQuickRepoHistoryCommand extends commands_1.ActiveEditorCommand {
    constructor(git, repoPath) {
        super(commands_1.Commands.ShowQuickRepoHistory);
        this.git = git;
        this.repoPath = repoPath;
    }
    execute(editor, uri, maxCount, commit, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                uri = editor && editor.document && editor.document.uri;
            }
            if (maxCount == null) {
                maxCount = this.git.config.advanced.maxQuickHistory;
            }
            try {
                let repoPath;
                if (uri instanceof vscode_1.Uri) {
                    const gitUri = yield gitProvider_1.GitUri.fromUri(uri, this.git);
                    repoPath = gitUri.repoPath;
                    if (!repoPath) {
                        repoPath = yield this.git.getRepoPathFromFile(gitUri.fsPath);
                    }
                }
                if (!repoPath) {
                    repoPath = this.repoPath;
                }
                if (!repoPath)
                    return vscode_1.window.showWarningMessage(`Unable to show repository history`);
                if (!commit) {
                    const log = yield this.git.getLogForRepo(repoPath, undefined, maxCount);
                    if (!log)
                        return vscode_1.window.showWarningMessage(`Unable to show repository history`);
                    const pick = yield quickPicks_1.RepoHistoryQuickPick.show(log, uri, maxCount, this.git.config.advanced.maxQuickHistory, goBackCommand);
                    if (!pick)
                        return undefined;
                    if (pick instanceof quickPicks_1.CommandQuickPickItem) {
                        return pick.execute();
                    }
                    commit = pick.commit;
                }
                return vscode_1.commands.executeCommand(commands_1.Commands.ShowQuickCommitDetails, new gitProvider_1.GitUri(commit.uri, commit), commit.sha, undefined, new quickPicks_1.CommandQuickPickItem({
                    label: `go back \u21A9`,
                    description: null
                }, commands_1.Commands.ShowQuickRepoHistory, [uri, maxCount, undefined, goBackCommand]));
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.ShowQuickRepoHistoryCommand]', ex);
                return vscode_1.window.showErrorMessage(`Unable to show repository history. See output channel for more details`);
            }
        });
    }
}
exports.ShowQuickRepoHistoryCommand = ShowQuickRepoHistoryCommand;
//# sourceMappingURL=showQuickRepoHistory.js.map