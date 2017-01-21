"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const misc_1 = require("../util/misc");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const net = require("net");
const child_process_1 = require("child_process");
const uuid = require("uuid");
const addon_1 = require("./addon");
const FirefoxProfile = require("firefox-profile");
function launchFirefox(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let firefoxPath = getFirefoxExecutablePath(config);
        if (!firefoxPath) {
            let errorMsg = 'Couldn\'t find the Firefox executable. ';
            if (config.firefoxExecutable) {
                errorMsg += 'Please correct the path given in your launch configuration.';
            }
            else {
                errorMsg += 'Please specify the path in your launch configuration.';
            }
            return Promise.reject(errorMsg);
        }
        let port = config.port || 6000;
        let firefoxArgs = ['-start-debugger-server', String(port), '-no-remote'];
        if (Array.isArray(config.firefoxArgs)) {
            firefoxArgs = firefoxArgs.concat(config.firefoxArgs);
        }
        if (config.file) {
            if (!path.isAbsolute(config.file)) {
                return Promise.reject('The "file" property in the launch configuration has to be an absolute path');
            }
            let fileUrl = config.file;
            if (os.platform() === 'win32') {
                fileUrl = 'file:///' + fileUrl.replace(/\\/g, '/');
            }
            else {
                fileUrl = 'file://' + fileUrl;
            }
            firefoxArgs.push(fileUrl);
        }
        else if (config.url) {
            firefoxArgs.push(config.url);
        }
        else if (config.addonType) {
            firefoxArgs.push('about:blank');
        }
        else {
            return Promise.reject('You need to set either "file" or "url" in the launch configuration');
        }
        let debugProfileDir = path.join(os.tmpdir(), `vscode-firefox-debug-profile-${uuid.v4()}`);
        firefoxArgs.push('-profile', debugProfileDir);
        yield prepareDebugProfile(config, debugProfileDir);
        let childProc = child_process_1.spawn(firefoxPath, firefoxArgs, { detached: true, stdio: 'ignore' });
        childProc.on('exit', () => {
            fs.removeSync(debugProfileDir);
        });
        childProc.unref();
        return childProc;
    });
}
exports.launchFirefox = launchFirefox;
function waitForSocket(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let port = config.port || 6000;
        let lastError;
        for (var i = 0; i < 25; i++) {
            try {
                return yield connect(port);
            }
            catch (err) {
                lastError = err;
                yield misc_1.delay(200);
            }
        }
        throw lastError;
    });
}
exports.waitForSocket = waitForSocket;
function getFirefoxExecutablePath(config) {
    if (config.firefoxExecutable) {
        if (isExecutable(config.firefoxExecutable)) {
            return config.firefoxExecutable;
        }
        else {
            return undefined;
        }
    }
    let candidates = [];
    switch (os.platform()) {
        case 'linux':
        case 'freebsd':
        case 'sunos':
            candidates = [
                '/usr/bin/firefox-developer',
                '/usr/bin/firefox'
            ];
            break;
        case 'darwin':
            candidates = [
                '/Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox',
                '/Applications/Firefox.app/Contents/MacOS/firefox'
            ];
            break;
        case 'win32':
            candidates = [
                'C:\\Program Files (x86)\\Firefox Developer Edition\\firefox.exe',
                'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
                'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
                'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
            ];
            break;
    }
    for (let i = 0; i < candidates.length; i++) {
        if (isExecutable(candidates[i])) {
            return candidates[i];
        }
    }
    return undefined;
}
function prepareDebugProfile(config, debugProfileDir) {
    return __awaiter(this, void 0, void 0, function* () {
        var profile = yield createDebugProfile(config, debugProfileDir);
        profile.defaultPreferences = {};
        profile.setPreference('browser.shell.checkDefaultBrowser', false);
        profile.setPreference('devtools.chrome.enabled', true);
        profile.setPreference('devtools.debugger.prompt-connection', false);
        profile.setPreference('devtools.debugger.remote-enabled', true);
        profile.setPreference('devtools.debugger.workers', true);
        profile.setPreference('extensions.autoDisableScopes', 10);
        profile.setPreference('xpinstall.signatures.required', false);
        profile.updatePreferences();
        if (config.addonType && config.addonPath) {
            let tempXpiDir = path.join(os.tmpdir(), `vscode-firefox-debug-${uuid.v4()}`);
            fs.mkdirSync(tempXpiDir);
            var xpiPath = yield addon_1.createXpi(config.addonType, config.addonPath, tempXpiDir);
            var addonId = yield installXpi(profile, xpiPath);
            fs.removeSync(tempXpiDir);
            return addonId;
        }
        else {
            return undefined;
        }
    });
}
function installXpi(profile, xpiPath) {
    return new Promise((resolve, reject) => {
        profile.addExtension(xpiPath, (err, addonDetails) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(addonDetails.id);
            }
        });
    });
}
function createDebugProfile(config, debugProfileDir) {
    return new Promise((resolve, reject) => {
        if (config.profileDir) {
            FirefoxProfile.copy({
                profileDirectory: config.profileDir,
                destinationDirectory: debugProfileDir
            }, (err, profile) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(profile);
                }
            });
        }
        else if (config.profile) {
            FirefoxProfile.copyFromUserProfile({
                name: config.profile,
                destinationDirectory: debugProfileDir
            }, (err, profile) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(profile);
                }
            });
        }
        else {
            fs.mkdirSync(debugProfileDir);
            resolve(new FirefoxProfile({
                destinationDirectory: debugProfileDir
            }));
        }
    });
}
function isExecutable(path) {
    try {
        fs.accessSync(path, fs.constants.X_OK);
        return true;
    }
    catch (e) {
        return false;
    }
}
function connect(port, host) {
    return new Promise((resolve, reject) => {
        let socket = net.connect(port);
        socket.on('connect', () => resolve(socket));
        socket.on('error', reject);
    });
}
exports.connect = connect;
//# sourceMappingURL=launcher.js.map