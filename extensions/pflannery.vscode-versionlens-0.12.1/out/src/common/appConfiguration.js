"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var vscode_1 = require('vscode');
var config_1 = require('../providers/npm/config');
var config_2 = require('../providers/bower/config');
var config_3 = require('../providers/dotnet/config');
var config_4 = require('../providers/dub/config');
var AppConfiguration = (function () {
    function AppConfiguration() {
    }
    Object.defineProperty(AppConfiguration.prototype, "extentionName", {
        get: function () {
            return "versionlens";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "versionPrefix", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get("versionPrefix", "");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "npmDependencyProperties", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get("npm.dependencyProperties", config_1.npmDefaultDependencyProperties);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "bowerDependencyProperties", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get("bower.dependencyProperties", config_2.bowerDefaultDependencyProperties);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "dotnetDependencyProperties", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get("dotnet.dependencyProperties", config_3.dotnetDefaultDependencyProperties);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "dubDependencyProperties", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get("dub.dependencyProperties", config_4.dubDefaultDependencyProperties);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "githubCompareOptions", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get('github.compareOptions', ['Release', 'Tag', 'Commit']);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "githubAccessToken", {
        get: function () {
            var config = vscode_1.workspace.getConfiguration('versionlens');
            return config.get('github.accessToken', null);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "updateIndicator", {
        get: function () {
            return '⬆';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "openNewWindowIndicator", {
        get: function () {
            return '⧉';
        },
        enumerable: true,
        configurable: true
    });
    return AppConfiguration;
}());
exports.AppConfiguration = AppConfiguration;
//# sourceMappingURL=appConfiguration.js.map