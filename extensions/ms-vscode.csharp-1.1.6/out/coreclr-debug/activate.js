/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var util_1 = require('./util');
var debugInstall = require('./install');
var _reporter = null;
var _channel = null;
var _util = null;
function activate(context, reporter) {
    _reporter = reporter;
    _channel = vscode.window.createOutputChannel('coreclr-debug');
    _util = new util_1.CoreClrDebugUtil(context.extensionPath, _channel);
    if (util_1.CoreClrDebugUtil.existsSync(_util.installCompleteFilePath())) {
        console.log('.NET Core Debugger tools already installed');
        return;
    }
    if (!isOnPath('dotnet')) {
        var getDotNetMessage_1 = "Get .NET CLI tools";
        vscode.window.showErrorMessage("The .NET CLI tools cannot be located. .NET Core debugging will not be enabled. Make sure .NET CLI tools are installed and are on the path.", getDotNetMessage_1).then(function (value) {
            if (value === getDotNetMessage_1) {
                var open = require('open');
                open("http://dotnet.github.io/getting-started/");
            }
        });
        return;
    }
    var installer = new debugInstall.DebugInstaller(_util);
    _util.createInstallLog();
    var runtimeId = getPlatformRuntimeId();
    var statusBarMessage = vscode.window.setStatusBarMessage("Downloading and configuring the .NET Core Debugger...");
    var installStage = "installBegin";
    var installError = "";
    writeInstallBeginFile().then(function () {
        return installer.install(runtimeId);
    }).then(function () {
        installStage = "completeSuccess";
        statusBarMessage.dispose();
        vscode.window.setStatusBarMessage('Successfully installed .NET Core Debugger.');
    })
        .catch(function (error) {
        var viewLogMessage = "View Log";
        vscode.window.showErrorMessage('Error while installing .NET Core Debugger.', viewLogMessage).then(function (value) {
            if (value === viewLogMessage) {
                _channel.show(vscode.ViewColumn.Three);
            }
        });
        statusBarMessage.dispose();
        installStage = error.installStage;
        installError = error.installError;
    }).then(function () {
        // log telemetry and delete install begin file
        logTelemetry('Acquisition', { installStage: installStage, installError: installError });
        try {
            deleteInstallBeginFile();
        }
        catch (err) {
        }
        _util.closeInstallLog();
    });
}
exports.activate = activate;
function logTelemetry(eventName, properties) {
    if (_reporter !== null) {
        _reporter.sendTelemetryEvent('coreclr-debug/' + eventName, properties);
    }
}
function writeInstallBeginFile() {
    return util_1.CoreClrDebugUtil.writeEmptyFile(_util.installBeginFilePath());
}
function deleteInstallBeginFile() {
    if (util_1.CoreClrDebugUtil.existsSync(_util.installBeginFilePath())) {
        fs.unlinkSync(_util.installBeginFilePath());
    }
}
// Determines if the specified command is in one of the directories in the PATH environment variable.
function isOnPath(command) {
    var pathValue = process.env['PATH'];
    if (!pathValue) {
        return false;
    }
    var fileName = command;
    if (process.platform == 'win32') {
        // on Windows, add a '.exe', and the path is semi-colon seperatode
        fileName = fileName + ".exe";
    }
    var pathSegments = pathValue.split(path.delimiter);
    for (var _i = 0, pathSegments_1 = pathSegments; _i < pathSegments_1.length; _i++) {
        var segment = pathSegments_1[_i];
        if (segment.length === 0 || !path.isAbsolute(segment)) {
            continue;
        }
        var segmentPath = path.join(segment, fileName);
        try {
            if (util_1.CoreClrDebugUtil.existsSync(segmentPath)) {
                return true;
            }
        }
        catch (err) {
            // any error from existsSync can be treated as the command not being on the path
            continue;
        }
    }
    return false;
}
function getPlatformRuntimeId() {
    switch (process.platform) {
        case 'win32':
            return 'win7-x64';
        case 'darwin':
            return getDotnetRuntimeId();
        case 'linux':
            return getDotnetRuntimeId();
        default:
            _util.log('Error: Unsupported platform ' + process.platform);
            throw Error('Unsupported platform ' + process.platform);
    }
}
function getDotnetRuntimeId() {
    _util.log("Starting 'dotnet --info'");
    var cliVersionErrorMessage = "Ensure that .NET Core CLI Tools version >= 1.0.0-beta-002173 is installed. Run 'dotnet --version' to see what version is installed.";
    var child = child_process.spawnSync('dotnet', ['--info'], { cwd: _util.coreClrDebugDir() });
    if (child.stderr.length > 0) {
        _util.log('Error: ' + child.stderr.toString());
    }
    var out = child.stdout.toString();
    if (out.length > 0) {
        _util.log(out);
    }
    if (child.status !== 0) {
        var message = "Error: 'dotnet --info' failed with error " + child.status;
        _util.log(message);
        _util.log(cliVersionErrorMessage);
        throw new Error(message);
    }
    if (out.length === 0) {
        var message = "Error: 'dotnet --info' provided no output";
        _util.log(message);
        _util.log(cliVersionErrorMessage);
        throw new Error(message);
    }
    var lines = out.split('\n');
    var ridLine = lines.filter(function (value) {
        return value.trim().startsWith('RID:');
    });
    if (ridLine.length < 1) {
        _util.log("Error: Cannot find 'RID' property");
        _util.log(cliVersionErrorMessage);
        throw new Error('Cannot obtain Runtime ID from dotnet cli');
    }
    var rid = ridLine[0].split(':')[1].trim();
    if (!rid) {
        _util.log("Error: Unable to parse 'RID' property.");
        _util.log(cliVersionErrorMessage);
        throw new Error('Unable to determine Runtime ID');
    }
    return rid;
}
//# sourceMappingURL=activate.js.map