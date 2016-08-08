'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode = require('vscode');
var path = require('path');
var child_process = require('child_process');
var telemetryContracts_1 = require('../common/telemetryContracts');
var telemetry_1 = require('../common/telemetry');
var ROPE_PYTHON_VERSION = 'Currently code refactoring is only supported in Python 2.x';
var ERROR_PREFIX = '$ERROR';
var RefactorProxy = (function (_super) {
    __extends(RefactorProxy, _super);
    function RefactorProxy(extensionDir, pythonSettings, workspaceRoot) {
        if (workspaceRoot === void 0) { workspaceRoot = vscode.workspace.rootPath; }
        _super.call(this, function () { });
        this.pythonSettings = pythonSettings;
        this.workspaceRoot = workspaceRoot;
        this._previousOutData = '';
        this._previousStdErrData = '';
        this._startedSuccessfully = false;
        this._extensionDir = extensionDir;
    }
    RefactorProxy.prototype.dispose = function () {
        try {
            this._process.kill();
        }
        catch (ex) {
        }
        this._process = null;
    };
    RefactorProxy.prototype.extractVariable = function (document, name, filePath, range) {
        var command = { "lookup": "extract_variable", "file": filePath, "start": document.offsetAt(range.start).toString(), "end": document.offsetAt(range.end).toString(), "id": "1", "name": name };
        return this.sendCommand(JSON.stringify(command), telemetryContracts_1.REFACTOR.ExtractVariable);
    };
    RefactorProxy.prototype.extractMethod = function (document, name, filePath, range) {
        var command = { "lookup": "extract_method", "file": filePath, "start": document.offsetAt(range.start).toString(), "end": document.offsetAt(range.end).toString(), "id": "1", "name": name };
        return this.sendCommand(JSON.stringify(command), telemetryContracts_1.REFACTOR.ExtractVariable);
    };
    RefactorProxy.prototype.sendCommand = function (command, telemetryEvent) {
        var _this = this;
        var timer = new telemetry_1.Delays();
        return this.initialize(this.pythonSettings.pythonPath).then(function () {
            return new Promise(function (resolve, reject) {
                _this._commandResolve = resolve;
                _this._commandReject = reject;
                _this._process.stdin.write(command + '\n');
            });
        }).then(function (value) {
            timer.stop();
            telemetry_1.sendTelemetryEvent(telemetryEvent, null, timer.toMeasures());
            return value;
        }).catch(function (reason) {
            timer.stop();
            telemetry_1.sendTelemetryEvent(telemetryEvent, null, timer.toMeasures());
            return Promise.reject(reason);
        });
    };
    RefactorProxy.prototype.initialize = function (pythonPath) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._initializeReject = reject;
            _this._process = child_process.spawn(pythonPath, ['-u', 'refactor.py', _this.workspaceRoot], {
                cwd: path.join(_this._extensionDir, 'pythonFiles')
            });
            _this._process.stderr.on('data', _this.handleStdError.bind(_this));
            _this._process.on('error', _this.handleError.bind(_this));
            var that = _this;
            _this._process.stdout.on('data', function (data) {
                var dataStr = data + '';
                if (!that._startedSuccessfully && dataStr.startsWith('STARTED')) {
                    that._startedSuccessfully = true;
                    return resolve();
                }
                that.onData(data);
            });
        });
    };
    RefactorProxy.prototype.handleStdError = function (data) {
        var dataStr = this._previousStdErrData = this._previousStdErrData + data + '';
        if (this._startedSuccessfully) {
            // The Rope library can send other (warning) messages in the stderr stream
            // Hence look for the prefix, if we don't have the prefix ignore them
            if (!dataStr.startsWith(ERROR_PREFIX)) {
                this._previousStdErrData = '';
                return;
            }
            var lengthOfHeader = dataStr.indexOf(':') + 1;
            var lengthOfMessage = parseInt(dataStr.substring(ERROR_PREFIX.length, lengthOfHeader - 1));
            if (dataStr.length >= lengthOfMessage + lengthOfHeader) {
                this._previousStdErrData = '';
                this.dispose();
                var errorLines = dataStr.substring(lengthOfHeader).split(/\r?\n/g);
                var hasErrorMessage = errorLines[0].trim().length > 0;
                errorLines = errorLines.filter(function (line) { return line.length > 0; });
                var errorMessage = errorLines.join('\n');
                // If there is no error message take the last line from the error (stack)
                // As this generally contains the actual error
                if (!hasErrorMessage) {
                    errorMessage = errorLines[errorLines.length - 1].trim() + '\n' + errorMessage;
                }
                this._commandReject("Refactor failed. " + errorMessage);
            }
        }
        else {
            this._initializeReject("Refactor failed. " + dataStr);
        }
    };
    RefactorProxy.prototype.handleError = function (error) {
        if (this._startedSuccessfully) {
            return this._commandReject(error);
        }
        this._initializeReject(error);
    };
    RefactorProxy.prototype.onData = function (data) {
        if (!this._commandResolve) {
            return;
        }
        // Possible there was an exception in parsing the data returned
        // So append the data then parse it
        var dataStr = this._previousOutData = this._previousOutData + data + '';
        var response;
        try {
            response = dataStr.split(/\r?\n/g).filter(function (line) { return line.length > 0; }).map(function (resp) { return JSON.parse(resp); });
            this._previousOutData = '';
        }
        catch (ex) {
            // Possible we've only received part of the data, hence don't clear previousData
            return;
        }
        this.dispose();
        this._commandResolve(response[0]);
        this._commandResolve = null;
    };
    return RefactorProxy;
}(vscode.Disposable));
exports.RefactorProxy = RefactorProxy;
//# sourceMappingURL=proxy.js.map