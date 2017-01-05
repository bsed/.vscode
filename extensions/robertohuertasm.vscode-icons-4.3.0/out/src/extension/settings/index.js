"use strict";
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const semver = require("semver");
const vscodePath_1 = require("./vscodePath");
const extVersion_1 = require("./extVersion");
let settings = null;
exports.status = {
    enabled: 'enabled',
    disabled: 'disabled',
    notInstalled: 'notInstalled',
};
function getSettings() {
    if (settings) {
        return settings;
    }
    ;
    const isInsiders = /insiders/i.test(vscode.env.appName);
    const version = semver(vscode.version);
    const isGt160 = semver.lt(version.major + '.' + version.minor + '.' + version.patch, '1.6.0');
    const isWin = /^win/.test(process.platform);
    const homeDir = isWin ? 'USERPROFILE' : 'HOME';
    const extensionFolder = path.join(homeDir, isInsiders
        ? '.vscode-insiders'
        : '.vscode', 'extensions');
    const codePath = isInsiders ? '/Code - Insiders' : '/Code';
    const appPath = vscodePath_1.vscodePath();
    settings = {
        appPath,
        isWin,
        isInsiders,
        extensionFolder,
        settingsPath: path.join(appPath, codePath, 'User', 'vsicons.settings.json'),
        extVersion: extVersion_1.version,
        version,
        isGt160,
    };
    return settings;
}
function getState() {
    const vars = getSettings();
    try {
        const state = fs.readFileSync(vars.settingsPath, 'utf8');
        return JSON.parse(state);
    }
    catch (error) {
        return {
            version: '0',
            status: exports.status.notInstalled,
            welcomeShown: false,
        };
    }
}
function setState(state) {
    const vars = getSettings();
    fs.writeFileSync(vars.settingsPath, JSON.stringify(state));
}
function setStatus(sts) {
    const state = getState();
    state.version = extVersion_1.version;
    state.status = sts;
    state.welcomeShown = true;
    setState(state);
}
function deleteState() {
    const vars = getSettings();
    fs.unlinkSync(vars.settingsPath);
}
exports.settingsManager = {
    getSettings,
    getState,
    setState,
    setStatus,
    deleteState,
    status: exports.status,
};
//# sourceMappingURL=index.js.map