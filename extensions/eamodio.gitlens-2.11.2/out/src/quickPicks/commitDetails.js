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
const commands_1 = require("../commands");
const gitProvider_1 = require("../gitProvider");
const gitQuickPicks_1 = require("./gitQuickPicks");
const quickPicks_1 = require("./quickPicks");
const moment = require("moment");
const path = require("path");
class OpenCommitFilesCommandQuickPickItem extends quickPicks_1.OpenFilesCommandQuickPickItem {
    constructor(commit, item) {
        const repoPath = commit.repoPath;
        const uris = commit.fileStatuses.map(_ => gitProvider_1.GitProvider.toGitContentUri(commit.sha, _.fileName, repoPath, commit.originalFileName));
        super(uris, item || {
            label: `$(file-symlink-file) Open Changed Files`,
            description: `\u00a0 \u2014 \u00a0\u00a0 in \u00a0$(git-commit) ${commit.sha}`
        });
    }
}
exports.OpenCommitFilesCommandQuickPickItem = OpenCommitFilesCommandQuickPickItem;
class OpenCommitWorkingTreeFilesCommandQuickPickItem extends quickPicks_1.OpenFilesCommandQuickPickItem {
    constructor(commit, versioned = false, item) {
        const repoPath = commit.repoPath;
        const uris = commit.fileStatuses.map(_ => vscode_1.Uri.file(path.resolve(repoPath, _.fileName)));
        super(uris, item || {
            label: `$(file-symlink-file) Open Changed Working Files`,
            description: undefined
        });
    }
}
exports.OpenCommitWorkingTreeFilesCommandQuickPickItem = OpenCommitWorkingTreeFilesCommandQuickPickItem;
class CommitDetailsQuickPick {
    static show(commit, uri, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = commit.fileStatuses.map(fs => new gitQuickPicks_1.CommitWithFileStatusQuickPickItem(commit, fs.fileName, fs.status));
            let index = 0;
            items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Sha to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 ${commit.sha}`
            }, commands_1.Commands.CopyShaToClipboard, [uri, commit.sha]));
            items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Message to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 ${commit.message}`
            }, commands_1.Commands.CopyMessageToClipboard, [uri, commit.sha, commit.message]));
            items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(git-compare) Directory Compare with Previous Commit`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.previousSha || `${commit.sha}^`} \u00a0 $(git-compare) \u00a0 $(git-commit) ${commit.sha}`
            }, commands_1.Commands.DiffDirectory, [commit.uri, commit.previousSha || `${commit.sha}^`, commit.sha]));
            items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(git-compare) Directory Compare with Working Tree`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha} \u00a0 $(git-compare) \u00a0 $(file-directory) Working Tree`
            }, commands_1.Commands.DiffDirectory, [uri, commit.sha]));
            items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                label: `Changed Files`,
                description: null
            }, commands_1.Commands.ShowQuickCommitDetails, [uri, commit.sha, commit, goBackCommand]));
            items.push(new OpenCommitFilesCommandQuickPickItem(commit));
            items.push(new OpenCommitWorkingTreeFilesCommandQuickPickItem(commit));
            if (goBackCommand) {
                items.splice(0, 0, goBackCommand);
            }
            yield commands_1.Keyboard.instance.enterScope(['left', goBackCommand]);
            const pick = yield vscode_1.window.showQuickPick(items, {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: `${commit.sha} \u2022 ${commit.author}, ${moment(commit.date).fromNow()} \u2022 ${commit.message}`,
                ignoreFocusOut: quickPicks_1.getQuickPickIgnoreFocusOut(),
                onDidSelectItem: (item) => {
                    commands_1.Keyboard.instance.setKeyCommand('right', item);
                }
            });
            yield commands_1.Keyboard.instance.exitScope();
            return pick;
        });
    }
}
exports.CommitDetailsQuickPick = CommitDetailsQuickPick;
//# sourceMappingURL=commitDetails.js.map