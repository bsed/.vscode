/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require('vscode');
var objects = require('./base/common/objects');
var execution_1 = require('./base/common/execution');
var child_process_1 = require('child_process');
var strings = require('./base/common/strings');
var encoding_1 = require('./base/node/encoding');
var vscode = require('vscode');
var ComposerSettings = (function () {
    function ComposerSettings() {
        this.changeListeners = [];
        vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this);
        this.initializeSettings();
    }
    ComposerSettings.prototype.initializeSettings = function () {
        var configuration = vscode.workspace.getConfiguration('composer');
        this.enabled = configuration.get('enabled');
        this.executablePath = configuration.get('executablePath');
    };
    ComposerSettings.prototype.onChange = function (listener) {
        var _this = this;
        this.changeListeners.push(listener);
        return function () { return _this.changeListeners.splice(_this.changeListeners.indexOf(listener), 1); };
    };
    ComposerSettings.prototype.onDidChangeConfiguration = function () {
        var _this = this;
        this.initializeSettings();
        this.changeListeners.forEach(function (l) { return l(_this); });
    };
    return ComposerSettings;
}());
exports.ComposerSettings = ComposerSettings;
var Composer = (function () {
    function Composer(options) {
        this.composerPath = options.composerPath;
        var encoding = options.defaultEncoding || 'utf8';
        this.defaultEncoding = encoding_1.encodingExists(encoding) ? encoding : 'utf8';
        this.env = options.env || {};
        this.outputListeners = [];
    }
    /**
     * Short information about Composer.
     */
    Composer.prototype.about = function () {
        return this.run(vscode_1.workspace.rootPath, ['about']);
    };
    /**
     * Create an archive of this composer package.
     */
    Composer.prototype.archive = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['archive']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Opens the package's repository URL or homepage in your browser.
     */
    Composer.prototype.browse = function () {
        // TODO: implement "browse".
    };
    /**
     * Clears composer's internal package cache.
     */
    Composer.prototype.clearCache = function () {
        return this.run(vscode_1.workspace.rootPath, ['clear-cache']);
    };
    /**
     * Set config options.
     */
    Composer.prototype.config = function () {
        // TODO: implement "config".
    };
    /**
     * Create new project from a package into given directory.
     */
    Composer.prototype.createProject = function () {
        // TODO: implement "create-project".
    };
    /**
     * Shows which packages cause the given package to be installed.
     */
    Composer.prototype.depends = function (pkg, recursive, tree) {
        if (recursive === void 0) { recursive = false; }
        if (tree === void 0) { tree = false; }
        // TODO: implement "depends".
    };
    /**
     * Diagnoses the system to identify common errors.
     */
    Composer.prototype.diagnose = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['diagnose']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Dumps the autoloader.
     */
    Composer.prototype.dumpAutoload = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['dump-autoload']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Displays help for a command.
     */
    Composer.prototype.help = function (command) {
        return this.run(vscode_1.workspace.rootPath, ['help', command]);
    };
    /**
     * Opens the package's repository URL or homepage in your browser.
     */
    Composer.prototype.home = function () {
        // TODO: implement "home".
    };
    /**
     * Show information about packages.
     */
    Composer.prototype.info = function (pkg) {
        if (pkg) {
            return this.run(vscode_1.workspace.rootPath, ['info', pkg]);
        }
        return this.run(vscode_1.workspace.rootPath, ['info']);
    };
    /**
     * Creates a basic composer.json file in current directory.
     */
    Composer.prototype.init = function () {
        return this.run(vscode_1.workspace.rootPath, ['init']);
    };
    /**
     * Installs the project dependencies from the composer.lock file if present, or falls back on the composer.json.
     */
    Composer.prototype.install = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['install']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Show information about licenses of dependencies.
     */
    Composer.prototype.licenses = function () {
        return this.run(vscode_1.workspace.rootPath, ['licenses']);
    };
    /**
     * Shows which packages prevent the given package from being installed
     */
    Composer.prototype.prohibits = function (name, recursive, tree) {
        if (recursive === void 0) { recursive = false; }
        if (tree === void 0) { tree = false; }
        // TODO: Implement "prohibits".
    };
    /**
     * Removes a package from the require or require-dev.
     */
    Composer.prototype.remove = function (name) {
        // TODO: Implement "remove".
    };
    /**
     * Adds required packages to your composer.json and installs them.
     */
    Composer.prototype.requirePackage = function () {
        // TODO: Implement "require".
    };
    /**
     * Run the scripts defined in composer.json.
     */
    Composer.prototype.runScript = function () {
        // TODO: Implement "run-script".
    };
    /**
     * Search for packages.
     */
    Composer.prototype.search = function () {
        // TODO: Implement "search".
    };
    /**
     * Updates composer.phar to the latest version.
     */
    Composer.prototype.selfUpdate = function () {
        return this.run(vscode_1.workspace.rootPath, ['self-update']);
    };
    /**
     * Show a list of locally modified packages.
     */
    Composer.prototype.status = function () {
        return this.run(vscode_1.workspace.rootPath, ['status']);
    };
    /**
     * Show package suggestions.
     */
    Composer.prototype.suggests = function () {
        return this.run(vscode_1.workspace.rootPath, ['suggests']);
    };
    /**
     * Updates your dependencies to the latest version according to composer.json, and updates the composer.lock file.
     */
    Composer.prototype.update = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['update']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Validates a composer.json and composer.lock
     */
    Composer.prototype.validate = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['validate']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Shows the composer version.
     */
    Composer.prototype.version = function () {
        return this.run(vscode_1.workspace.rootPath, ['--version']);
    };
    /**
     * Shows which packages cause the given package to be installed.
     */
    Composer.prototype.why = function (pkg) {
        // TODO: Implement "why".
    };
    /**
     * Shows which packages prevent the given package from being installed.
     */
    Composer.prototype.whyNot = function (pkg) {
        // TODO: Implement "why-not".
    };
    Composer.prototype.run = function (cwd, args, options) {
        if (options === void 0) { options = {}; }
        options = objects.assign({ cwd: cwd }, options || {});
        return this.exec(args, options);
    };
    Composer.prototype.stream = function (cwd, args, options) {
        if (options === void 0) { options = {}; }
        options = objects.assign({ cwd: cwd }, options || {});
        return this.spawn(args, options);
    };
    Composer.prototype.exec = function (args, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var child = this.spawn(args, options);
        if (options.input) {
            child.stdin.end(options.input, 'utf8');
        }
        return execution_1.exec(child).then(function (result) {
            if (options.log !== false) {
                if (result.exitCode) {
                    _this.log(result.stderr + "\n");
                }
                else if (result.stderr) {
                    _this.log(result.stderr + "\n");
                }
                else {
                    _this.log(result.stdout + "\n");
                }
            }
            return result;
        });
    };
    Composer.prototype.spawn = function (args, options) {
        if (options === void 0) { options = {}; }
        if (!this.composerPath) {
            throw new Error('composer could not be found in the system.');
        }
        if (!options) {
            options = {};
        }
        if (!options.stdio && !options.input) {
            options.stdio = ['ignore', null, null]; // Unless provided, ignore stdin and leave default streams for stdout and stderr
        }
        options.env = objects.assign({}, options.env || {});
        options.env = objects.assign(options.env, this.env);
        if (options.log !== false) {
            this.log(strings.format('executing: composer {0}\n', args.join(' ')));
        }
        return child_process_1.spawn(this.composerPath, args, options);
    };
    Composer.prototype.onOutput = function (listener) {
        var _this = this;
        this.outputListeners.push(listener);
        return function () { return _this.outputListeners.splice(_this.outputListeners.indexOf(listener), 1); };
    };
    Composer.prototype.log = function (output) {
        this.outputListeners.forEach(function (l) { return l(output); });
    };
    return Composer;
}());
exports.Composer = Composer;
var AboutCommand = (function () {
    function AboutCommand() {
    }
    return AboutCommand;
}());
var ComposerManager = (function (_super) {
    __extends(ComposerManager, _super);
    function ComposerManager() {
        var _this = this;
        _super.call(this, function () {
            _this.disposables.map(function (d) { d.dispose(); });
        });
        this.disposables = [];
        var settings = this.settings = new ComposerSettings();
        settings.onChange(function (settings) {
            _this.composer.composerPath = settings.executablePath;
        });
        this.composer = new Composer({
            composerPath: settings.executablePath,
            env: process.env
        });
        this.channel = vscode_1.window.createOutputChannel('Composer');
        this.composer.onOutput(function (output) {
            _this.channel.append(output);
        });
        // Define commands.
        this.commands = [
            {
                id: 'about',
                label: 'About',
                description: '',
                callback: function () {
                    _this.composer.about();
                },
            },
            {
                id: 'archive',
                label: 'Archive',
                description: '',
                callback: function () {
                    _this.composer.archive();
                },
            },
        ];
        // Register commands.
        this.registerCommand('composer.About', function () {
            _this.composer.about();
        });
        this.registerCommand('composer.Archive', function () {
            _this.composer.archive();
        });
        this.registerCommand('composer.Browse', function () {
            _this.commandNotAvailable('browse');
        });
        this.registerCommand('composer.ClearCache', function () {
            _this.composer.clearCache();
        });
        this.registerCommand('composer.Config', function () {
            _this.commandNotAvailable('config');
        });
        this.registerCommand('composer.CreateProject', function () {
            _this.composer.createProject();
        });
        this.registerCommand('composer.Depends', function () {
            _this.commandNotAvailable('depends');
        });
        this.registerCommand('composer.Diagnose', function () {
            _this.composer.diagnose();
        });
        this.registerCommand('composer.DumpAutoload', function () {
            _this.composer.dumpAutoload();
        });
        this.registerCommand('composer.Help', function () {
            var commands = [
                {
                    id: 'about',
                    label: 'About',
                    description: '',
                },
                {
                    id: 'archive',
                    label: 'Archive',
                    description: ''
                },
            ];
            vscode_1.window.showQuickPick(commands).then(function (command) {
                _this.composer.help(command.id);
            });
        });
        this.registerCommand('composer.Home', function () {
            _this.commandNotAvailable('home');
        });
        this.registerCommand('composer.PackageInfo', function () {
            vscode_1.window.showInputBox({ prompt: 'Input Package Name', placeHolder: 'All' }).then(function (pkg) {
                if (typeof (pkg) !== 'undefined') {
                    if (pkg === strings.empty) {
                        pkg = null;
                    }
                    _this.composer.info(pkg);
                }
            });
        });
        this.registerCommand('composer.Init', function () {
            _this.composer.init();
        });
        this.registerCommand('composer.Install', function () {
            _this.composer.install();
        });
        this.registerCommand('composer.Licenses', function () {
            _this.composer.licenses();
        });
        this.registerCommand('composer.Prohibits', function () {
            _this.commandNotAvailable('prohibits');
        });
        this.registerCommand('composer.RemovePackage', function () {
            _this.commandNotAvailable('remove');
        });
        this.registerCommand('composer.RequirePackage', function () {
            _this.commandNotAvailable('require');
        });
        this.registerCommand('composer.RunScript', function () {
            _this.commandNotAvailable('run-script');
        });
        this.registerCommand('composer.Search', function () {
            _this.commandNotAvailable('search');
        });
        this.registerCommand('composer.SelfUpdate', function () {
            _this.composer.selfUpdate();
        });
        this.registerCommand('composer.Status', function () {
            _this.composer.status();
        });
        this.registerCommand('composer.Suggests', function () {
            _this.composer.suggests();
        });
        this.registerCommand('composer.Update', function () {
            _this.composer.update();
        });
        this.registerCommand('composer.Validate', function () {
            _this.composer.validate();
        });
        this.registerCommand('composer.Version', function () {
            _this.composer.version();
        });
        this.registerCommand('composer.Why', function () {
            _this.commandNotAvailable('why');
        });
        this.registerCommand('composer.WhyNot', function () {
            _this.commandNotAvailable('why-not');
        });
    }
    ComposerManager.prototype.safeExecute = function (func) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            try {
                _this.channel.show();
                return func.apply(_this, args);
            }
            catch (error) {
                vscode_1.window.showErrorMessage(error.message);
            }
        };
    };
    ComposerManager.prototype.requireWorkspacePath = function (func) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            try {
                _this.channel.show();
                return func.apply(_this, args);
            }
            catch (error) {
                vscode_1.window.showErrorMessage(error.message);
            }
        };
    };
    ComposerManager.prototype.commandNotAvailable = function (name) {
        this.channel.appendLine("The 'composer " + name + "' command is not available yet.\n");
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
    ComposerManager.prototype.registerCommand = function (command, callback, thisArg) {
        this.disposables.push(vscode_1.commands.registerCommand(command, this.safeExecute(callback), thisArg));
    };
    ComposerManager.prototype.registerCommandEx = function (command) {
        if (requireWorkspacePath && typeof (vscode_1.workspace.rootPath) === 'undefined') {
            vscode_1.window.showInformationMessage('You must have a folder open in VS Code in order to use composer.');
        }
        else {
            this.disposables.push(vscode_1.commands.registerCommand(command, this.safeExecute(callback), thisArg));
        }
    };
    return ComposerManager;
}(vscode_1.Disposable));
exports.ComposerManager = ComposerManager;
//# sourceMappingURL=composer.js.map