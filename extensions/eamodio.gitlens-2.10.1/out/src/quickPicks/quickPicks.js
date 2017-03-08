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
const constants_1 = require("../constants");
function getQuickPickIgnoreFocusOut() {
    return !vscode_1.workspace.getConfiguration('gitlens').get('advanced').quickPick.closeOnFocusOut;
}
exports.getQuickPickIgnoreFocusOut = getQuickPickIgnoreFocusOut;
function openEditor(uri, pinned = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!pinned)
                return yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.Open, uri);
            const document = yield vscode_1.workspace.openTextDocument(uri);
            return vscode_1.window.showTextDocument(document, (vscode_1.window.activeTextEditor && vscode_1.window.activeTextEditor.viewColumn) || 1, true);
        }
        catch (ex) {
            return undefined;
        }
    });
}
exports.openEditor = openEditor;
class CommandQuickPickItem {
    constructor(item, command, args) {
        this.command = command;
        this.args = args;
        Object.assign(this, item);
    }
    execute() {
        return vscode_1.commands.executeCommand(this.command, ...(this.args || []));
    }
}
exports.CommandQuickPickItem = CommandQuickPickItem;
class OpenFileCommandQuickPickItem extends CommandQuickPickItem {
    constructor(uri, item) {
        super(item, undefined, undefined);
        this.uri = uri;
    }
    execute(pinned = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.open(pinned);
        });
    }
    open(pinned = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return openEditor(this.uri, pinned);
        });
    }
}
exports.OpenFileCommandQuickPickItem = OpenFileCommandQuickPickItem;
class OpenFilesCommandQuickPickItem extends CommandQuickPickItem {
    constructor(uris, item) {
        super(item, undefined, undefined);
        this.uris = uris;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const uri of this.uris) {
                openEditor(uri, true);
            }
            return undefined;
        });
    }
}
exports.OpenFilesCommandQuickPickItem = OpenFilesCommandQuickPickItem;
//# sourceMappingURL=quickPicks.js.map