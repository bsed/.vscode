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
const path = require("path");
class OpenStatusFileCommandQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(status, item) {
        const uri = vscode_1.Uri.file(path.resolve(status.repoPath, status.fileName));
        const icon = gitProvider_1.getGitStatusIcon(status.status);
        let directory = path.dirname(status.fileName);
        if (!directory || directory === '.') {
            directory = undefined;
        }
        super(uri, item || {
            label: `${status.staged ? '$(check)' : '\u00a0\u00a0\u00a0'}\u00a0\u00a0${icon}\u00a0\u00a0\u00a0${path.basename(status.fileName)}`,
            description: directory
        });
    }
}
exports.OpenStatusFileCommandQuickPickItem = OpenStatusFileCommandQuickPickItem;
class OpenStatusFilesCommandQuickPickItem extends quickPicks_1.CommandQuickPickItem {
    constructor(statuses, item) {
        const repoPath = statuses.length && statuses[0].repoPath;
        const uris = statuses.map(_ => vscode_1.Uri.file(path.resolve(repoPath, _.fileName)));
        super(item || {
            label: `$(file-symlink-file) Open Changed Files`,
            description: undefined
        }, commands_1.Commands.OpenChangedFiles, [undefined, uris]);
    }
}
exports.OpenStatusFilesCommandQuickPickItem = OpenStatusFilesCommandQuickPickItem;
class RepoStatusQuickPick {
    static show(statuses, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            statuses.sort((a, b) => (a.staged ? -1 : 1) - (b.staged ? -1 : 1) || a.fileName.localeCompare(b.fileName));
            const items = Array.from(system_1.Iterables.map(statuses, s => new OpenStatusFileCommandQuickPickItem(s)));
            if (statuses.some(_ => _.staged)) {
                let index = 0;
                const unstagedIndex = statuses.findIndex(_ => !_.staged);
                if (unstagedIndex > -1) {
                    items.splice(unstagedIndex, 0, new quickPicks_1.CommandQuickPickItem({
                        label: `Unstaged Files`,
                        description: undefined
                    }, commands_1.Commands.ShowQuickRepoStatus, [goBackCommand]));
                    items.splice(index++, 0, new OpenStatusFilesCommandQuickPickItem(statuses.filter(_ => _.status !== 'D' && _.staged), {
                        label: `$(file-symlink-file) Open Staged Files`,
                        description: undefined
                    }));
                    items.splice(index++, 0, new OpenStatusFilesCommandQuickPickItem(statuses.filter(_ => _.status !== 'D' && !_.staged), {
                        label: `$(file-symlink-file) Open Unstaged Files`,
                        description: undefined
                    }));
                }
                items.splice(index++, 0, new quickPicks_1.CommandQuickPickItem({
                    label: `Staged Files`,
                    description: undefined
                }, commands_1.Commands.ShowQuickRepoStatus, [goBackCommand]));
            }
            else if (statuses.some(_ => !_.staged)) {
                items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                    label: `Unstaged Files`,
                    description: undefined
                }, commands_1.Commands.ShowQuickRepoStatus, [goBackCommand]));
            }
            if (statuses.length) {
                items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                    label: '$(x) Close Unchanged Files',
                    description: null
                }, commands_1.Commands.CloseUnchangedFiles));
                items.splice(0, 0, new OpenStatusFilesCommandQuickPickItem(statuses.filter(_ => _.status !== 'D')));
            }
            if (goBackCommand) {
                items.splice(0, 0, goBackCommand);
            }
            yield commands_1.Keyboard.instance.enterScope(['left', goBackCommand]);
            const pick = yield vscode_1.window.showQuickPick(items, {
                matchOnDescription: true,
                placeHolder: statuses.length ? 'Repository has changes' : 'Repository has no changes',
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
exports.RepoStatusQuickPick = RepoStatusQuickPick;
//# sourceMappingURL=repoStatus.js.map