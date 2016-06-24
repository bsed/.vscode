/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var cp = require('child_process');
var path = require('path');
var vscode = require('vscode');
var util = require('util');
var goPath_1 = require('./goPath');
var goOutline_1 = require('./goOutline');
/**
* Executes the unit test at the primary cursor using `go test`. Output
* is sent to the 'Go' channel.
*
* @param timeout a ParseDuration formatted timeout string for the tests.
*
* TODO: go test returns filenames with no path information for failures,
* so output doesn't produce navigable line references.
*/
function testAtCursor(timeout) {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    getTestFunctions(editor.document).then(function (testFunctions) {
        var testFunction;
        // Find any test function containing the cursor.
        for (var _i = 0, testFunctions_1 = testFunctions; _i < testFunctions_1.length; _i++) {
            var func = testFunctions_1[_i];
            var selection = editor.selection;
            if (selection && func.location.range.contains(selection.start)) {
                testFunction = func;
                break;
            }
        }
        ;
        if (!testFunction) {
            vscode.window.setStatusBarMessage('No test function found at cursor.', 5000);
            return;
        }
        return goTest({
            timeout: timeout,
            dir: path.dirname(editor.document.fileName),
            functions: [testFunction.name]
        });
    }).then(null, function (err) {
        console.error(err);
    });
}
exports.testAtCursor = testAtCursor;
/**
 * Runs all tests in the package of the source of the active editor.
 *
 * @param timeout a ParseDuration formatted timeout string for the tests.
 */
function testCurrentPackage(timeout) {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    goTest({
        timeout: timeout,
        dir: path.dirname(editor.document.fileName)
    }).then(null, function (err) {
        console.error(err);
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param timeout a ParseDuration formatted timeout string for the tests.
 */
function testCurrentFile(timeout) {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    getTestFunctions(editor.document).then(function (testFunctions) {
        return goTest({
            timeout: timeout,
            dir: path.dirname(editor.document.fileName),
            functions: testFunctions.map(function (func) { return func.name; })
        });
    }).then(null, function (err) {
        console.error(err);
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs go test and presents the output in the 'Go' channel.
 *
 * @param config the test execution configuration.
 */
function goTest(config) {
    return new Promise(function (resolve, reject) {
        var channel = vscode.window.createOutputChannel('Go');
        channel.clear();
        channel.show(2);
        var buildFlags = vscode.workspace.getConfiguration('go')['buildFlags'];
        var buildTags = vscode.workspace.getConfiguration('go')['buildTags'];
        var args = ['test', '-v', '-timeout', config.timeout, '-tags', buildTags].concat(buildFlags);
        if (config.functions) {
            args.push('-run');
            args.push(util.format('^%s$', config.functions.join('|')));
        }
        var proc = cp.spawn(goPath_1.getGoRuntimePath(), args, { env: process.env, cwd: config.dir });
        proc.stdout.on('data', function (chunk) { return channel.append(chunk.toString()); });
        proc.stderr.on('data', function (chunk) { return channel.append(chunk.toString()); });
        proc.on('close', function (code) {
            if (code) {
                channel.append('Error: Tests failed.');
            }
            else {
                channel.append('Success: Tests passed.');
            }
            resolve(code === 0);
        });
    });
}
/**
 * Returns all Go unit test functions in the given source file.
 *
 * @param the URI of a Go source file.
 * @return test function symbols for the source file.
 */
function getTestFunctions(doc) {
    var documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(function (symbols) {
        return symbols.filter(function (sym) {
            return sym.kind === vscode.SymbolKind.Function
                && hasTestFunctionPrefix(sym.name);
        });
    });
}
/**
 * Returns whether a given function name has a test prefix.
 * Test functions have "Test" or "Example" as a prefix.
 *
 * @param the function name.
 * @return whether the name has a test function prefix.
 */
function hasTestFunctionPrefix(name) {
    return name.startsWith('Test') || name.startsWith('Example');
}
//# sourceMappingURL=goTest.js.map