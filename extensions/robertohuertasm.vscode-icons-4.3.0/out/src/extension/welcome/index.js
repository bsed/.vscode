"use strict";
const vscode = require("vscode");
const open = require("open");
const messages_1 = require("../messages");
const utils_1 = require("../utils");
function manageWelcomeMessage(settingsManager) {
    const state = settingsManager.getState();
    const vars = settingsManager.getSettings();
    const isNewVersion = state.version !== vars.extVersion;
    if (!state.welcomeShown) {
        // show welcome message
        showWelcomeMessage(settingsManager);
        return;
    }
    if (isNewVersion) {
        settingsManager.setStatus(state.status);
        if (!utils_1.getConfig().vsicons.dontShowNewVersionMessage) {
            showNewVersionMessage(settingsManager);
        }
    }
}
exports.manageWelcomeMessage = manageWelcomeMessage;
function showWelcomeMessage(settingsManager) {
    settingsManager.setStatus(settingsManager.status.notInstalled);
    vscode.window.showInformationMessage(messages_1.messages.welcomeMessage, { title: messages_1.messages.aboutOfficialApi }, { title: messages_1.messages.seeReadme })
        .then(btn => {
        if (!btn) {
            return;
        }
        if (btn.title === messages_1.messages.aboutOfficialApi) {
            open(messages_1.messages.urlOfficialApi);
        }
        else if (btn.title === messages_1.messages.seeReadme) {
            open(messages_1.messages.urlReadme);
        }
    });
}
function showNewVersionMessage(settingsManager) {
    const vars = settingsManager.getSettings();
    vscode.window.showInformationMessage(messages_1.messages.newVersionMessage + ' v.' + vars.extVersion, { title: messages_1.messages.seeReleaseNotes }, { title: messages_1.messages.dontshowthis })
        .then(btn => {
        settingsManager.setStatus(settingsManager.status.disabled);
        if (!btn) {
            return;
        }
        if (btn.title === messages_1.messages.seeReleaseNotes) {
            open(messages_1.messages.urlReleaseNote);
        }
        else if (btn.title === messages_1.messages.dontshowthis) {
            utils_1.getConfig()
                .update('vsicons.dontShowNewVersionMessage', true, true);
        }
    });
}
//# sourceMappingURL=index.js.map