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
const commands_1 = require("../commands");
const gitProvider_1 = require("../gitProvider");
const quickPicks_1 = require("./quickPicks");
const moment = require("moment");
const path = require("path");
class OpenCommitFileCommandQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(commit, item) {
        const uri = gitProvider_1.GitProvider.toGitContentUri(commit);
        super(uri, item || {
            label: `$(file-symlink-file) Open File`,
            description: `\u00a0 \u2014 \u00a0\u00a0 ${path.basename(commit.fileName)} in \u00a0$(git-commit) ${commit.sha}`
        });
    }
}
exports.OpenCommitFileCommandQuickPickItem = OpenCommitFileCommandQuickPickItem;
class OpenCommitWorkingTreeFileCommandQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(commit, item) {
        const uri = vscode_1.Uri.file(path.resolve(commit.repoPath, commit.fileName));
        super(uri, item || {
            label: `$(file-symlink-file) Open Working File`,
            description: `\u00a0 \u2014 \u00a0\u00a0 ${path.basename(commit.fileName)}`
        });
    }
}
exports.OpenCommitWorkingTreeFileCommandQuickPickItem = OpenCommitWorkingTreeFileCommandQuickPickItem;
class CommitFileDetailsQuickPick {
    static show(git, commit, workingFileName, uri, goBackCommand, currentCommand, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            const workingName = (workingFileName && path.basename(workingFileName)) || path.basename(commit.fileName);
            const isUncommitted = commit.isUncommitted;
            if (isUncommitted) {
                const log = yield git.getLogForFile(commit.uri.fsPath, undefined, undefined, undefined, 2);
                if (!log)
                    return undefined;
                commit = system_1.Iterables.first(log.commits.values());
            }
            if (!options.showFileHistory) {
                items.push(new quickPicks_1.CommandQuickPickItem({
                    label: `$(git-commit) Show Commit Details`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha}`
                }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), commit.sha, commit, currentCommand]));
            }
            if (commit.previousSha) {
                items.push(new quickPicks_1.CommandQuickPickItem({
                    label: `$(git-compare) Compare with Previous Commit`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.previousSha} \u00a0 $(git-compare) \u00a0 $(git-commit) ${commit.sha}`
                }, commands_1.Commands.DiffWithPrevious, [commit.uri, commit]));
            }
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(git-compare) Compare with Working Tree`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha} \u00a0 $(git-compare) \u00a0 $(file-text) ${workingName}`
            }, commands_1.Commands.DiffWithWorking, [uri, commit]));
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Sha to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 ${commit.sha}`
            }, commands_1.Commands.CopyShaToClipboard, [uri, commit.sha]));
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Message to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 ${commit.message}`
            }, commands_1.Commands.CopyMessageToClipboard, [uri, commit.sha, commit.message]));
            items.push(new OpenCommitFileCommandQuickPickItem(commit));
            items.push(new OpenCommitWorkingTreeFileCommandQuickPickItem(commit));
            if (workingFileName && options.showFileHistory) {
                items.push(new quickPicks_1.CommandQuickPickItem({
                    label: `$(history) Show File History`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 of ${path.basename(commit.fileName)}`
                }, commands_1.Commands.ShowQuickFileHistory, [commit.uri, undefined, currentCommand]));
            }
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(history) Show ${workingFileName && options.showFileHistory ? 'Previous ' : ''}File History`,
                description: `\u00a0 \u2014 \u00a0\u00a0 of ${path.basename(commit.fileName)} \u00a0\u2022\u00a0 starting from \u00a0$(git-commit) ${commit.sha}`
            }, commands_1.Commands.ShowQuickFileHistory, [new gitProvider_1.GitUri(commit.uri, commit), undefined, currentCommand]));
            if (goBackCommand) {
                items.splice(0, 0, goBackCommand);
            }
            yield commands_1.Keyboard.instance.enterScope(['left', goBackCommand]);
            const pick = yield vscode_1.window.showQuickPick(items, {
                matchOnDescription: true,
                placeHolder: `${commit.getFormattedPath()} \u2022 ${isUncommitted ? 'Uncommitted \u21E8 ' : ''}${commit.sha} \u2022 ${commit.author}, ${moment(commit.date).fromNow()} \u2022 ${commit.message}`,
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
exports.CommitFileDetailsQuickPick = CommitFileDetailsQuickPick;
//# sourceMappingURL=commitFileDetails.js.map