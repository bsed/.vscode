// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var fileSystem_1 = require("../common/node/fileSystem");
var TsConfigHelper = (function () {
    function TsConfigHelper() {
    }
    Object.defineProperty(TsConfigHelper, "tsConfigPath", {
        get: function () {
            return path.join(vscode.workspace.rootPath, "tsconfig.json");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Constructs a JSON object from tsconfig.json. Will create the file if needed.
     */
    TsConfigHelper.readConfigJson = function () {
        var tsConfigPath = TsConfigHelper.tsConfigPath;
        var fileSystem = new fileSystem_1.FileSystem();
        return fileSystem.exists(tsConfigPath)
            .then(function (exists) {
            if (!exists) {
                return fileSystem.writeFile(tsConfigPath, "{}");
            }
        })
            .then(function () {
            return fileSystem.readFile(tsConfigPath, "utf-8");
        })
            .then(function (jsonContents) {
            return JSON.parse(jsonContents);
        });
    };
    /**
     * Writes out a JSON configuration object to the tsconfig.json file.
     */
    TsConfigHelper.writeConfigJson = function (configJson) {
        var tsConfigPath = TsConfigHelper.tsConfigPath;
        return Q.nfcall(fs.writeFile, tsConfigPath, JSON.stringify(configJson, null, 4));
    };
    /**
     * Enable javascript intellisense via typescript.
     */
    TsConfigHelper.allowJs = function (enabled) {
        return TsConfigHelper.readConfigJson()
            .then(function (tsConfigJson) {
            tsConfigJson.compilerOptions = tsConfigJson.compilerOptions || {};
            if (!tsConfigJson.compilerOptions.hasOwnProperty("allowJs")) {
                tsConfigJson.compilerOptions.allowJs = enabled;
                return TsConfigHelper.writeConfigJson(tsConfigJson);
            }
            return Q.resolve(void 0);
        });
    };
    /**
     * Add directories to be excluded by the Typescript compiler.
     */
    TsConfigHelper.addExcludePaths = function (excludePaths) {
        return TsConfigHelper.readConfigJson()
            .then(function (tsConfigJson) {
            var currentExcludes = tsConfigJson.exclude || [];
            var isDirty = false;
            excludePaths.forEach(function (exclude) {
                if (currentExcludes.indexOf(exclude) < 0) {
                    currentExcludes.push(exclude);
                    isDirty = true;
                }
            });
            if (isDirty) {
                tsConfigJson.exclude = currentExcludes;
                return TsConfigHelper.writeConfigJson(tsConfigJson);
            }
        });
    };
    return TsConfigHelper;
}());
exports.TsConfigHelper = TsConfigHelper;

//# sourceMappingURL=tsconfigHelper.js.map
