/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
var vscode = require('vscode');
var serverUtils = require('./omnisharp/utils');
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
function computeProgramPath(projectData) {
    if (!projectData) {
        // If there's no target project data, use a placeholder for the path.
        return '${workspaceRoot}/bin/Debug/<target-framework>/<project-name.dll>';
    }
    var result = '${workspaceRoot}';
    if (projectData.projectPath) {
        result = path.join(result, path.relative(vscode.workspace.rootPath, projectData.projectPath.fsPath));
    }
    result = path.join(result, "bin/" + projectData.configurationName + "/" + projectData.targetFramework + "/" + projectData.executableName);
    return result;
}
function createLaunchConfiguration(projectData) {
    return {
        name: '.NET Core Launch (console)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: computeProgramPath(projectData),
        args: [],
        cwd: '${workspaceRoot}',
        externalConsole: false,
        stopAtEntry: false
    };
}
function createWebLaunchConfiguration(projectData) {
    return {
        name: '.NET Core Launch (web)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: computeProgramPath(projectData),
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
        },
        sourceFileMap: {
            "/Views": "${workspaceRoot}/Views"
        }
    };
}
function createAttachConfiguration() {
    return {
        name: '.NET Core Attach',
        type: 'coreclr',
        request: 'attach',
        processId: "${command.pickProcess}"
    };
}
function createLaunchJson(projectData, isWebProject) {
    var version = '0.2.0';
    if (!isWebProject) {
        return {
            version: version,
            configurations: [
                createLaunchConfiguration(projectData),
                createAttachConfiguration()
            ]
        };
    }
    else {
        return {
            version: version,
            configurations: [
                createWebLaunchConfiguration(projectData),
                createAttachConfiguration()
            ]
        };
    }
}
function createBuildTaskDescription(projectData) {
    var buildPath = '';
    if (projectData) {
        buildPath = path.join('${workspaceRoot}', path.relative(vscode.workspace.rootPath, projectData.projectJsonPath.fsPath));
    }
    return {
        taskName: 'build',
        args: [buildPath],
        isBuildCommand: true,
        problemMatcher: '$msCompile'
    };
}
function createTasksConfiguration(projectData) {
    return {
        version: '0.1.0',
        command: 'dotnet',
        isShellCommand: true,
        args: [],
        tasks: [createBuildTaskDescription(projectData)]
    };
}
function addTasksJsonIfNecessary(projectData, paths, operations) {
    return new Promise(function (resolve, reject) {
        if (!operations.addTasksJson) {
            return resolve();
        }
        var tasksJson = createTasksConfiguration(projectData);
        var tasksJsonText = JSON.stringify(tasksJson, null, '    ');
        return fs.writeFileAsync(paths.tasksJsonPath, tasksJsonText);
    });
}
function findTargetProjectData(projects) {
    // TODO: For now, assume the Debug configuration. Eventually, we'll need to revisit
    // this when we allow selecting configurations.
    var configurationName = 'Debug';
    var executableProjects = findExecutableProjects(projects, configurationName);
    // TODO: We arbitrarily pick the first executable projec that we find. This will need
    // revisiting when we project a "start up project" selector.
    var targetProject = executableProjects.length > 0
        ? executableProjects[0]
        : undefined;
    if (targetProject && targetProject.Frameworks.length > 0) {
        var config = targetProject.Configurations.find(function (c) { return c.Name === configurationName; });
        if (config) {
            return {
                projectPath: targetProject.Path ? vscode.Uri.file(targetProject.Path) : undefined,
                projectJsonPath: vscode.Uri.file(path.join(targetProject.Path, 'project.json')),
                targetFramework: targetProject.Frameworks[0].ShortName,
                executableName: path.basename(config.CompilationOutputAssemblyFile),
                configurationName: configurationName
            };
        }
    }
    return undefined;
}
function findExecutableProjects(projects, configName) {
    var result = [];
    projects.forEach(function (project) {
        project.Configurations.forEach(function (configuration) {
            if (configuration.Name === configName && configuration.EmitEntryPoint === true) {
                if (project.Frameworks.length > 0) {
                    result.push(project);
                }
            }
        });
    });
    return result;
}
function hasWebServerDependency(targetProjectData) {
    if (!targetProjectData || !targetProjectData.projectJsonPath) {
        return false;
    }
    var projectJson = fs.readFileSync(targetProjectData.projectJsonPath.fsPath, 'utf8');
    projectJson = projectJson.replace(/^\uFEFF/, '');
    var projectJsonObject;
    try {
        // TODO: This error should be surfaced to the user. If the JSON can't be parsed
        // (maybe due to a syntax error like an extra comma), the user should be notified
        // to fix up their project.json.
        projectJsonObject = JSON.parse(projectJson);
    }
    catch (error) {
        projectJsonObject = null;
    }
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
function addLaunchJsonIfNecessary(projectData, paths, operations) {
    return new Promise(function (resolve, reject) {
        if (!operations.addLaunchJson) {
            return resolve();
        }
        var isWebProject = hasWebServerDependency(projectData);
        var launchJson = createLaunchJson(projectData, isWebProject);
        var launchJsonText = JSON.stringify(launchJson, null, '    ');
        return fs.writeFileAsync(paths.launchJsonPath, launchJsonText);
    });
}
function addAssetsIfNecessary(server) {
    if (!vscode.workspace.rootPath) {
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
                    var data = findTargetProjectData(info.DotNet.Projects);
                    var paths = getPaths();
                    return fs.ensureDirAsync(paths.vscodeFolder).then(function () {
                        return Promise.all([
                            addTasksJsonIfNecessary(data, paths, operations),
                            addLaunchJsonIfNecessary(data, paths, operations)
                        ]);
                    });
                });
            });
        }
    });
}
exports.addAssetsIfNecessary = addAssetsIfNecessary;
//# sourceMappingURL=assets.js.map