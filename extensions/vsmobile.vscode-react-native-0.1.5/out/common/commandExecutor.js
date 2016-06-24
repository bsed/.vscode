// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var log_1 = require("./log/log");
var node_1 = require("./node/node");
var hostPlatform_1 = require("../common/hostPlatform");
var errorHelper_1 = require("./error/errorHelper");
var internalErrorCode_1 = require("./error/internalErrorCode");
(function (CommandStatus) {
    CommandStatus[CommandStatus["Start"] = 0] = "Start";
    CommandStatus[CommandStatus["End"] = 1] = "End";
})(exports.CommandStatus || (exports.CommandStatus = {}));
var CommandStatus = exports.CommandStatus;
var CommandExecutor = (function () {
    function CommandExecutor(currentWorkingDirectory) {
        this.childProcess = new node_1.Node.ChildProcess();
        this.currentWorkingDirectory = currentWorkingDirectory || process.cwd();
    }
    CommandExecutor.prototype.execute = function (command, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        log_1.Log.logCommandStatus(command, CommandStatus.Start);
        return this.childProcess.execToString(command, { cwd: this.currentWorkingDirectory, env: options.env })
            .then(function (stdout) {
            log_1.Log.logMessage(stdout);
            log_1.Log.logCommandStatus(command, CommandStatus.End);
        }, function (reason) {
            return _this.generateRejectionForCommand(command, reason);
        });
    };
    /**
     * Spawns a child process with the params passed
     * This method waits until the spawned process finishes execution
     * {command} - The command to be invoked in the child process
     * {args} - Arguments to be passed to the command
     * {options} - additional options with which the child process needs to be spawned
     */
    CommandExecutor.prototype.spawn = function (command, args, options) {
        if (options === void 0) { options = {}; }
        return this.spawnChildProcess(command, args, options).outcome;
    };
    /**
     * Spawns the React Native packager in a child process.
     */
    CommandExecutor.prototype.spawnReactPackager = function (args, options) {
        if (options === void 0) { options = {}; }
        return this.spawnReactCommand("start", args, options);
    };
    /**
     * Kills the React Native packager in a child process.
     */
    CommandExecutor.prototype.killReactPackager = function (packagerProcess) {
        var _this = this;
        log_1.Log.logMessage("Stopping Packager");
        if (packagerProcess) {
            return Q({}).then(function () {
                if (hostPlatform_1.HostPlatform.getPlatformId() === hostPlatform_1.HostPlatformId.WINDOWS) {
                    return _this.childProcess.exec("taskkill /pid " + packagerProcess.pid + " /T /F").outcome;
                }
                else {
                    packagerProcess.kill();
                }
            }).then(function () {
                log_1.Log.logMessage("Packager stopped");
            });
        }
        else {
            log_1.Log.logMessage("Packager not found");
            return Q.resolve(void 0);
        }
    };
    /**
     * Executes a react native command and waits for its completion.
     */
    CommandExecutor.prototype.spawnReactCommand = function (command, args, options) {
        if (options === void 0) { options = {}; }
        var reactCommand = hostPlatform_1.HostPlatform.getNpmCliCommand(CommandExecutor.ReactNativeCommand);
        return this.spawnChildProcess(reactCommand, this.combineArguments(command, args), options);
    };
    CommandExecutor.prototype.spawnChildProcess = function (command, args, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var spawnOptions = Object.assign({}, { cwd: this.currentWorkingDirectory }, options);
        var commandWithArgs = command + " " + args.join(" ");
        log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.Start);
        var result = this.childProcess.spawn(command, args, spawnOptions);
        result.stderr.on("data", function (data) {
            log_1.Log.logStreamData(data, process.stderr);
        });
        result.stdout.on("data", function (data) {
            log_1.Log.logStreamData(data, process.stdout);
        });
        result.outcome = result.outcome.then(function () {
            return log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.End);
        }, function (reason) {
            return _this.generateRejectionForCommand(commandWithArgs, reason);
        });
        return result;
    };
    CommandExecutor.prototype.generateRejectionForCommand = function (command, reason) {
        return Q.reject(errorHelper_1.ErrorHelper.getNestedError(reason, internalErrorCode_1.InternalErrorCode.CommandFailed, command));
    };
    CommandExecutor.prototype.combineArguments = function (firstArgument, otherArguments) {
        if (otherArguments === void 0) { otherArguments = []; }
        return [firstArgument].concat(otherArguments);
    };
    CommandExecutor.ReactNativeCommand = "react-native";
    return CommandExecutor;
}());
exports.CommandExecutor = CommandExecutor;

//# sourceMappingURL=commandExecutor.js.map
