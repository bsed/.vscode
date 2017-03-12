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
const gitQuickPicks_1 = require("./gitQuickPicks");
const quickPicks_1 = require("./quickPicks");
const path = require("path");
class FileHistoryQuickPick {
    static show(log, uri, sha, maxCount, defaultMaxCount, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = Array.from(system_1.Iterables.map(log.commits.values(), c => new gitQuickPicks_1.CommitQuickPickItem(c)));
            if (maxCount !== 0 && items.length >= defaultMaxCount) {
                items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                    label: `$(sync) Show All Commits`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 Currently only showing the first ${defaultMaxCount} commits`,
                    detail: `This may take a while`
                }, commands_1.Commands.ShowQuickFileHistory, [uri, 0, goBackCommand]));
            }
            if (!goBackCommand) {
                items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                    label: `$(repo) Show Repository History`,
                    description: null,
                    detail: 'Shows the commit history of the repository'
                }, commands_1.Commands.ShowQuickRepoHistory, [
                    undefined,
                    undefined,
                    new quickPicks_1.CommandQuickPickItem({
                        label: `go back \u21A9`,
                        description: `\u00a0 \u2014 \u00a0\u00a0 to history of \u00a0$(file-text) ${path.basename(uri.fsPath)}`
                    }, commands_1.Commands.ShowQuickFileHistory, [uri, maxCount])
                ]));
            }
            if (goBackCommand) {
                items.splice(0, 0, goBackCommand);
            }
            yield commands_1.Keyboard.instance.enterScope(['left', goBackCommand]);
            const commit = system_1.Iterables.first(log.commits.values());
            const pick = yield vscode_1.window.showQuickPick(items, {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: `${commit.getFormattedPath()}${sha ? ` \u00a0\u2022\u00a0 ${sha}` : ''}`,
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
exports.FileHistoryQuickPick = FileHistoryQuickPick;
//# sourceMappingURL=fileHistory.js.map