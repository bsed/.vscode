/* --------------------------------------------------------------------------------------------
 * Copyright (c) Ioannis Kappas. All rights reserved.
 * Licensed under the MIT License. See License.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
var vscode_languageserver_1 = require("vscode-languageserver");
var cp = require("child_process");
var path = require("path");
var fs = require("fs");
var cc = require("./utils/charcode");
var PhpcsPathResolver = (function () {
    function PhpcsPathResolver(rootPath) {
        this.rootPath = rootPath;
        var extension = /^win/.test(process.platform) ? ".bat" : "";
        this.phpcsExecutable = "phpcs" + extension;
    }
    /**
     * Determine whether composer.json exists at the root path.
     */
    PhpcsPathResolver.prototype.hasComposerJson = function () {
        try {
            return fs.existsSync(path.join(this.rootPath, "composer.json"));
        }
        catch (exeption) {
            return false;
        }
    };
    /**
     * Determine whether composer.lock exists at the root path.
     */
    PhpcsPathResolver.prototype.hasComposerLock = function () {
        try {
            return fs.existsSync(path.join(this.rootPath, "composer.lock"));
        }
        catch (exeption) {
            return false;
        }
    };
    /**
     * Determine whether phpcs is set as a composer dependency.
     */
    PhpcsPathResolver.prototype.hasComposerPhpcsDependency = function () {
        // Safely load composer.lock
        var dependencies = null;
        try {
            dependencies = JSON.parse(fs.readFileSync(path.join(this.rootPath, "composer.lock"), "utf8"));
        }
        catch (exception) {
            dependencies = {};
        }
        // Determine phpcs dependency.
        var result = false;
        var BreakException = {};
        if (dependencies["packages"] && dependencies["packages-dev"]) {
            try {
                [dependencies["packages"], dependencies["packages-dev"]].forEach(function (pkgs) {
                    var match = pkgs.filter(function (pkg) {
                        return pkg.name === "squizlabs/php_codesniffer";
                    });
                    if (match.length !== 0) {
                        throw BreakException;
                    }
                });
            }
            catch (exception) {
                if (exception === BreakException) {
                    result = true;
                }
                else {
                    throw exception;
                }
            }
        }
        return result;
    };
    PhpcsPathResolver.prototype.resolve = function () {
        var _this = this;
        this.phpcsPath = this.phpcsExecutable;
        var pathSeparator = /^win/.test(process.platform) ? ";" : ":";
        var globalPaths = process.env.PATH.split(pathSeparator);
        globalPaths.forEach(function (globalPath) {
            var testPath = path.join(globalPath, _this.phpcsExecutable);
            if (fs.existsSync(testPath)) {
                _this.phpcsPath = testPath;
                return false;
            }
        });
        if (this.rootPath) {
            // Determine whether composer.json exists in our workspace root.
            if (this.hasComposerJson()) {
                // Determine whether composer is installed.
                if (this.hasComposerLock()) {
                    // Determine whether vendor/bin/phcs exists only when project depends on phpcs.
                    if (this.hasComposerPhpcsDependency()) {
                        var vendorPath = path.join(this.rootPath, "vendor", "bin", this.phpcsExecutable);
                        if (fs.existsSync(vendorPath)) {
                            this.phpcsPath = vendorPath;
                        }
                        else {
                            throw "Composer phpcs dependency is configured but was not found under workspace/vendor/bin. You may need to update your dependencies using \"composer update\".";
                        }
                    }
                }
                else {
                    throw "A composer configuration file was found at the root of your project but seems uninitialized. You may need to initialize your dependencies using \"composer install\".";
                }
            }
        }
        return this.phpcsPath;
    };
    return PhpcsPathResolver;
}());
exports.PhpcsPathResolver = PhpcsPathResolver;
function makeDiagnostic(document, message) {
    var lines = document.getText().split("\n");
    var line = message.line - 1;
    var lineString = lines[line];
    // Process diagnostic start and end columns.
    var start = message.column - 1;
    var end = message.column;
    var charCode = lineString.charCodeAt(start);
    if (cc.isWhitespace(charCode)) {
        for (var i = start + 1, len = lineString.length; i < len; i++) {
            charCode = lineString.charCodeAt(i);
            if (!cc.isWhitespace(charCode)) {
                break;
            }
            end = i;
        }
    }
    else if (cc.isAlphaNumeric(charCode) || cc.isSymbol(charCode)) {
        // Get the whole word
        for (var i = start + 1, len = lineString.length; i < len; i++) {
            charCode = lineString.charCodeAt(i);
            if (!cc.isAlphaNumeric(charCode) && charCode !== 95) {
                break;
            }
            end += 1;
        }
        // Move backwards
        for (var i = start, len = 0; i > len; i--) {
            charCode = lineString.charCodeAt(i - 1);
            if (!cc.isAlphaNumeric(charCode) && !cc.isSymbol(charCode) && charCode !== 95) {
                break;
            }
            start -= 1;
        }
    }
    // Process diagnostic severity.
    var severity = vscode_languageserver_1.DiagnosticSeverity.Error;
    if (message.type === "WARNING") {
        severity = vscode_languageserver_1.DiagnosticSeverity.Warning;
    }
    var diagnostic = {
        range: {
            start: { line: line, character: start },
            end: { line: line, character: end }
        },
        severity: severity,
        message: "" + message.message
    };
    return diagnostic;
}
;
var PhpcsLinter = (function () {
    function PhpcsLinter(phpcsPath) {
        this.phpcsPath = phpcsPath;
    }
    /**
    * Resolve the phpcs path.
    */
    PhpcsLinter.resolvePath = function (rootPath) {
        return new Promise(function (resolve, reject) {
            try {
                var phpcsPathResolver = new PhpcsPathResolver(rootPath);
                var phpcsPath_1 = phpcsPathResolver.resolve();
                cp.exec(phpcsPath_1 + " --version", function (error, stdout, stderr) {
                    if (error) {
                        reject("phpcs: Unable to locate phpcs. Please add phpcs to your global path or use composer depency manager to install it in your project locally.");
                    }
                    resolve(new PhpcsLinter(phpcsPath_1));
                });
            }
            catch (e) {
                reject(e);
            }
        });
    };
    PhpcsLinter.prototype.lint = function (document, settings, rootPath) {
        var filePath = vscode_languageserver_1.Files.uriToFilePath(document.uri);
        var lintPath = this.phpcsPath;
        var lintArgs = ["--report=json"];
        if (settings.standard) {
            lintArgs.push("--standard=" + settings.standard);
        }
        lintArgs.push(filePath);
        return new Promise(function (resolve, reject) {
            var file = null;
            var args = null;
            var phpcs = null;
            var options = {
                cwd: rootPath ? rootPath : path.dirname(filePath),
                stdio: ["ignore", "pipe", "pipe"],
                env: process.env,
                encoding: "utf8",
                timeout: 0,
                maxBuffer: "" + 1024 * 1024,
                detached: true,
            };
            if (/^win/.test(process.platform)) {
                file = process.env.comspec || "cmd.exe";
                var command = lintPath + " " + lintArgs.join(" ");
                args = ["/s", "/c", command];
                phpcs = cp.execFile(file, args, options);
            }
            else {
                file = lintPath;
                args = lintArgs;
                phpcs = cp.spawn(file, args, options);
            }
            var result = "";
            phpcs.stderr.on("data", function (buffer) {
                result += buffer.toString();
            });
            phpcs.stdout.on("data", function (buffer) {
                result += buffer.toString();
            });
            phpcs.on("close", function (code) {
                try {
                    result = result.trim();
                    var match = null;
                    // Determine whether we have an error and report it otherwise send back the diagnostics.
                    if (match = result.match(/^ERROR:\s?(.*)/i)) {
                        var error = match[1].trim();
                        if (match = error.match(/^the \"(.*)\" coding standard is not installed\./)) {
                            throw { message: "The \"" + match[1] + "\" coding standard set in your configuration is not installed. Please review your configuration an try again." };
                        }
                        throw { message: error };
                    }
                    else if (match = result.match(/^FATAL\s?ERROR:\s?(.*)/i)) {
                        var error = match[1].trim();
                        if (match = error.match(/^Uncaught exception '.*' with message '(.*)'/)) {
                            throw { message: match[1] };
                        }
                        throw { message: error };
                    }
                    var diagnostics_1 = [];
                    var report = JSON.parse(result);
                    for (var filename in report.files) {
                        var file_1 = report.files[filename];
                        file_1.messages.forEach(function (message) {
                            diagnostics_1.push(makeDiagnostic(document, message));
                        });
                    }
                    resolve(diagnostics_1);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    };
    return PhpcsLinter;
}());
exports.PhpcsLinter = PhpcsLinter;
//# sourceMappingURL=linter.js.map