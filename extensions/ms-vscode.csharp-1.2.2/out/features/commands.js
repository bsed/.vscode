/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var serverUtils = require('../omnisharpUtils');
var launchTargetFinder_1 = require('../launchTargetFinder');
var cp = require('child_process');
var fs = require('fs-extra-promise');
var path = require('path');
var vscode = require('vscode');
var dotnetTest = require('./dotnetTest');
var processPicker_1 = require('./processPicker');
var channel = vscode.window.createOutputChannel('.NET');
function registerCommands(server, extensionPath) {
    var d1 = vscode.commands.registerCommand('o.restart', function () { return server.restart(); });
    var d2 = vscode.commands.registerCommand('o.pickProjectAndStart', function () { return pickProjectAndStart(server); });
    var d3 = vscode.commands.registerCommand('o.showOutput', function () { return server.getChannel().show(vscode.ViewColumn.Three); });
    var d4 = vscode.commands.registerCommand('dotnet.restore', function () { return dotnetRestoreAllProjects(server); });
    // register empty handler for csharp.installDebugger
    // running the command activates the extension, which is all we need for installation to kickoff
    var d5 = vscode.commands.registerCommand('csharp.downloadDebugger', function () { });
    // register two commands for running and debugging xunit tests
    var d6 = dotnetTest.registerDotNetTestRunCommand(server);
    var d7 = dotnetTest.registerDotNetTestDebugCommand(server);
    // register process picker for attach
    var attachItemsProvider = processPicker_1.DotNetAttachItemsProviderFactory.Get();
    var attacher = new processPicker_1.AttachPicker(attachItemsProvider);
    var d8 = vscode.commands.registerCommand('csharp.listProcess', function () { return attacher.ShowAttachEntries(); });
    return vscode.Disposable.from(d1, d2, d3, d4, d5, d6, d7, d8);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerCommands;
function pickProjectAndStart(server) {
    return launchTargetFinder_1.default().then(function (targets) {
        var currentPath = server.getSolutionPathOrFolder();
        if (currentPath) {
            for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                var target = targets_1[_i];
                if (target.target.fsPath === currentPath) {
                    target.label = "\u2713 " + target.label;
                }
            }
        }
        return vscode.window.showQuickPick(targets, {
            matchOnDescription: true,
            placeHolder: "Select 1 of " + targets.length + " projects"
        }).then(function (target) {
            if (target) {
                return server.restart(target.target.fsPath);
            }
        });
    });
}
function projectsToCommands(projects) {
    return projects.map(function (project) {
        var projectDirectory = project.Path;
        return fs.lstatAsync(projectDirectory).then(function (stats) {
            if (stats.isFile()) {
                projectDirectory = path.dirname(projectDirectory);
            }
            return {
                label: "dotnet restore - (" + (project.Name || path.basename(project.Path)) + ")",
                description: projectDirectory,
                execute: function () {
                    return runDotnetRestore(projectDirectory);
                }
            };
        });
    });
}
function dotnetRestoreAllProjects(server) {
    if (!server.isRunning()) {
        return Promise.reject('OmniSharp server is not running.');
    }
    return serverUtils.requestWorkspaceInformation(server).then(function (info) {
        if (!('DotNet in info') || info.DotNet.Projects.length < 1) {
            return Promise.reject("No .NET Core projects found");
        }
        var commandPromises = projectsToCommands(info.DotNet.Projects);
        return Promise.all(commandPromises).then(function (commands) {
            return vscode.window.showQuickPick(commands);
        }).then(function (command) {
            if (command) {
                return command.execute();
            }
        });
    });
}
exports.dotnetRestoreAllProjects = dotnetRestoreAllProjects;
function dotnetRestoreForProject(server, fileName) {
    if (!server.isRunning()) {
        return Promise.reject('OmniSharp server is not running.');
    }
    return serverUtils.requestWorkspaceInformation(server).then(function (info) {
        if (!('DotNet in info') || info.DotNet.Projects.length < 1) {
            return Promise.reject("No .NET Core projects found");
        }
        var directory = path.dirname(fileName);
        for (var _i = 0, _a = info.DotNet.Projects; _i < _a.length; _i++) {
            var project = _a[_i];
            if (project.Path === directory) {
                return runDotnetRestore(directory, fileName);
            }
        }
    });
}
exports.dotnetRestoreForProject = dotnetRestoreForProject;
function runDotnetRestore(cwd, fileName) {
    return new Promise(function (resolve, reject) {
        channel.clear();
        channel.show();
        var cmd = 'dotnet restore';
        if (fileName) {
            cmd = cmd + " \"" + fileName + "\"";
        }
        return cp.exec(cmd, { cwd: cwd, env: process.env }, function (err, stdout, stderr) {
            channel.append(stdout.toString());
            channel.append(stderr.toString());
            if (err) {
                channel.append('ERROR: ' + err);
            }
        });
    });
}
//# sourceMappingURL=commands.js.map