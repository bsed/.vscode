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
exports.CommandQuickPickItem = quickPicks_1.CommandQuickPickItem;
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
class OpenStatusFilesCommandQuickPickItem extends quickPicks_1.OpenFilesCommandQuickPickItem {
    constructor(statuses, item) {
        const repoPath = statuses.length && statuses[0].repoPath;
        const uris = statuses.map(_ => vscode_1.Uri.file(path.resolve(repoPath, _.fileName)));
        super(uris, item || {
            label: `$(file-symlink-file) Open Files`,
            description: undefined,
            detail: `Opens all of the changed files in the repository`
        });
    }
}
exports.OpenStatusFilesCommandQuickPickItem = OpenStatusFilesCommandQuickPickItem;
class RepoStatusQuickPick {
    static show(statuses, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            statuses.sort((a, b) => (a.staged ? -1 : 1) - (b.staged ? -1 : 1) || a.fileName.localeCompare(b.fileName));
            const items = Array.from(system_1.Iterables.map(statuses, s => new OpenStatusFileCommandQuickPickItem(s)));
            if (statuses.some(_ => _.staged)) {
                const index = statuses.findIndex(_ => !_.staged);
                if (index > -1) {
                    items.splice(index, 0, new OpenStatusFilesCommandQuickPickItem(statuses.filter(_ => _.status !== 'D' && !_.staged), {
                        label: `$(file-symlink-file) Open Unstaged Files`,
                        description: undefined,
                        detail: `Opens all of the unstaged files in the repository`
                    }));
                    items.splice(0, 0, new OpenStatusFilesCommandQuickPickItem(statuses.filter(_ => _.status !== 'D' && _.staged), {
                        label: `$(file-symlink-file) Open Staged Files`,
                        description: undefined,
                        detail: `Opens all of the staged files in the repository`
                    }));
                }
            }
            if (statuses.length) {
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