'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode_1 = require('vscode');
// Values from common editor config:
// https://github.com/Microsoft/vscode/blob/master/src/vs/editor/common/config/commonEditorConfig.ts#L521
const minFontSize = 1;
const maxFontSize = 100;
function activate(context) {
    const increaseSizeCommand = vscode_1.commands.registerCommand('fontshortcuts.increaseFontSize', () => {
        const config = vscode_1.workspace.getConfiguration();
        const fontSize = config.get('editor.fontSize');
        const step = config.get('fontshortcuts.step');
        const newSize = Math.min(maxFontSize, fontSize + step);
        if (newSize !== fontSize) {
            config.update('terminal.integrated.fontSize', newSize, true);
            return config.update('editor.fontSize', newSize, true);
        }
    });
    const decreaseSizeCommand = vscode_1.commands.registerCommand('fontshortcuts.decreaseFontSize', () => {
        const config = vscode_1.workspace.getConfiguration();
        const fontSize = config.get('editor.fontSize');
        const step = config.get('fontshortcuts.step');
        const newSize = Math.max(minFontSize, fontSize - step);
        if (newSize !== fontSize) {
            config.update('terminal.integrated.fontSize', newSize, true);
            return config.update('editor.fontSize', newSize, true);
        }
    });
    const resetSizeCommand = vscode_1.commands.registerCommand('fontshortcuts.resetFontSize', () => __awaiter(this, void 0, void 0, function* () {
        // Check whether an override for the default font size exists
        const defaultFontSize = vscode_1.workspace.getConfiguration("fontshortcuts").get('defaultFontSize');
        console.log(defaultFontSize);
        if (defaultFontSize) {
            // Check whether the setting is a valid value
            if (Number.isSafeInteger(defaultFontSize)
                && defaultFontSize >= minFontSize
                && defaultFontSize <= maxFontSize) {
                try {
                    yield vscode_1.workspace.getConfiguration().update('terminal.integrated.fontSize', defaultFontSize, true);
                    return vscode_1.workspace.getConfiguration().update('editor.fontSize', defaultFontSize, true);
                }
                catch (exception) {
                    return false;
                }
            }
            else {
                vscode_1.window.showErrorMessage(`Cannot set default font size to "${defaultFontSize}". Please set it to an integer between ${minFontSize} and ${maxFontSize} in your user settings.`);
            }
        }
        else {
            // No override is set, remove the fontSize setting to let VSCode set the default font size
            try {
                yield vscode_1.workspace.getConfiguration().update('terminal.integrated.fontSize', undefined, true);
                return vscode_1.workspace.getConfiguration().update('editor.fontSize', undefined, true)
                    .then(() => { }, () => { });
            }
            catch (exception) {
                return false;
            }
        }
    }));
    context.subscriptions.push(increaseSizeCommand);
    context.subscriptions.push(decreaseSizeCommand);
    context.subscriptions.push(resetSizeCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map