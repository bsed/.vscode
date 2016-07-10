/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
var vscode = require('vscode');
var runFileName = process.platform === 'win32' ? 'run.cmd' : 'run';
var omnisharpFileName = process.platform === 'win32' ? 'OmniSharp.cmd' : 'OmniSharp';
var omnisharpExeFileName = process.platform === 'win32' ? 'OmniSharp.exe' : 'OmniSharp';
function getLaunchFilePath(filePathOrFolder) {
    return fs.lstatAsync(filePathOrFolder).then(function (stats) {
        // If a file path was passed, assume its the launch file.
        if (stats.isFile()) {
            return filePathOrFolder;
        }
        // Otherwise, search the specified folder.
        var candidate;
        candidate = path.join(filePathOrFolder, runFileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        candidate = path.join(filePathOrFolder, omnisharpFileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        candidate = path.join(filePathOrFolder, omnisharpExeFileName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        throw new Error("Could not fnd launch file in " + filePathOrFolder + ". Expected '" + runFileName + "', '" + omnisharpFileName + "', '" + omnisharpExeFileName + "'");
    });
}
function getLaunchPathFromSettings() {
    var setting = vscode.workspace.getConfiguration('csharp').get('omnisharp');
    if (setting) {
        return getLaunchFilePath(setting)
            .catch(function (err) {
            vscode.window.showWarningMessage("Invalid \"csharp.omnisharp\" use setting specified ('" + setting + ").");
            throw err;
        });
    }
    return Promise.reject(new Error('OmniSharp use setting does not exists.'));
}
function getLaunchPathFromDefaultInstallFolder() {
    var installLocation = path.join(__dirname, '../.omnisharp');
    return getLaunchFilePath(installLocation);
}
function getOmnisharpLaunchFilePath() {
    // Attempt to find launch file path first from settings, and then from the default install location.
    return getLaunchPathFromSettings()
        .catch(getLaunchPathFromDefaultInstallFolder);
}
exports.getOmnisharpLaunchFilePath = getOmnisharpLaunchFilePath;
//# sourceMappingURL=omnisharpPath.js.map