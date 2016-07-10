/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
var vscode = require('vscode');
var serverUtils = require('./omnisharpUtils');
function getPaths() {
    var vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
    return {
        vscodeFolder: vscodeFolder,
        tasksJsonPath: path.join(vscodeFolder, 'tasks.json'),
        launchJsonPath: path.join(vscodeFolder, 'launch.json')
    };
}
function hasOperations(operations) {
    return operations.addLaunchJson ||
        operations.updateTasksJson ||
        operations.addLaunchJson;
}
function getOperations() {
    var paths = getPaths();
    return getBuildOperations(paths.tasksJsonPath).then(function (operations) {
        return getLaunchOperations(paths.launchJsonPath, operations);
    });
}
function getBuildOperations(tasksJsonPath) {
    return new Promise(function (resolve, reject) {
        return fs.existsAsync(tasksJsonPath).then(function (exists) {
            if (exists) {
                fs.readFileAsync(tasksJsonPath).then(function (buffer) {
                    var text = buffer.toString();
                    var tasksJson = JSON.parse(text);
                    var buildTask = tasksJson.tasks.find(function (td) { return td.taskName === 'build'; });
                    resolve({ updateTasksJson: (buildTask === undefined) });
                });
            }
            else {
                resolve({ addTasksJson: true });
            }
        });
    });
}
function getLaunchOperations(launchJsonPath, operations) {
    return new Promise(function (resolve, reject) {
        return fs.existsAsync(launchJsonPath).then(function (exists) {
            if (exists) {
                resolve(operations);
            }
            else {
                operations.addLaunchJson = true;
                resolve(operations);
            }
        });
    });
}
function promptToAddAssets() {
    return new Promise(function (resolve, reject) {
        var item = { title: 'Yes' };
        vscode.window.showInformationMessage('Required assets to build and debug are missing from your project. Add them?', item).then(function (selection) {
            return selection
                ? resolve(true)
                : resolve(false);
        });
    });
}
function createLaunchConfiguration(targetFramework, executableName) {
    return {
        name: '.NET Core Launch (console)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: '${workspaceRoot}/bin/Debug/' + targetFramework + '/' + executableName,
        args: [],
        cwd: '${workspaceRoot}',
        externalConsole: false,
        stopAtEntry: false
    };
}
function createWebLaunchConfiguration(targetFramework, executableName) {
    return {
        name: '.NET Core Launch (web)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: '${workspaceRoot}/bin/Debug/' + targetFramework + '/' + executableName,
        args: [],
        cwd: '${workspaceRoot}',
        stopAtEntry: false,
        launchBrowser: {
            enabled: true,
            args: '${auto-detect-url}',
            windows: {
                command: 'cmd.exe',
                args: '/C start ${auto-detect-url}'
            },
            osx: {
                command: 'open'
            },
            linux: {
                command: 'xdg-open'
            }
        },
        env: {
            ASPNETCORE_ENVIRONMENT: "Development"
        }
    };
}
function createAttachConfiguration() {
    return {
        name: '.NET Core Attach',
        type: 'coreclr',
        request: 'attach',
        processId: 0
    };
}
function createLaunchJson(targetFramework, executableName, isWebProject) {
    var version = '0.2.0';
    if (!isWebProject) {
        return {
            version: version,
            configurations: [
                createLaunchConfiguration(targetFramework, executableName),
                createAttachConfiguration()
            ]
        };
    }
    else {
        return {
            version: version,
            configurations: [
                createWebLaunchConfiguration(targetFramework, executableName),
                createAttachConfiguration()
            ]
        };
    }
}
function createBuildTaskDescription() {
    return {
        taskName: 'build',
        args: [],
        isBuildCommand: true,
        problemMatcher: '$msCompile'
    };
}
function createTasksConfiguration() {
    return {
        version: '0.1.0',
        command: 'dotnet',
        isShellCommand: true,
        args: [],
        tasks: [createBuildTaskDescription()]
    };
}
function addTasksJsonIfNecessary(info, paths, operations) {
    return new Promise(function (resolve, reject) {
        if (!operations.addTasksJson) {
            return resolve();
        }
        var tasksJson = createTasksConfiguration();
        var tasksJsonText = JSON.stringify(tasksJson, null, '    ');
        return fs.writeFileAsync(paths.tasksJsonPath, tasksJsonText);
    });
}
function hasWebServerDependency(projectJsonPath) {
    var projectJson = fs.readFileSync(projectJsonPath, 'utf8');
    var projectJsonObject = JSON.parse(projectJson);
    if (projectJsonObject == null) {
        return false;
    }
    for (var key in projectJsonObject.dependencies) {
        if (key.toLowerCase().startsWith("microsoft.aspnetcore.server")) {
            return true;
        }
    }
    return false;
}
function addLaunchJsonIfNecessary(info, paths, operations, projectJsonPath) {
    return new Promise(function (resolve, reject) {
        if (!operations.addLaunchJson) {
            return resolve();
        }
        var targetFramework = '<target-framework>';
        var executableName = '<project-name.dll>';
        var done = false;
        for (var _i = 0, _a = info.Projects; _i < _a.length; _i++) {
            var project = _a[_i];
            for (var _b = 0, _c = project.Configurations; _b < _c.length; _b++) {
                var configuration = _c[_b];
                if (configuration.Name === "Debug" && configuration.EmitEntryPoint === true) {
                    if (project.Frameworks.length > 0) {
                        targetFramework = project.Frameworks[0].ShortName;
                        executableName = path.basename(configuration.CompilationOutputAssemblyFile);
                    }
                    done = true;
                    break;
                }
            }
            if (done) {
                break;
            }
        }
        var launchJson = createLaunchJson(targetFramework, executableName, hasWebServerDependency(projectJsonPath));
        var launchJsonText = JSON.stringify(launchJson, null, '    ');
        return fs.writeFileAsync(paths.launchJsonPath, launchJsonText);
    });
}
function addAssetsIfNecessary(server) {
    if (!vscode.workspace.rootPath) {
        return;
    }
    // If there is no project.json, we won't bother to prompt the user for tasks.json.		
    var projectJsonPath = path.join(vscode.workspace.rootPath, 'project.json');
    if (!fs.existsSync(projectJsonPath)) {
        return;
    }
    return serverUtils.requestWorkspaceInformation(server).then(function (info) {
        // If there are no .NET Core projects, we won't bother offering to add assets.
        if ('DotNet' in info && info.DotNet.Projects.length > 0) {
            return getOperations().then(function (operations) {
                if (!hasOperations(operations)) {
                    return;
                }
                promptToAddAssets().then(function (addAssets) {
                    if (!addAssets) {
                        return;
                    }
                    var paths = getPaths();
                    return fs.ensureDirAsync(paths.vscodeFolder).then(function () {
                        return Promise.all([
                            addTasksJsonIfNecessary(info.DotNet, paths, operations),
                            addLaunchJsonIfNecessary(info.DotNet, paths, operations, projectJsonPath)
                        ]);
                    });
                });
            });
        }
    });
}
exports.addAssetsIfNecessary = addAssetsIfNecessary;
//# sourceMappingURL=assets.js.map