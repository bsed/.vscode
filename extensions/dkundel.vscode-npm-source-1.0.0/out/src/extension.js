/// <reference path="../typings/tsd.d.ts" />
"use strict";
var vscode_1 = require('vscode');
var http = require('http');
var Q = require('q');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var nodeModules = require('./node-native-modules');
var moduleRegEx = /require\(("|')[^.].*?("|')\)|import.*?('|")[^.].*?('|")/g;
function activate(context) {
    var disposable = vscode_1.commands.registerCommand('extension.openPackageSource', function () {
        var editor = vscode_1.window.activeTextEditor;
        var selection = editor.selection;
        var selectedText;
        var packagesFound;
        if (selection.isEmpty) {
            selectedText = editor.document.getText(new vscode_1.Range(selection.start.line, 0, selection.end.line + 1, 0));
        }
        else {
            selectedText = editor.document.getText(selection);
        }
        if (editor.document && editor.document.languageId === 'json') {
            packagesFound = readFromPackageJson(editor, selectedText);
        }
        else {
            packagesFound = selectedText.match(moduleRegEx);
        }
        if (!packagesFound) {
            selectedText = editor.document.getText(new vscode_1.Range(selection.start.line, 0, selection.end.line + 1, 0));
            packagesFound = selectedText.match(moduleRegEx);
        }
        if (!packagesFound || packagesFound.length === 0) {
            if (editor.document && editor.document.languageId === 'json') {
                packagesFound = readFromPackageJson(editor, editor.document.getText());
            }
            else {
                packagesFound = editor.document.getText().match(moduleRegEx);
            }
        }
        if (packagesFound.length === 1) {
            getPackageSourceUrl(getCleanPackageName(packagesFound[0]))
                .then(openUrl)
                .catch(handleError);
        }
        else if (packagesFound.length > 1) {
            for (var i = 0; i < packagesFound.length; i++) {
                packagesFound[i] = getCleanPackageName(packagesFound[i]);
            }
            showPackageOptions(packagesFound)
                .then(getPackageSourceUrl)
                .then(openUrl)
                .catch(handleError);
        }
    });
    function getPackageSourceUrl(packageName) {
        var deferred = Q.defer();
        if (!packageName) {
            deferred.reject('No selection');
            return;
        }
        if (nodeModules.NativeModules.indexOf(packageName) !== -1) {
            deferred.resolve(nodeModules.getApiUrl(packageName));
        }
        var gitUrl = getGitUrlFromPackageJson(packageName);
        if (gitUrl) {
            deferred.resolve(gitUrl);
        }
        var packageTry = packageName;
        var determineUrlRecursively = function () {
            return getUrlFromNpm(packageTry).then(function (url) {
                if (!url) {
                    var sliceTo = Math.max(packageTry.lastIndexOf('/'), 0);
                    packageTry = packageTry.slice(0, sliceTo);
                    if (packageTry) {
                        return determineUrlRecursively();
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return url;
                }
            });
        };
        determineUrlRecursively().then(function (url) {
            deferred.resolve(url);
        }).catch(function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    function getUrlFromNpm(packageName) {
        var deferred = Q.defer();
        http.get('http://registry.npmjs.org/' + packageName, function (response) {
            var body = '';
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                var responseJson = JSON.parse(body);
                if (responseJson.repository && responseJson.repository.url) {
                    var url = responseJson.repository.url;
                    url = getBrowsablePackageUrl(url);
                    if (url.indexOf('http') === -1) {
                        deferred.resolve(null);
                        return;
                    }
                    url = url.substr(url.indexOf('http'));
                    deferred.resolve(url);
                }
                else {
                    deferred.resolve(null);
                }
            });
        }).on('error', function (err) {
            deferred.reject(err.message);
        });
        return deferred.promise;
    }
    function getGitUrlFromPackageJson(packageName) {
        var fileName = path.join(vscode_1.workspace.rootPath, 'package.json');
        var contents = fs.readFileSync(fileName).toString();
        var json = JSON.parse(contents);
        var result = null;
        if (json && json.dependencies && json.dependencies[packageName]) {
            var packageUrl = json.dependencies[packageName];
            if (packageUrl.indexOf('git') >= 0) {
                result = getBrowsablePackageUrl(packageUrl);
            }
        }
        return result;
    }
    function getBrowsablePackageUrl(url) {
        var regex1 = /^git\+?/g;
        url = url.replace(regex1, '');
        var regex2 = /(^:\/\/|^ssh:\/\/)/g;
        url = url.replace(regex2, 'https://');
        var regex3 = /:\/\/.*@/g;
        url = url.replace(regex3, '://');
        var regex4 = /:([^\/])/g;
        url = url.replace(regex4, '/$1');
        var regex5 = /\.git#/g;
        url = url.replace(regex5, '/tree/');
        return url;
    }
    function openUrl(url) {
        var openCommand;
        switch (process.platform) {
            case 'darwin':
                openCommand = 'open ';
                break;
            case 'win32':
                openCommand = 'start ';
                break;
            default:
                return;
        }
        exec(openCommand + url);
    }
    function showPackageOptions(packages) {
        var opts = { matchOnDescription: true, placeHolder: "We found multiple packages. Which one do you want to open?" };
        var items = [];
        var deferred = Q.defer();
        for (var i = 0; i < packages.length; i++) {
            items.push({ label: packages[i], description: 'Open ' + packages[i] + ' repository' });
        }
        vscode_1.window.showQuickPick(items, opts).then(function (selection) {
            if (selection) {
                deferred.resolve(selection.label);
            }
        });
        return deferred.promise;
    }
    function readFromPackageJson(editor, selectedText) {
        var content = JSON.parse(editor.document.getText());
        var potentialPackages = [];
        if (content.dependencies) {
            potentialPackages = potentialPackages.concat(Object.keys(content.dependencies));
        }
        if (content.devDependencies) {
            potentialPackages = potentialPackages.concat(Object.keys(content.devDependencies));
        }
        if (content.peerDependencies) {
            potentialPackages = potentialPackages.concat(Object.keys(content.peerDependencies));
        }
        return potentialPackages.filter(function (pkg) { return selectedText.indexOf(pkg) !== -1; });
    }
    function handleError(errorMessage) {
        vscode_1.window.showErrorMessage(errorMessage);
    }
    function getCleanPackageName(requireStatement) {
        return requireStatement.replace(/^require(\(|\s)("|')/, '').replace(/^import.*?('|")/, '').replace(/("|')\)?$/, '').replace(/('|")$/, '');
    }
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map