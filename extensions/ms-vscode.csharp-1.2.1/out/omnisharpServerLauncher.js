/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var child_process_1 = require('child_process');
var vscode_1 = require('vscode');
var semver_1 = require('semver');
var omnisharpPath_1 = require('./omnisharpPath');
var omnisharpDownload_1 = require('./omnisharpDownload');
var utils_1 = require('./utils');
var isWindows = process.platform === 'win32';
function installOmnisharpIfNeeded(output) {
    return omnisharpPath_1.getOmnisharpLaunchFilePath().catch(function (err) {
        if (utils_1.getSupportedPlatform() == utils_1.SupportedPlatform.None && process.platform === 'linux') {
            output.appendLine("[ERROR] Could not locate an OmniSharp server that supports your Linux distribution.");
            output.appendLine("");
            output.appendLine("OmniSharp provides a richer C# editing experience, with features like IntelliSense and Find All References.");
            output.appendLine("It is recommend that you download the version of OmniSharp that runs on Mono using the following steps:");
            output.appendLine("    1. If it's not already installed, download and install Mono (http://www.mono-project.com)");
            output.appendLine("    2. Download and untar https://github.com/OmniSharp/omnisharp-roslyn/releases/download/v1.9-alpha13/omnisharp-linux-mono.tar.gz");
            output.appendLine("    3. In Visual Studio Code, select Preferences->User Settings to open settings.json.");
            output.appendLine("    4. In settings.json, add a new setting: \"csharp.omnisharp\": \"/path/to/omnisharp/OmniSharp.exe\"");
            output.appendLine("    5. Restart Visual Studio Code.");
            output.show();
            throw err;
        }
        var logFunction = function (message) { output.appendLine(message); };
        var omnisharpAssetName = omnisharpDownload_1.getOmnisharpAssetName();
        var proxy = vscode_1.workspace.getConfiguration().get('http.proxy');
        var strictSSL = vscode_1.workspace.getConfiguration().get('http.proxyStrictSSL', true);
        return omnisharpDownload_1.downloadOmnisharp(logFunction, omnisharpAssetName, proxy, strictSSL).then(function (_) {
            return omnisharpPath_1.getOmnisharpLaunchFilePath();
        });
    });
}
exports.installOmnisharpIfNeeded = installOmnisharpIfNeeded;
function launch(output, cwd, args) {
    return new Promise(function (resolve, reject) {
        try {
            (isWindows ? launchWindows(output, cwd, args) : launchNix(output, cwd, args)).then(function (value) {
                // async error - when target not not ENEOT
                value.process.on('error', reject);
                // success after a short freeing event loop
                setTimeout(function () {
                    resolve(value);
                }, 0);
            }, function (err) {
                reject(err);
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = launch;
function launchWindows(output, cwd, args) {
    return installOmnisharpIfNeeded(output).then(function (command) {
        args = args.slice(0);
        args.unshift(command);
        args = [[
                '/s',
                '/c',
                '"' + args.map(function (arg) { return /^[^"].* .*[^"]/.test(arg) ? "\"" + arg + "\"" : arg; }).join(' ') + '"'
            ].join(' ')];
        var process = child_process_1.spawn('cmd', args, {
            windowsVerbatimArguments: true,
            detached: false,
            // env: details.env,
            cwd: cwd
        });
        return {
            process: process,
            command: command
        };
    });
}
function launchNix(output, cwd, args) {
    return installOmnisharpIfNeeded(output).then(function (command) {
        var process = child_process_1.spawn(command, args, {
            detached: false,
            // env: details.env,
            cwd: cwd
        });
        return {
            process: process,
            command: command
        };
    });
    // return new Promise((resolve, reject) => {
    // 	hasMono('>=4.0.1').then(hasIt => {
    // 		if (!hasIt) {
    // 			reject(new Error('Cannot start Omnisharp because Mono version >=4.0.1 is required. See http://go.microsoft.com/fwlink/?linkID=534832#_20001'));
    // 		} else {
    // 			resolve();
    // 		}
    // 	});
    // }).then(_ => {
    // 	return installOmnisharpIfNeeded();
    // }).then(command => {
    // 	let process = spawn(command, args, {
    // 		detached: false,
    // 		// env: details.env,
    // 		cwd
    // 	});
    // 	return {
    // 		process,
    // 		command
    // 	};
    // });
}
var versionRegexp = /(\d+\.\d+\.\d+)/;
function hasMono(range) {
    return new Promise(function (resolve, reject) {
        var childprocess;
        try {
            childprocess = child_process_1.spawn('mono', ['--version']);
        }
        catch (e) {
            return resolve(false);
        }
        childprocess.on('error', function (err) {
            resolve(false);
        });
        var stdout = '';
        childprocess.stdout.on('data', function (data) {
            stdout += data.toString();
        });
        childprocess.stdout.on('close', function () {
            var match = versionRegexp.exec(stdout), ret;
            if (!match) {
                ret = false;
            }
            else if (!range) {
                ret = true;
            }
            else {
                ret = semver_1.satisfies(match[1], range);
            }
            resolve(ret);
        });
    });
}
exports.hasMono = hasMono;
//# sourceMappingURL=omnisharpServerLauncher.js.map