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
const path = require("path");
class ShowQuickFileHistoryCommand extends commands_1.ActiveEditorCommand {
    constructor(git) {
        super(commands_1.Commands.ShowQuickFileHistory);
        this.git = git;
    }
    execute(editor, uri, maxCount, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                uri = editor && editor.document && editor.document.uri;
            }
            if (!uri) {
                return vscode_1.commands.executeCommand(commands_1.Commands.ShowQuickRepoHistory);
            }
            const gitUri = yield gitProvider_1.GitUri.fromUri(uri, this.git);
            if (maxCount == null) {
                maxCount = this.git.config.advanced.maxQuickHistory;
            }
            try {
                const log = yield this.git.getLogForFile(gitUri.fsPath, gitUri.sha, gitUri.repoPath, undefined, maxCount);
                if (!log)
                    return vscode_1.window.showWarningMessage(`Unable to show file history. File is probably not under source control`);
                let pick = yield quickPicks_1.FileHistoryQuickPick.show(log, uri, gitUri.sha, maxCount, this.git.config.advanced.maxQuickHistory, goBackCommand);
                if (!pick)
                    return undefined;
                if (pick instanceof quickPicks_1.CommandQuickPickItem) {
                    return pick.execute();
                }
                return vscode_1.commands.executeCommand(commands_1.Commands.ShowQuickCommitFileDetails, new gitProvider_1.GitUri(pick.commit.uri, pick.commit), pick.commit.sha, pick.commit, new quickPicks_1.CommandQuickPickItem({
                    label: `go back \u21A9`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 to history of \u00a0$(file-text) ${path.basename(pick.commit.fileName)}`
                }, commands_1.Commands.ShowQuickFileHistory, [uri, maxCount, goBackCommand]), { showFileHistory: false });
            }
            catch (ex) {
                logger_1.Logger.error('[GitLens.ShowQuickFileHistoryCommand]', 'getLogLocations', ex);
                return vscode_1.window.showErrorMessage(`Unable to show file history. See output channel for more details`);
            }
        });
    }
}
exports.ShowQuickFileHistoryCommand = ShowQuickFileHistoryCommand;
//# sourceMappingURL=showQuickFileHistory.js.map