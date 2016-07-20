/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode_1 = require('vscode');
var settings_1 = require('./helpers/settings');
var constants_1 = require('./helpers/constants');
var strings_1 = require('./helpers/strings');
var constants_2 = require('./helpers/constants');
var composercontext_1 = require('./contexts/composercontext');
var composerclient_1 = require('./clients/composerclient');
var strings = require('./base/common/strings');
var ComposerExtension = (function (_super) {
    __extends(ComposerExtension, _super);
    function ComposerExtension() {
        var _this = this;
        _super.call(this, function () {
            _this.disposables.map(function (d) { d.dispose(); });
        });
        this.disposables = [];
        this.initializeExtension();
        // Add the event listener for settings changes, then re-initialized the extension
        vscode_1.workspace.onDidChangeConfiguration(function () {
            _this.reinitialize();
        });
    }
    ComposerExtension.prototype.initializeExtension = function () {
        var _this = this;
        this.context = new composercontext_1.ComposerContext(vscode_1.workspace.rootPath);
        this.settings = new settings_1.Settings();
        if (this.settings.enabled) {
            this.client = new composerclient_1.ComposerClient({
                executablePath: this.settings.executablePath,
                env: process.env
            });
            this.channel = vscode_1.window.createOutputChannel(constants_2.Constants.OutputChannel);
            this.disposables.push(this.channel);
            this.client.onOutput(function (output) {
                _this.channel.append(output);
            });
        }
        // Register commands.
        this.registerCommand(constants_1.CommandNames.About, function () {
            _this.reportExecutionResult(_this.client.about());
        });
        this.registerCommand(constants_1.CommandNames.Archive, function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerArchiveInput, placeHolder: strings_1.Strings.ComposerArchivePlaceHolder }).then(function (pkg) {
                if (typeof (pkg) !== 'undefined') {
                    var args = (pkg !== strings.empty)
                        ? pkg.split(strings.space)
                        : [];
                    _this.reportExecutionResult(_this.client.archive.apply(_this.client, args));
                }
            });
        });
        this.registerCommand(constants_1.CommandNames.ClearCache, function () {
            _this.reportExecutionResult(_this.client.clearCache());
        });
        this.registerCommand(constants_1.CommandNames.Diagnose, function () {
            _this.reportExecutionResult(_this.client.diagnose());
        });
        this.registerCommand(constants_1.CommandNames.DumpAutoload, function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerDumpAutoloadInput, placeHolder: strings_1.Strings.ComposerDumpAutoloadPlaceHolder }).then(function (options) {
                if (typeof (options) !== 'undefined') {
                    var args = (options !== strings.empty)
                        ? options.split(strings.space)
                        : [];
                    _this.reportExecutionResult(_this.client.dumpAutoload.apply(_this.client, args));
                }
            });
        });
        this.registerCommand(constants_1.CommandNames.Install, this.ensureComposerProject(function () {
            _this.reportExecutionResult(_this.client.install());
        }));
        this.registerCommand(constants_1.CommandNames.Remove, this.ensureComposerProject(function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerRemoveInput, placeHolder: strings_1.Strings.ComposerRemovePlaceHolder }).then(function (options) {
                if (typeof (options) !== 'undefined' && options !== strings.empty) {
                    var args = options.split(strings.space);
                    _this.reportExecutionResult(_this.client.remove.apply(_this.client, args));
                }
            });
        }));
        this.registerCommand(constants_1.CommandNames.Require, this.ensureComposerProject(function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerRequireInput, placeHolder: strings_1.Strings.ComposerRequirePlaceHolder }).then(function (options) {
                if (typeof (options) !== 'undefined' && options !== strings.empty) {
                    var args = options.split(strings.space);
                    _this.reportExecutionResult(_this.client.require.apply(_this.client, args));
                }
            });
        }));
        this.registerCommand(constants_1.CommandNames.RunScript, this.ensureComposerProject(function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerRunScriptInput, placeHolder: strings_1.Strings.ComposerRunScriptPlaceHolder }).then(function (options) {
                if (typeof (options) !== 'undefined' && options !== strings.empty) {
                    var args = options.split(strings.space);
                    _this.reportExecutionResult(_this.client.runScript.apply(_this.client, args));
                }
            });
        }));
        this.registerCommand(constants_1.CommandNames.SelfUpdate, function () {
            _this.reportExecutionResult(_this.client.selfUpdate());
            ;
        });
        this.registerCommand(constants_1.CommandNames.Show, function () {
            vscode_1.window.showInputBox({ prompt: strings_1.Strings.ComposerShowInput, placeHolder: strings_1.Strings.ComposerShowPlaceHolder }).then(function (options) {
                if (typeof (options) !== 'undefined') {
                    var args = (options !== strings.empty)
                        ? options.split(strings.space)
                        : [];
                    _this.reportExecutionResult(_this.client.show.apply(_this.client, args));
                }
            });
        });
        this.registerCommand(constants_1.CommandNames.Status, this.ensureComposerProject(function () {
            _this.client.status();
        }));
        this.registerCommand(constants_1.CommandNames.Update, this.ensureComposerProject(function () {
            _this.reportExecutionResult(_this.client.update());
        }));
        this.registerCommand(constants_1.CommandNames.Validate, this.ensureComposerProject(function () {
            _this.reportExecutionResult(_this.client.validate());
        }));
        this.registerCommand(constants_1.CommandNames.Version, function () {
            _this.reportExecutionResult(_this.client.version());
        });
    };
    // Reinitialize the extension when coming back online
    ComposerExtension.prototype.reinitialize = function () {
        this.dispose();
        this.initializeExtension();
    };
    ComposerExtension.prototype.safeExecute = function (func) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (_this.settings && _this.settings.enabled) {
                try {
                    _this.channel.show();
                    return func.apply(_this, args);
                }
                catch (error) {
                    vscode_1.window.showErrorMessage(error.message);
                }
            }
        };
    };
    ComposerExtension.prototype.ensureComposerProject = function (func) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (_this.context.isComposerProject) {
                return func.apply(_this, args);
            }
            vscode_1.window.showInformationMessage(strings_1.Strings.ComposerProjectRequired);
        };
    };
    ComposerExtension.prototype.reportExecutionResult = function (result) {
        var _this = this;
        result.then(function () {
            if (_this.channel) {
                _this.channel.appendLine(strings_1.Strings.CommandCompletedSuccessfully + '\n');
            }
        }, function () {
            if (_this.channel) {
                _this.channel.appendLine(strings_1.Strings.CommandCompletedWithErrors + '\n');
            }
        });
    };
    /**
     * Registers a command that can be invoked via a keyboard shortcut,
     * a menu item, an action, or directly.
     *
     * Registering a command with an existing command identifier twice
     * will cause an error.
     *
     * @param command A unique identifier for the command.
     * @param callback A command handler function.
     * @param thisArg The `this` context used when invoking the handler function.
     * @return Disposable which unregisters this command on disposal.
     */
    ComposerExtension.prototype.registerCommand = function (command, callback, thisArg) {
        this.disposables.push(vscode_1.commands.registerCommand(command, this.safeExecute(callback), thisArg));
    };
    return ComposerExtension;
}(vscode_1.Disposable));
exports.ComposerExtension = ComposerExtension;
//# sourceMappingURL=composer-extension.js.map