"use strict";
const settings_1 = require("./settings");
const welcome_1 = require("./welcome");
function Initialize() {
    welcome_1.manageWelcomeMessage(settings_1.settingsManager);
}
function activate() {
    // tslint:disable-next-line no-console
    console.log('vscode-icons is active!');
    Initialize();
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map