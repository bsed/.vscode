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
// TODO retrieve multiple sources from nuget.config
var FEED_URL = 'https://api.nuget.org/v3-flatcontainer';
var DotNetCodeLensProvider = (function (_super) {
    __extends(DotNetCodeLensProvider, _super);
    function DotNetCodeLensProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(DotNetCodeLensProvider.prototype, "selector", {
        get: function () {
            return {
                language: 'json',
                scheme: 'file',
                pattern: '**/project.json'
            };
        },
        enumerable: true,
        configurable: true
    });
    DotNetCodeLensProvider.prototype.getPackageDependencyKeys = function () {
        return this.appConfig.dotnetDependencyProperties;
    };
    DotNetCodeLensProvider.prototype.provideCodeLenses = function (document, token) {
        var jsonDoc = this.jsonParser.parse(document.getText());
        if (jsonDoc === null || jsonDoc.root === null || jsonDoc.validationResult.errors.length > 0)
            return [];
        var collector = new packageCodeLensList_1.PackageCodeLensList(document, this.appConfig);
        this.collectDependencies_(collector, jsonDoc.root, null);
        return collector.collection;
    };
    DotNetCodeLensProvider.prototype.resolveCodeLens = function (codeLensItem, token) {
        var _this = this;
        if (codeLensItem instanceof packageCodeLens_1.PackageCodeLens) {
            if (codeLensItem.command)
                return codeLensItem;
            if (codeLensItem.package.version === 'latest')
                return this.commandFactory.makeLatestCommand(codeLensItem);
            var queryUrl_1 = FEED_URL + "/" + codeLensItem.package.name + "/index.json";
            return this.httpRequest.xhr({ url: queryUrl_1 })
                .then(function (response) {
                if (response.status != 200)
                    return _this.commandFactory.makeErrorCommand(response.responseText, codeLensItem);
                var pkg = JSON.parse(response.responseText);
                var serverVersion = pkg.versions[pkg.versions.length - 1];
                if (!serverVersion)
                    return _this.commandFactory.makeErrorCommand("Invalid object returned from server", codeLensItem);
                return _this.commandFactory.makeVersionCommand(codeLensItem.package.version, serverVersion, codeLensItem);
            })
                .catch(function (errResponse) {
                return _this.commandFactory.makeErrorCommand(errResponse.status + ": " + queryUrl_1, codeLensItem);
            });
        }
    };
    DotNetCodeLensProvider.prototype.collectDependencies_ = function (collector, rootNode, customVersionParser) {
        var _this = this;
        var packageDependencyKeys = this.getPackageDependencyKeys();
        rootNode.getChildNodes()
            .forEach(function (childNode) {
            if (packageDependencyKeys.includes(childNode.key.value)) {
                var childDeps = childNode.value.getChildNodes();
                // check if this node has entries and if so add the update all command
                if (childDeps.length > 0)
                    _this.commandFactory.makeUpdateDependenciesCommand(childNode.key.value, collector.addNode(childNode), collector.collection);
                collector.addDependencyNodeRange(childDeps, customVersionParser);
                return;
            }
            if (childNode.value.type === 'object')
                _this.collectDependencies_(collector, childNode.value, customVersionParser);
        });
    };
    DotNetCodeLensProvider.prototype.createRequestUrl_ = function (baseUrl, packageId) {
        return baseUrl + "/" + packageId + "/index.json";
    };
    DotNetCodeLensProvider.prototype.extractVersionFromXml_ = function (xmlResponse) {
        var versionExp = /<d:Version>(.*)<\/d:Version>/;
        var results = xmlResponse.match(versionExp);
        return results && results.length > 1 ? results[1] : '';
    };
    DotNetCodeLensProvider.prototype.getPackageSources_ = function () {
        return [''];
    };
    DotNetCodeLensProvider = __decorate([
        di_1.inject('jsonParser', 'httpRequest')
    ], DotNetCodeLensProvider);
    return DotNetCodeLensProvider;
}(abstractCodeLensProvider_1.AbstractCodeLensProvider));
exports.DotNetCodeLensProvider = DotNetCodeLensProvider;
//# sourceMappingURL=dotNetCodeLensProvider.js.map