"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var di_1 = require('../../common/di');
var packageCodeLens_1 = require('../../common/packageCodeLens');
var packageCodeLensList_1 = require('../../common/packageCodeLensList');
var abstractCodeLensProvider_1 = require('../abstractCodeLensProvider');
var npmVersionParser_1 = require('./npmVersionParser');
var jspmVersionParser_1 = require('./jspmVersionParser');
var NpmCodeLensProvider = (function (_super) {
    __extends(NpmCodeLensProvider, _super);
    function NpmCodeLensProvider() {
        this.packageExtensions = {
            'jspm': jspmVersionParser_1.jspmVersionParser
        };
        this.packageExtensionKeys = Object.keys(this.packageExtensions);
    }
    Object.defineProperty(NpmCodeLensProvider.prototype, "selector", {
        get: function () {
            return {
                language: 'json',
                scheme: 'file',
                pattern: '**/package.json'
            };
        },
        enumerable: true,
        configurable: true
    });
    ;
    NpmCodeLensProvider.prototype.getPackageDependencyKeys = function () {
        return this.appConfig.npmDependencyProperties;
    };
    NpmCodeLensProvider.prototype.provideCodeLenses = function (document, token) {
        var jsonDoc = this.jsonParser.parse(document.getText());
        if (!jsonDoc || !jsonDoc.root || jsonDoc.validationResult.errors.length > 0)
            return [];
        var collector = new packageCodeLensList_1.PackageCodeLensList(document, this.appConfig);
        this.collectDependencies_(collector, jsonDoc.root, npmVersionParser_1.npmVersionParser);
        this.collectExtensionDependencies_(collector, jsonDoc.root);
        return collector.collection;
    };
    NpmCodeLensProvider.prototype.resolveCodeLens = function (codeLensItem, token) {
        var _this = this;
        if (codeLensItem instanceof packageCodeLens_1.PackageCodeLens) {
            if (codeLensItem.command)
                return codeLensItem;
            if (codeLensItem.package.version === 'latest')
                return this.commandFactory.makeLatestCommand(codeLensItem);
            if (codeLensItem.package.meta) {
                if (codeLensItem.package.meta.type === 'github')
                    return this.commandFactory.makeGithubCommand(codeLensItem);
                if (codeLensItem.package.meta.type === 'file')
                    return this.commandFactory.makeLinkCommand(codeLensItem);
            }
            var viewPackageName_1 = codeLensItem.package.name + (!codeLensItem.package.isValidSemver ?
                "@" + codeLensItem.package.version :
                '');
            return doNpmViewVersion(this.npm, viewPackageName_1)
                .then(function (response) {
                var keys = Object.keys(response);
                var remoteVersion = keys[0];
                if (codeLensItem.package.isValidSemver)
                    return _this.commandFactory.makeVersionCommand(codeLensItem.package.version, remoteVersion, codeLensItem);
                if (!remoteVersion)
                    return _this.commandFactory.makeErrorCommand(viewPackageName_1 + " gave an invalid response", codeLensItem);
                return _this.commandFactory.makeTagCommand(viewPackageName_1 + " = v" + remoteVersion, codeLensItem);
            })
                .catch(function (error) {
                return _this.commandFactory.makeErrorCommand(error, codeLensItem);
            });
        }
    };
    NpmCodeLensProvider.prototype.collectExtensionDependencies_ = function (collector, rootNode) {
        var _this = this;
        var packageDependencyKeys = this.packageExtensionKeys;
        rootNode.getChildNodes()
            .forEach(function (node) {
            var testDepProperty = node.key.value;
            if (packageDependencyKeys.includes(testDepProperty)) {
                var customParser = _this.packageExtensions[testDepProperty];
                _this.collectDependencies_(collector, node.value, customParser);
            }
        });
    };
    NpmCodeLensProvider = __decorate([
        di_1.inject('jsonParser', 'npm')
    ], NpmCodeLensProvider);
    return NpmCodeLensProvider;
}(abstractCodeLensProvider_1.AbstractCodeLensProvider));
exports.NpmCodeLensProvider = NpmCodeLensProvider;
function doNpmViewVersion(npm, packageName) {
    return new Promise(function (resolve, reject) {
        npm.load(function (loadError) {
            if (loadError) {
                reject(loadError);
                return;
            }
            npm.view(packageName, 'version', function (viewError, viewResult) {
                if (viewError) {
                    reject(viewError);
                    return;
                }
                resolve(viewResult);
            });
        });
    });
}
//# sourceMappingURL=npmCodeLensProvider.js.map