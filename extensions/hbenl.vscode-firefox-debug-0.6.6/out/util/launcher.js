"use strict";
var os = require('os');
var path = require('path');
var fs = require('fs');
var net = require('net');
var rimraf = require('rimraf');
var child_process_1 = require('child_process');
/**
 * Tries to launch Firefox with the given launch configuration. Returns either the spawned
 * child process or an error message.
 */
function launchFirefox(config) {
    var firefoxPath = getFirefoxExecutablePath(config);
    if (!firefoxPath) {
        var errorMsg = 'Couldn\'t find the Firefox executable. ';
        if (config.firefoxExecutable) {
            errorMsg += 'Please correct the path given in your launch configuration.';
        }
        else {
            errorMsg += 'Please specify the path in your launch configuration.';
        }
        return errorMsg;
    }
    var port = config.port || 6000;
    var firefoxArgs = ['-start-debugger-server', String(port), '-no-remote'];
    if (config.profile) {
        firefoxArgs.push('-P', config.profile);
    }
    else {
        var _a = getProfileDir(config), success = _a[0], profileDirOrErrorMsg = _a[1];
        if (success) {
            firefoxArgs.push('-profile', profileDirOrErrorMsg);
        }
        else {
            return profileDirOrErrorMsg;
        }
    }
    if (Array.isArray(config.firefoxArgs)) {
        firefoxArgs = firefoxArgs.concat(config.firefoxArgs);
    }
    if (config.file) {
        if (!path.isAbsolute(config.file)) {
            return 'The "file" property in the launch configuration has to be an absolute path';
        }
        var fileUrl = config.file;
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
    else {
        return 'You need to set either "file" or "url" in the launch configuration';
    }
    var childProc = child_process_1.spawn(firefoxPath, firefoxArgs, { detached: true, stdio: 'ignore' });
    childProc.unref();
    return childProc;
}
exports.launchFirefox = launchFirefox;
function waitForSocket(config) {
    var port = config.port || 6000;
    return new Promise(function (resolve, reject) {
        tryConnect(port, 200, 25, resolve, reject);
    });
}
exports.waitForSocket = waitForSocket;
function getFirefoxExecutablePath(config) {
    if (config.firefoxExecutable) {
        if (isExecutable(config.firefoxExecutable)) {
            return config.firefoxExecutable;
        }
        else {
            return null;
        }
    }
    var candidates = [];
    switch (os.platform()) {
        case 'linux':
        case 'freebsd':
        case 'sunos':
            candidates = [
                '/usr/bin/firefox'
            ];
            break;
        case 'darwin':
            candidates = [
                '/Applications/Firefox.app/Contents/MacOS/firefox'
            ];
            break;
        case 'win32':
            candidates = [
                'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
                'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
            ];
            break;
    }
    for (var i = 0; i < candidates.length; i++) {
        if (isExecutable(candidates[i])) {
            return candidates[i];
        }
    }
    return null;
}
/**
 * Returns either true and the path of the profile directory or false and an error message
 */
function getProfileDir(config) {
    var profileDir;
    if (config.profileDir) {
        profileDir = config.profileDir;
    }
    else {
        profileDir = path.join(os.tmpdir(), 'vscode-firefox-debug-profile');
        rimraf.sync(profileDir);
    }
    try {
        var stat = fs.statSync(profileDir);
        if (stat.isDirectory) {
            // directory exists - check permissions
            try {
                fs.accessSync(profileDir, fs.R_OK | fs.W_OK);
                return [true, profileDir];
            }
            catch (e) {
                return [false, ("The profile directory " + profileDir + " exists but can't be accessed")];
            }
        }
        else {
            return [false, (profileDir + " is not a directory")];
        }
    }
    catch (e) {
        // directory doesn't exist - create it and set the necessary user preferences
        try {
            fs.mkdirSync(profileDir);
            fs.writeFileSync(path.join(profileDir, 'prefs.js'), firefoxUserPrefs);
            return [true, profileDir];
        }
        catch (e) {
            return [false, ("Error trying to create profile directory " + profileDir + ": " + e)];
        }
    }
}
var firefoxUserPrefs = "\nuser_pref(\"browser.shell.checkDefaultBrowser\", false);\nuser_pref(\"devtools.chrome.enabled\", true);\nuser_pref(\"devtools.debugger.prompt-connection\", false);\nuser_pref(\"devtools.debugger.remote-enabled\", true);\nuser_pref(\"devtools.debugger.workers\", true);\n";
function isExecutable(path) {
    try {
        fs.accessSync(path, fs.X_OK);
        return true;
    }
    catch (e) {
        return false;
    }
}
function tryConnect(port, retryAfter, tries, resolve, reject) {
    var socket = net.connect(port);
    socket.on('connect', function () { return resolve(socket); });
    socket.on('error', function (err) {
        if (tries > 0) {
            setTimeout(function () { return tryConnect(port, retryAfter, tries - 1, resolve, reject); }, retryAfter);
        }
        else {
            reject(err);
        }
    });
}
//# sourceMappingURL=launcher.js.map