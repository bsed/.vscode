/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var path = require('path');
var fs = require('fs');
var os = require('os');
var CoreClrDebugUtil = (function () {
    function CoreClrDebugUtil(extensionDir, channel) {
        this._extensionDir = '';
        this._coreClrDebugDir = '';
        this._debugAdapterDir = '';
        this._installLogPath = '';
        this._installBeginFilePath = '';
        this._installCompleteFilePath = '';
        this._installLog = null;
        this._channel = null;
        this._extensionDir = extensionDir;
        this._coreClrDebugDir = path.join(this._extensionDir, 'coreclr-debug');
        this._debugAdapterDir = path.join(this._coreClrDebugDir, 'debugAdapters');
        this._installLogPath = path.join(this._coreClrDebugDir, 'install.log');
        this._installBeginFilePath = path.join(this._coreClrDebugDir, 'install.begin');
        this._installCompleteFilePath = path.join(this._debugAdapterDir, 'install.complete');
        this._channel = channel;
    }
    CoreClrDebugUtil.prototype.extensionDir = function () {
        if (this._extensionDir === '') {
            throw new Error('Failed to set extension directory');
        }
        return this._extensionDir;
    };
    CoreClrDebugUtil.prototype.coreClrDebugDir = function () {
        if (this._coreClrDebugDir === '') {
            throw new Error('Failed to set coreclrdebug directory');
        }
        return this._coreClrDebugDir;
    };
    CoreClrDebugUtil.prototype.debugAdapterDir = function () {
        if (this._debugAdapterDir === '') {
            throw new Error('Failed to set debugadpter directory');
        }
        return this._debugAdapterDir;
    };
    CoreClrDebugUtil.prototype.installLogPath = function () {
        if (this._installLogPath === '') {
            throw new Error('Failed to set install log path');
        }
        return this._installLogPath;
    };
    CoreClrDebugUtil.prototype.installBeginFilePath = function () {
        if (this._installBeginFilePath === '') {
            throw new Error('Failed to set install begin file path');
        }
        return this._installBeginFilePath;
    };
    CoreClrDebugUtil.prototype.installCompleteFilePath = function () {
        if (this._installCompleteFilePath === '') {
            throw new Error('Failed to set install complete file path');
        }
        return this._installCompleteFilePath;
    };
    CoreClrDebugUtil.prototype.createInstallLog = function () {
        this._installLog = fs.createWriteStream(this.installLogPath());
    };
    CoreClrDebugUtil.prototype.closeInstallLog = function () {
        if (this._installLog !== null) {
            this._installLog.close();
        }
    };
    CoreClrDebugUtil.prototype.log = function (message) {
        console.log(message);
        if (this._installLog != null) {
            this._installLog.write(message);
        }
        if (this._channel != null) {
            this._channel.appendLine(message);
        }
    };
    CoreClrDebugUtil.writeEmptyFile = function (path) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path, '', function (err) {
                if (err) {
                    reject(err.code);
                }
                else {
                    resolve();
                }
            });
        });
    };
    CoreClrDebugUtil.existsSync = function (path) {
        try {
            fs.accessSync(path, fs.F_OK);
            return true;
        }
        catch (err) {
            if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
                return false;
            }
            else {
                throw Error(err.code);
            }
        }
    };
    CoreClrDebugUtil.getPlatformExeExtension = function () {
        if (process.platform === 'win32') {
            return '.exe';
        }
        return '';
    };
    CoreClrDebugUtil.getPlatformLibExtension = function () {
        switch (process.platform) {
            case 'win32':
                return '.dll';
            case 'darwin':
                return '.dylib';
            case 'linux':
                return '.so';
            default:
                throw Error('Unsupported platform ' + process.platform);
        }
    };
    /** Used for diagnostics only */
    CoreClrDebugUtil.prototype.logToFile = function (message) {
        var logFolder = path.resolve(this.coreClrDebugDir(), "extension.log");
        fs.writeFileSync(logFolder, "" + message + os.EOL, { flag: 'a' });
    };
    return CoreClrDebugUtil;
}());
exports.CoreClrDebugUtil = CoreClrDebugUtil;
//# sourceMappingURL=util.js.map