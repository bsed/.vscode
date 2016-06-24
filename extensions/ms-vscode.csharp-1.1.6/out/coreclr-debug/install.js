/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var util_1 = require('./util');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var fs_extra = require('fs-extra-promise');
var InstallError = (function (_super) {
    __extends(InstallError, _super);
    function InstallError(stage, error) {
        _super.call(this, "Error during installation.");
        this.installStage = stage;
        this.installError = error;
    }
    return InstallError;
}(Error));
exports.InstallError = InstallError;
var DebugInstaller = (function () {
    function DebugInstaller(util, isOffline) {
        this._util = null;
        this._util = util;
        this._isOffline = isOffline || false;
    }
    DebugInstaller.prototype.install = function (runtimeId) {
        var _this = this;
        var installStage = 'writeProjectJson';
        return this.writeProjectJson(runtimeId).then(function () {
            installStage = 'dotnetRestore';
            return _this.spawnChildProcess('dotnet', ['--verbose', 'restore', '--configfile', 'NuGet.config'], _this._util.coreClrDebugDir());
        }).then(function () {
            installStage = "dotnetPublish";
            return _this.spawnChildProcess('dotnet', ['--verbose', 'publish', '-r', runtimeId, '-o', _this._util.debugAdapterDir()], _this._util.coreClrDebugDir());
        }).then(function () {
            installStage = "ensureAd7";
            return _this.ensureAd7EngineExists(_this._util.debugAdapterDir());
        }).then(function () {
            installStage = "renameDummyEntrypoint";
            return _this.renameDummyEntrypoint();
        }).then(function () {
            installStage = "rewriteManifest";
            _this.rewriteManifest();
            installStage = "writeCompletionFile";
            return _this.writeCompletionFile();
        }).catch(function (error) {
            throw new InstallError(installStage, error.toString());
        });
    };
    DebugInstaller.prototype.clean = function () {
        var _this = this;
        var cleanItems = [];
        cleanItems.push(this._util.debugAdapterDir());
        cleanItems.push(this._util.installLogPath());
        cleanItems.push(path.join(this._util.coreClrDebugDir(), "bin"));
        cleanItems.push(path.join(this._util.coreClrDebugDir(), "obj"));
        cleanItems.push(path.join(this._util.coreClrDebugDir(), 'project.json'));
        cleanItems.push(path.join(this._util.coreClrDebugDir(), 'project.lock.json'));
        cleanItems.forEach(function (item) {
            if (util_1.CoreClrDebugUtil.existsSync(item)) {
                _this._util.log("Cleaning " + item);
                fs_extra.removeSync(item);
            }
        });
    };
    DebugInstaller.prototype.rewriteManifest = function () {
        var manifestPath = path.join(this._util.extensionDir(), 'package.json');
        var manifestString = fs.readFileSync(manifestPath, 'utf8');
        var manifestObject = JSON.parse(manifestString);
        delete manifestObject.contributes.debuggers[0].runtime;
        delete manifestObject.contributes.debuggers[0].program;
        var programString = './coreclr-debug/debugAdapters/OpenDebugAD7';
        manifestObject.contributes.debuggers[0].windows = { program: programString + '.exe' };
        manifestObject.contributes.debuggers[0].osx = { program: programString };
        manifestObject.contributes.debuggers[0].linux = { program: programString };
        manifestString = JSON.stringify(manifestObject, null, 2);
        fs.writeFileSync(manifestPath, manifestString);
    };
    DebugInstaller.prototype.writeCompletionFile = function () {
        return util_1.CoreClrDebugUtil.writeEmptyFile(this._util.installCompleteFilePath());
    };
    DebugInstaller.prototype.renameDummyEntrypoint = function () {
        var src = path.join(this._util.debugAdapterDir(), 'dummy');
        var dest = path.join(this._util.debugAdapterDir(), 'OpenDebugAD7');
        if (!util_1.CoreClrDebugUtil.existsSync(src)) {
            if (util_1.CoreClrDebugUtil.existsSync(src + '.exe')) {
                src += '.exe';
                dest += '.exe';
            }
        }
        var promise = new Promise(function (resolve, reject) {
            fs.rename(src, dest, function (err) {
                if (err) {
                    reject(err.code);
                }
                else {
                    resolve();
                }
            });
        });
        return promise;
    };
    DebugInstaller.prototype.ensureAd7EngineExists = function (outputDirectory) {
        var _this = this;
        var filePath = path.join(outputDirectory, "coreclr.ad7Engine.json");
        return new Promise(function (resolve, reject) {
            fs.exists(filePath, function (exists) {
                if (exists) {
                    return resolve();
                }
                else {
                    _this._util.log(filePath + " does not exist.");
                    _this._util.log('');
                    // NOTE: The minimum build number is actually less than 1584, but this is the minimum
                    // build that I have tested.
                    _this._util.log("Error: The .NET CLI did not correctly restore debugger files. Ensure that you have .NET CLI version 1.0.0 build #001584 or newer. You can check your .NET CLI version using 'dotnet --version'.");
                    return reject("The .NET CLI did not correctly restore debugger files.");
                }
            });
        });
    };
    DebugInstaller.prototype.writeProjectJson = function (runtimeId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var projectJsonPath = path.join(_this._util.coreClrDebugDir(), 'project.json');
            _this._util.log('Creating ' + projectJsonPath);
            var projectJson = _this.createProjectJson(runtimeId);
            fs.writeFile(projectJsonPath, JSON.stringify(projectJson, null, 2), { encoding: 'utf8' }, function (err) {
                if (err) {
                    _this._util.log('Error: Unable to write to project.json: ' + err.message);
                    reject(err.code);
                }
                else {
                    resolve();
                }
            });
        });
    };
    DebugInstaller.prototype.createProjectJson = function (targetRuntime) {
        var projectJson = {
            name: "dummy",
            buildOptions: {
                emitEntryPoint: true
            },
            dependencies: {
                "Microsoft.VisualStudio.clrdbg": "14.0.25406-preview-3044032",
                "Microsoft.VisualStudio.clrdbg.MIEngine": "14.0.30610-preview-1",
                "Microsoft.VisualStudio.OpenDebugAD7": "1.0.20614-preview-2",
                "NETStandard.Library": "1.5.0-rc2-24027",
                "Newtonsoft.Json": "7.0.1",
                "Microsoft.VisualStudio.Debugger.Interop.Portable": "1.0.1",
                "System.Collections.Specialized": "4.0.1-rc2-24027",
                "System.Collections.Immutable": "1.2.0-rc2-24027",
                "System.Diagnostics.Process": "4.1.0-rc2-24027",
                "System.Diagnostics.StackTrace": "4.0.1-rc2-24027",
                "System.Dynamic.Runtime": "4.0.11-rc2-24027",
                "Microsoft.CSharp": "4.0.1-rc2-24027",
                "System.Threading.Tasks.Dataflow": "4.6.0-rc2-24027",
                "System.Threading.Thread": "4.0.0-rc2-24027",
                "System.Xml.XDocument": "4.0.11-rc2-24027",
                "System.Xml.XmlDocument": "4.0.1-rc2-24027",
                "System.Xml.XmlSerializer": "4.0.11-rc2-24027",
                "System.ComponentModel": "4.0.1-rc2-24027",
                "System.ComponentModel.Annotations": "4.1.0-rc2-24027",
                "System.ComponentModel.EventBasedAsync": "4.0.11-rc2-24027",
                "System.Runtime.Serialization.Primitives": "4.1.1-rc2-24027",
                "System.Net.Http": "4.0.1-rc2-24027"
            },
            frameworks: {
                "netcoreapp1.0": {
                    imports: ["dnxcore50", "portable-net45+win8"]
                }
            },
            runtimes: {}
        };
        projectJson.runtimes[targetRuntime] = {};
        if (this._isOffline) {
            projectJson.dependencies["Microsoft.NetCore.DotNetHostPolicy"] = "1.0.1-rc-002702";
        }
        return projectJson;
    };
    DebugInstaller.prototype.spawnChildProcess = function (process, args, workingDirectory) {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            var child = child_process.spawn(process, args, { cwd: workingDirectory });
            child.stdout.on('data', function (data) {
                _this._util.log("" + data);
            });
            child.stderr.on('data', function (data) {
                _this._util.log("Error: " + data);
            });
            child.on('close', function (code) {
                if (code != 0) {
                    _this._util.log(process + " exited with error code " + code);
                    reject(new Error(code.toString()));
                }
                else {
                    resolve();
                }
            });
        });
        return promise;
    };
    return DebugInstaller;
}());
exports.DebugInstaller = DebugInstaller;
//# sourceMappingURL=install.js.map