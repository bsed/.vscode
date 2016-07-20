/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var execution_1 = require('../base/common/execution');
var child_process_1 = require('child_process');
var encoding_1 = require('../base/node/encoding');
var strings_1 = require('../helpers/strings');
var objects = require('../base/common/objects');
var strings = require('../base/common/strings');
var ComposerClient = (function () {
    function ComposerClient(options) {
        this.executablePath = options.executablePath;
        var encoding = options.defaultEncoding || 'utf8';
        this.defaultEncoding = encoding_1.encodingExists(encoding) ? encoding : 'utf8';
        this.env = options.env || {};
        this.outputListeners = [];
    }
    /**
     * Short information about Composer.
     */
    ComposerClient.prototype.about = function () {
        return this.run(vscode_1.workspace.rootPath, ['about']);
    };
    /**
     * Create an archive of this composer package.
     */
    ComposerClient.prototype.archive = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['archive'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Opens the package's repository URL or homepage in your browser.
     */
    ComposerClient.prototype.browse = function () {
        // TODO: implement "browse".
    };
    /**
     * Clears composer's internal package cache.
     */
    ComposerClient.prototype.clearCache = function () {
        return this.run(vscode_1.workspace.rootPath, ['clear-cache']);
    };
    /**
     * Set config options.
     */
    ComposerClient.prototype.config = function () {
        // TODO: implement "config".
    };
    /**
     * Create new project from a package into given directory.
     */
    ComposerClient.prototype.createProject = function () {
        // TODO: implement "create-project".
    };
    /**
     * Shows which packages cause the given package to be installed.
     */
    ComposerClient.prototype.depends = function (pkg, recursive, tree) {
        if (recursive === void 0) { recursive = false; }
        if (tree === void 0) { tree = false; }
        // TODO: implement "depends".
    };
    /**
     * Diagnoses the system to identify common errors.
     */
    ComposerClient.prototype.diagnose = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['diagnose']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Dumps the autoloader.
     */
    ComposerClient.prototype.dumpAutoload = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['dump-autoload'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Displays help for a command.
     */
    ComposerClient.prototype.help = function (command) {
        return this.run(vscode_1.workspace.rootPath, ['help', command]);
    };
    /**
     * Opens the package's repository URL or homepage in your browser.
     */
    ComposerClient.prototype.home = function () {
        // TODO: implement "home".
    };
    /**
     * Creates a basic composer.json file in current directory.
     */
    ComposerClient.prototype.init = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return this.run(vscode_1.workspace.rootPath, ['init'].concat(args));
    };
    /**
     * Installs the project dependencies from the composer.lock file if present, or falls back on the composer.json.
     */
    ComposerClient.prototype.install = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['install']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Show information about licenses of dependencies.
     */
    ComposerClient.prototype.licenses = function () {
        return this.run(vscode_1.workspace.rootPath, ['licenses']);
    };
    /**
     * Shows which packages prevent the given package from being installed
     */
    ComposerClient.prototype.prohibits = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['prohibits'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Adds required packages to your composer.json and installs them.
     */
    ComposerClient.prototype.require = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['require'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        });
    };
    /**
     * Removes a package from the require or require-dev.
     */
    ComposerClient.prototype.remove = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['remove'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Run the scripts defined in composer.json.
     */
    ComposerClient.prototype.runScript = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var child = this.stream(vscode_1.workspace.rootPath, ['run-script'].concat(args));
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Search for packages.
     */
    ComposerClient.prototype.search = function () {
        // TODO: Implement "search".
    };
    /**
     * Updates composer.phar to the latest version.
     */
    ComposerClient.prototype.selfUpdate = function () {
        return this.run(vscode_1.workspace.rootPath, ['self-update']);
    };
    /**
     * Show information about packages.
     */
    ComposerClient.prototype.show = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return this.run(vscode_1.workspace.rootPath, ['show'].concat(args));
    };
    /**
     * Show a list of locally modified packages.
     */
    ComposerClient.prototype.status = function () {
        return this.run(vscode_1.workspace.rootPath, ['status']);
    };
    /**
     * Show package suggestions.
     */
    ComposerClient.prototype.suggests = function () {
        return this.run(vscode_1.workspace.rootPath, ['suggests']);
    };
    /**
     * Updates your dependencies to the latest version according to composer.json, and updates the composer.lock file.
     */
    ComposerClient.prototype.update = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['update']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Validates a composer.json and composer.lock
     */
    ComposerClient.prototype.validate = function () {
        var _this = this;
        var child = this.stream(vscode_1.workspace.rootPath, ['validate']);
        return execution_1.stream(child, function (output) {
            _this.log(output);
        }).then(function (r) { _this.log('\n'); return r; });
    };
    /**
     * Shows the composer version.
     */
    ComposerClient.prototype.version = function () {
        return this.run(vscode_1.workspace.rootPath, ['--version']);
    };
    /**
     * Shows which packages cause the given package to be installed.
     */
    ComposerClient.prototype.why = function (pkg) {
        // TODO: Implement "why".
    };
    /**
     * Shows which packages prevent the given package from being installed.
     */
    ComposerClient.prototype.whyNot = function (pkg) {
        // TODO: Implement "why-not".
    };
    ComposerClient.prototype.run = function (cwd, args, options) {
        if (options === void 0) { options = {}; }
        options = objects.assign({ cwd: cwd }, options || {});
        return this.exec(args, options);
    };
    ComposerClient.prototype.stream = function (cwd, args, options) {
        if (options === void 0) { options = {}; }
        options = objects.assign({ cwd: cwd }, options || {});
        return this.spawn(args, options);
    };
    ComposerClient.prototype.exec = function (args, options) {
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
    ComposerClient.prototype.spawn = function (args, options) {
        if (options === void 0) { options = {}; }
        if (!this.executablePath) {
            throw new Error(strings_1.Strings.ComposerNotFound);
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
            this.log(strings.format(strings_1.Strings.ExecutingCommand + '\n\n', args.join(' ')));
        }
        return child_process_1.spawn(this.executablePath, args, options);
    };
    ComposerClient.prototype.onOutput = function (listener) {
        var _this = this;
        this.outputListeners.push(listener);
        return function () { return _this.outputListeners.splice(_this.outputListeners.indexOf(listener), 1); };
    };
    ComposerClient.prototype.log = function (output) {
        this.outputListeners.forEach(function (l) { return l(output); });
    };
    return ComposerClient;
}());
exports.ComposerClient = ComposerClient;
//# sourceMappingURL=composerclient.js.map