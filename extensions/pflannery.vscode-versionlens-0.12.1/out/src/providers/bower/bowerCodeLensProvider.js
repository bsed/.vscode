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
var bowerVersionParser_1 = require('./bowerVersionParser');
var BowerCodeLensProvider = (function (_super) {
    __extends(BowerCodeLensProvider, _super);
    function BowerCodeLensProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(BowerCodeLensProvider.prototype, "selector", {
        get: function () {
            return {
                language: 'json',
                scheme: 'file',
                pattern: '**/bower.json'
            };
        },
        enumerable: true,
        configurable: true
    });
    BowerCodeLensProvider.prototype.getPackageDependencyKeys = function () {
        return this.appConfig.bowerDependencyProperties;
    };
    BowerCodeLensProvider.prototype.provideCodeLenses = function (document, token) {
        var jsonDoc = this.jsonParser.parse(document.getText());
        if (!jsonDoc || !jsonDoc.root || jsonDoc.validationResult.errors.length > 0)
            return [];
        var collector = new packageCodeLensList_1.PackageCodeLensList(document, this.appConfig);
        this.collectDependencies_(collector, jsonDoc.root, bowerVersionParser_1.bowerVersionParser);
        return collector.collection;
    };
    BowerCodeLensProvider.prototype.resolveCodeLens = function (codeLensItem, token) {
        var _this = this;
        if (codeLensItem instanceof packageCodeLens_1.PackageCodeLens) {
            if (codeLensItem.package.version === 'latest') {
                this.commandFactory.makeLatestCommand(codeLensItem);
                return;
            }
            if (codeLensItem.package.meta) {
                if (codeLensItem.package.meta.type === 'github')
                    return this.commandFactory.makeGithubCommand(codeLensItem);
                if (codeLensItem.package.meta.type === 'file')
                    return this.commandFactory.makeLinkCommand(codeLensItem);
            }
            return new Promise(function (success) {
                _this.bower.commands.info(codeLensItem.package.name)
                    .on('end', function (info) {
                    if (!info || !info.latest) {
                        success(_this.commandFactory.makeErrorCommand("Invalid object returned from server", codeLensItem));
                        return;
                    }
                    success(_this.commandFactory.makeVersionCommand(codeLensItem.package.version, info.latest.version, codeLensItem));
                })
                    .on('error', function (err) {
                    success(_this.commandFactory.makeErrorCommand(err.message, codeLensItem));
                });
            });
        }
    };
    BowerCodeLensProvider = __decorate([
        di_1.inject('jsonParser', 'bower')
    ], BowerCodeLensProvider);
    return BowerCodeLensProvider;
}(abstractCodeLensProvider_1.AbstractCodeLensProvider));
exports.BowerCodeLensProvider = BowerCodeLensProvider;
//# sourceMappingURL=bowerCodeLensProvider.js.map