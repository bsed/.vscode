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
const gitQuickPicks_1 = require("./gitQuickPicks");
exports.CommitWithFileStatusQuickPickItem = gitQuickPicks_1.CommitWithFileStatusQuickPickItem;
const quickPicks_1 = require("./quickPicks");
exports.CommandQuickPickItem = quickPicks_1.CommandQuickPickItem;
const moment = require("moment");
const path = require("path");
class OpenCommitFileCommandQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(commit, item) {
        const uri = gitProvider_1.GitProvider.toGitContentUri(commit);
        super(uri, item || {
            label: `$(file-symlink-file) Open File`,
            description: `\u00a0 \u2014 \u00a0\u00a0 as of \u00a0 $(git-commit) \u00a0 ${commit.sha} \u00a0\u2022\u00a0 ${commit.getFormattedPath()}`
        });
    }
}
exports.OpenCommitFileCommandQuickPickItem = OpenCommitFileCommandQuickPickItem;
class OpenCommitWorkingTreeFileCommandQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(commit, item) {
        const uri = vscode_1.Uri.file(path.resolve(commit.repoPath, commit.fileName));
        super(uri, item || {
            label: `$(file-symlink-file) Open Working File`,
            description: `\u00a0 \u2014 \u00a0\u00a0 ${commit.getFormattedPath()}`
        });
    }
}
exports.OpenCommitWorkingTreeFileCommandQuickPickItem = OpenCommitWorkingTreeFileCommandQuickPickItem;
class OpenCommitFilesCommandQuickPickItem extends quickPicks_1.OpenFilesCommandQuickPickItem {
    constructor(commit, item) {
        const repoPath = commit.repoPath;
        const uris = commit.fileStatuses.map(_ => gitProvider_1.GitProvider.toGitContentUri(commit.sha, _.fileName, repoPath, commit.originalFileName));
        super(uris, item || {
            label: `$(file-symlink-file) Open Files`,
            description: `\u00a0 \u2014 \u00a0\u00a0 as of \u00a0 $(git-commit) \u00a0 ${commit.sha}`
        });
    }
}
exports.OpenCommitFilesCommandQuickPickItem = OpenCommitFilesCommandQuickPickItem;
class OpenCommitWorkingTreeFilesCommandQuickPickItem extends quickPicks_1.OpenFilesCommandQuickPickItem {
    constructor(commit, versioned = false, item) {
        const repoPath = commit.repoPath;
        const uris = commit.fileStatuses.map(_ => vscode_1.Uri.file(path.resolve(repoPath, _.fileName)));
        super(uris, item || {
            label: `$(file-symlink-file) Open Working Files`,
            description: undefined
        });
    }
}
exports.OpenCommitWorkingTreeFilesCommandQuickPickItem = OpenCommitWorkingTreeFilesCommandQuickPickItem;
class CommitDetailsQuickPick {
    static show(commit, uri, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = commit.fileStatuses.map(fs => new gitQuickPicks_1.CommitWithFileStatusQuickPickItem(commit, fs.fileName, fs.status));
            items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Sha to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha}`
            }, commands_1.Commands.CopyShaToClipboard, [uri, commit.sha]));
            items.splice(1, 0, new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Message to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.message}`
            }, commands_1.Commands.CopyMessageToClipboard, [uri, commit.sha, commit.message]));
            items.splice(2, 0, new OpenCommitWorkingTreeFilesCommandQuickPickItem(commit));
            items.splice(3, 0, new OpenCommitFilesCommandQuickPickItem(commit));
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
class CommitFileDetailsQuickPick {
    static show(git, commit, workingFileName, uri, currentCommand, goBackCommand, options = {}) {
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
                label: `$(diff) Show Changed Files`,
                description: undefined,
                detail: `Shows all of the changed files in commit $(git-commit) ${commit.sha}`
            }, commands_1.Commands.ShowQuickCommitDetails, [new gitProvider_1.GitUri(commit.uri, commit), commit.sha, undefined, currentCommand]));
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Sha to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha}`
            }, commands_1.Commands.CopyShaToClipboard, [uri, commit.sha]));
            items.push(new quickPicks_1.CommandQuickPickItem({
                label: `$(clippy) Copy Commit Message to Clipboard`,
                description: `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.message}`
            }, commands_1.Commands.CopyMessageToClipboard, [uri, commit.sha, commit.message]));
            items.push(new OpenCommitWorkingTreeFileCommandQuickPickItem(commit));
            items.push(new OpenCommitFileCommandQuickPickItem(commit));
            if (options.showFileHistory) {
                if (workingFileName) {
                    items.push(new quickPicks_1.CommandQuickPickItem({
                        label: `$(history) Show File History`,
                        description: undefined,
                        detail: `Shows the commit history of the file, starting at the most recent commit`
                    }, commands_1.Commands.ShowQuickFileHistory, [commit.uri, undefined, undefined, currentCommand]));
                }
                items.push(new quickPicks_1.CommandQuickPickItem({
                    label: `$(history) Show Previous File History`,
                    description: undefined,
                    detail: `Shows the previous commit history of the file, starting at $(git-commit) ${commit.sha}`
                }, commands_1.Commands.ShowQuickFileHistory, [new gitProvider_1.GitUri(commit.uri, commit), undefined, undefined, currentCommand]));
            }
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
//# sourceMappingURL=commitDetails.js.map