/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var os = require('os');
var goPath_1 = require('./goPath');
var goCover_1 = require('./goCover');
var outputChannel = vscode.window.createOutputChannel('Go');
function runTool(cmd, args, cwd, severity, useStdErr, notFoundError) {
    return new Promise(function (resolve, reject) {
        cp.execFile(cmd, args, { cwd: cwd }, function (err, stdout, stderr) {
            try {
                if (err && err.code === 'ENOENT') {
                    vscode.window.showInformationMessage(notFoundError);
                    return resolve([]);
                }
                var lines = (useStdErr ? stderr : stdout).toString().split('\n');
                outputChannel.appendLine(['Finished running tool:', cmd].concat(args).join(' '));
                var ret = [];
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i][0] === '\t' && ret.length > 0) {
                        ret[ret.length - 1].msg += '\n' + lines[i];
                        continue;
                    }
                    var match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+))?: (.*)$/.exec(lines[i]);
                    if (!match)
                        continue;
                    var _1 = match[0], __ = match[1], file = match[2], ___ = match[3], lineStr = match[4], ____ = match[5], charStr = match[6], msg = match[7];
                    var line = +lineStr;
                    file = path.resolve(cwd, file);
                    ret.push({ file: file, line: line, msg: msg, severity: severity });
                    outputChannel.appendLine(file + ":" + line + ": " + msg);
                }
                outputChannel.appendLine('');
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
function check(filename, goConfig) {
    outputChannel.clear();
    var runningToolsPromises = [];
    var cwd = path.dirname(filename);
    if (!!goConfig['buildOnSave']) {
        var buildFlags = goConfig['buildFlags'] || [];
        var buildTags = '"' + goConfig['buildTags'] + '"';
        var tmppath = path.normalize(path.join(os.tmpdir(), 'go-code-check'));
        var args = ['build', '-o', tmppath, '-tags', buildTags].concat(buildFlags, ['.']);
        if (filename.match(/_test.go$/i)) {
            args = ['test', '-copybinary', '-o', tmppath, '-c', '-tags', buildTags].concat(buildFlags, ['.']);
        }
        runningToolsPromises.push(runTool(goPath_1.getGoRuntimePath(), args, cwd, 'error', true, 'No "go" binary could be found in GOROOT: ' + process.env['GOROOT'] + '"'));
    }
    if (!!goConfig['lintOnSave']) {
        var golint = goPath_1.getBinPath('golint');
        var lintFlags = goConfig['lintFlags'] || [];
        runningToolsPromises.push(runTool(golint, lintFlags.concat([filename]), cwd, 'warning', false, 'The "golint" command is not available.  Use "go get -u github.com/golang/lint/golint" to install.'));
    }
    if (!!goConfig['vetOnSave']) {
        var vetFlags = goConfig['vetFlags'] || [];
        runningToolsPromises.push(runTool(goPath_1.getGoRuntimePath(), ['tool', 'vet'].concat(vetFlags, [filename]), cwd, 'warning', true, 'No "go" binary could be found in GOROOT: "' + process.env['GOROOT'] + '"'));
    }
    if (!!goConfig['coverOnSave']) {
        runningToolsPromises.push(goCover_1.getCoverage(filename));
    }
    return Promise.all(runningToolsPromises).then(function (resultSets) { return [].concat.apply([], resultSets); });
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map