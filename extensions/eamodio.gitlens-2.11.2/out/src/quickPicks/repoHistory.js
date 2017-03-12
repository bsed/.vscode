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
class RepoHistoryQuickPick {
    static show(log, uri, maxCount, defaultMaxCount, goBackCommand) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = Array.from(system_1.Iterables.map(log.commits.values(), c => new gitQuickPicks_1.CommitQuickPickItem(c, ` \u2014 ${c.fileName}`)));
            if (maxCount !== 0 && items.length >= defaultMaxCount) {
                items.splice(0, 0, new quickPicks_1.CommandQuickPickItem({
                    label: `$(sync) Show All Commits`,
                    description: `\u00a0 \u2014 \u00a0\u00a0 Currently only showing the first ${defaultMaxCount} commits`,
                    detail: `This may take a while`
                }, commands_1.Commands.ShowQuickRepoHistory, [uri, 0, goBackCommand]));
            }
            if (goBackCommand) {
                items.splice(0, 0, goBackCommand);
            }
            yield commands_1.Keyboard.instance.enterScope(['left', goBackCommand]);
            const pick = yield vscode_1.window.showQuickPick(items, {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: 'Search by commit message, filename, or sha',
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
exports.RepoHistoryQuickPick = RepoHistoryQuickPick;
//# sourceMappingURL=repoHistory.js.map