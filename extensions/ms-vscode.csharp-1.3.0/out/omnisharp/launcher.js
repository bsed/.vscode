/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var child_process_1 = require('child_process');
var semver_1 = require('semver');
var platform_1 = require('../platform');
var omnisharp = require('./omnisharp');
var path = require('path');
var vscode = require('vscode');
var platform = platform_1.getCurrentPlatform();
(function (LaunchTargetKind) {
    LaunchTargetKind[LaunchTargetKind["Solution"] = 0] = "Solution";
    LaunchTargetKind[LaunchTargetKind["ProjectJson"] = 1] = "ProjectJson";
    LaunchTargetKind[LaunchTargetKind["Folder"] = 2] = "Folder";
})(exports.LaunchTargetKind || (exports.LaunchTargetKind = {}));
var LaunchTargetKind = exports.LaunchTargetKind;
function getDefaultFlavor(kind) {
    // Default to desktop (for Windows) or mono (for OSX/Linux) for solution files; otherwise, CoreCLR.
    if (kind === LaunchTargetKind.Solution) {
        if (platform === platform_1.Platform.Windows) {
            return omnisharp.Flavor.Desktop;
        }
        return omnisharp.Flavor.Mono;
    }
    return omnisharp.Flavor.CoreCLR;
}
exports.getDefaultFlavor = getDefaultFlavor;
/**
 * Returns a list of potential targets on which OmniSharp can be launched.
 * This includes `project.json` files, `*.sln` files (if any `*.csproj` files are found), and the root folder
 * (if it doesn't contain a `project.json` file, but `project.json` files exist).
 */
function findLaunchTargets() {
    if (!vscode.workspace.rootPath) {
        return Promise.resolve([]);
    }
    return vscode.workspace.findFiles(
    /*include*/ '{**/*.sln,**/*.csproj,**/project.json}', 
    /*exclude*/ '{**/node_modules/**,**/.git/**,**/bower_components/**}', 
    /*maxResults*/ 100)
        .then(function (resources) {
        return select(resources, vscode.workspace.rootPath);
    });
}
exports.findLaunchTargets = findLaunchTargets;
function select(resources, rootPath) {
    // The list of launch targets is calculated like so:
    //   * If there are .csproj files, .sln files are considered as launch targets.
    //   * Any project.json file is considered a launch target.
    //   * If there is no project.json file in the root, the root as added as a launch target.
    //
    // TODO:
    //   * It should be possible to choose a .csproj as a launch target
    //   * It should be possible to choose a .sln file even when no .csproj files are found 
    //     within the root.
    if (!Array.isArray(resources)) {
        return [];
    }
    var targets = [], hasCsProjFiles = false, hasProjectJson = false, hasProjectJsonAtRoot = false;
    hasCsProjFiles = resources.some(isCSharpProject);
    resources.forEach(function (resource) {
        // Add .sln files if there are .csproj files
        if (hasCsProjFiles && isSolution(resource)) {
            targets.push({
                label: path.basename(resource.fsPath),
                description: vscode.workspace.asRelativePath(path.dirname(resource.fsPath)),
                target: resource.fsPath,
                directory: path.dirname(resource.fsPath),
                kind: LaunchTargetKind.Solution
            });
        }
        // Add project.json files
        if (isProjectJson(resource)) {
            var dirname = path.dirname(resource.fsPath);
            hasProjectJson = true;
            hasProjectJsonAtRoot = hasProjectJsonAtRoot || dirname === rootPath;
            targets.push({
                label: path.basename(resource.fsPath),
                description: vscode.workspace.asRelativePath(path.dirname(resource.fsPath)),
                target: dirname,
                directory: dirname,
                kind: LaunchTargetKind.ProjectJson
            });
        }
    });
    // Add the root folder if there are project.json files, but none in the root.
    if (hasProjectJson && !hasProjectJsonAtRoot) {
        targets.push({
            label: path.basename(rootPath),
            description: '',
            target: rootPath,
            directory: rootPath,
            kind: LaunchTargetKind.Folder
        });
    }
    return targets.sort(function (a, b) { return a.directory.localeCompare(b.directory); });
}
function isCSharpProject(resource) {
    return /\.csproj$/i.test(resource.fsPath);
}
function isSolution(resource) {
    return /\.sln$/i.test(resource.fsPath);
}
function isProjectJson(resource) {
    return /\project.json$/i.test(resource.fsPath);
}
function launchOmniSharp(details) {
    return new Promise(function (resolve, reject) {
        try {
            return launch(details).then(function (result) {
                // async error - when target not not ENEOT
                result.process.on('error', reject);
                // success after a short freeing event loop
                setTimeout(function () {
                    resolve(result);
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
exports.launchOmniSharp = launchOmniSharp;
function launch(details) {
    if (platform === platform_1.Platform.Windows) {
        return launchWindows(details);
    }
    else {
        return launchNix(details);
    }
}
function launchWindows(details) {
    return new Promise(function (resolve) {
        function escapeIfNeeded(arg) {
            var hasSpaceWithoutQuotes = /^[^"].* .*[^"]/;
            return hasSpaceWithoutQuotes.test(arg)
                ? "\"" + arg + "\""
                : arg;
        }
        var args = details.args.slice(0); // create copy of details.args
        args.unshift(details.serverPath);
        args = [[
                '/s',
                '/c',
                '"' + args.map(escapeIfNeeded).join(' ') + '"'
            ].join(' ')];
        var process = child_process_1.spawn('cmd', args, {
            windowsVerbatimArguments: true,
            detached: false,
            cwd: details.cwd
        });
        return resolve({
            process: process,
            command: details.serverPath
        });
    });
}
function launchNix(details) {
    if (details.flavor === omnisharp.Flavor.CoreCLR) {
        return launchNixCoreCLR(details);
    }
    else if (details.flavor === omnisharp.Flavor.Mono) {
        return launchNixMono(details);
    }
    else {
        throw new Error("Unexpected OmniSharp flavor: " + details.flavor);
    }
}
function launchNixCoreCLR(details) {
    return new Promise(function (resolve) {
        var process = child_process_1.spawn(details.serverPath, details.args, {
            detached: false,
            cwd: details.cwd
        });
        return resolve({
            process: process,
            command: details.serverPath
        });
    });
}
function launchNixMono(details) {
    return new Promise(function (resolve, reject) {
        return canLaunchMono().then(function () {
            var args = details.args.slice(0); // create copy of details.args
            args.unshift(details.serverPath);
            var process = child_process_1.spawn('mono', args, {
                detached: false,
                cwd: details.cwd
            });
            return resolve({
                process: process,
                command: details.serverPath
            });
        });
    });
}
function canLaunchMono() {
    return new Promise(function (resolve, reject) {
        hasMono('>=4.0.1').then(function (success) {
            if (success) {
                return resolve();
            }
            else {
                return reject(new Error('Cannot start Omnisharp because Mono version >=4.0.1 is required.'));
            }
        });
    });
}
function hasMono(range) {
    var versionRegexp = /(\d+\.\d+\.\d+)/;
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
//# sourceMappingURL=launcher.js.map