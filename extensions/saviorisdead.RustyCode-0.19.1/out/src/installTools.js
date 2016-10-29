"use strict";
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var pathService_1 = require('./services/pathService');
var statusBarService_1 = require('./services/statusBarService');
var tools = {
    'racer': pathService_1.default.getRacerPath(),
    'rustfmt': pathService_1.default.getRustfmtPath(),
    'rustsym': pathService_1.default.getRustsymPath()
};
var channel = vscode.window.createOutputChannel('Rust Tool Installer');
function getMissingTools() {
    var keys = Object.keys(tools);
    var promises = keys.map(function (tool) {
        // Check if the path exists as-is.
        var userPath = tools[tool];
        if (fs.existsSync(userPath)) {
            return Promise.resolve(null);
        }
        // If the extension is running on Windows and no extension was 
        // specified (likely because the user didn't configure a custom path), 
        // then prefix one for them.
        if (process.platform === 'win32' && path.extname(userPath).length === 0) {
            userPath += '.exe';
        }
        // Check if the tool exists on the PATH
        var parts = (process.env.PATH || '').split(path.delimiter);
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            var binPath = path.join(part, userPath);
            if (fs.existsSync(binPath)) {
                return Promise.resolve(null);
            }
        }
        // The tool wasn't found, we should install it
        return Promise.resolve(tool);
    });
    return Promise.all(promises);
}
function offerToInstallTools() {
    getMissingTools().then(function (result) {
        var missingTools = result.filter(function (tool) { return tool != null; });
        if (missingTools.length > 0) {
            vscode.commands.registerCommand('rust.install_tools', function () {
                var option = {
                    title: 'Install'
                };
                // Plurality is important. :')
                var group = missingTools.length > 1 ? 'them' : 'it';
                vscode.window.showInformationMessage("You are missing " + missingTools.join(', ') + ". Would you like to install " + group + "?", option)
                    .then(function (selection) {
                    if (selection === option) {
                        channel.clear();
                        channel.show();
                        missingTools.forEach(installTool);
                        statusBarService_1.default.hideStatus();
                    }
                });
            });
            statusBarService_1.default.showStatus('Rust Tools Missing', 'rust.install_tools', 'Missing Rust tools used by RustyCode');
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = offerToInstallTools;
function installTool(tool) {
    channel.appendLine("Executing \"cargo install " + tool + "\"");
    var proc = cp.spawn(pathService_1.default.getCargoPath(), ['install', tool], { env: process.env });
    proc.stdout.on('data', function (data) {
        channel.append(data.toString());
    });
    proc.stderr.on('data', function (data) {
        channel.append(data.toString());
    });
    proc.on('err', function (err) {
        if (err.code === 'ENOENT') {
            vscode.window.showInformationMessage('The "cargo" command is not available. Make sure it is installed.');
        }
    });
    proc.on('exit', function () {
        proc.removeAllListeners();
        proc = null;
    });
}
//# sourceMappingURL=installTools.js.map