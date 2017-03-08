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
const quickPicks_1 = require("../quickPicks/quickPicks");
const keys = [
    'left',
    'right'
];
let scopeCount = 0;
let _instance;
class Keyboard extends vscode_1.Disposable {
    constructor(context) {
        super(() => this.dispose());
        this.context = context;
        const subscriptions = [];
        for (const key of keys) {
            subscriptions.push(vscode_1.commands.registerCommand(`gitlens.key.${key}`, () => this.execute(key), this));
        }
        this._disposable = vscode_1.Disposable.from(...subscriptions);
        _instance = this;
    }
    static get instance() {
        return _instance;
    }
    dispose() {
        this._disposable && this._disposable.dispose();
    }
    execute(key) {
        const command = this.context.globalState.get(`gitlens:key:${key}`);
        if (!command || !(command instanceof quickPicks_1.CommandQuickPickItem))
            return undefined;
        if (command instanceof quickPicks_1.OpenFileCommandQuickPickItem) {
            return command.execute(true);
        }
        return command.execute();
    }
    enterScope(...keyCommands) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.SetContext, 'gitlens:key', ++scopeCount);
            if (keyCommands && Array.isArray(keyCommands) && keyCommands.length) {
                for (const [key, command] of keyCommands) {
                    yield this.setKeyCommand(key, command);
                }
            }
        });
    }
    exitScope(clear = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode_1.commands.executeCommand(constants_1.BuiltInCommands.SetContext, 'gitlens:key', --scopeCount);
            if (clear && !scopeCount) {
                for (const key of keys) {
                    yield this.clearKeyCommand(key);
                }
            }
        });
    }
    clearKeyCommand(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.globalState.update(`gitlens:key:${key}`, undefined);
        });
    }
    setKeyCommand(key, command) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.globalState.update(`gitlens:key:${key}`, command);
        });
    }
}
exports.Keyboard = Keyboard;
//# sourceMappingURL=keyboard.js.map