"use strict";
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
var di_1 = require('../common/di');
var AbstractCodeLensProvider = (function () {
    function AbstractCodeLensProvider() {
        this._disposables = [];
    }
    AbstractCodeLensProvider.prototype.dispose = function () {
        while (this._disposables.length > 0) {
            this._disposables.pop().dispose();
        }
    };
    AbstractCodeLensProvider.prototype.collectDependencies_ = function (collector, rootNode, customVersionParser) {
        var _this = this;
        rootNode.getChildNodes()
            .forEach(function (childNode) {
            if (_this.getPackageDependencyKeys().includes(childNode.key.value) == false)
                return;
            var childDeps = childNode.value.getChildNodes();
            // check if this node has entries and if so add the update all command
            if (childDeps.length > 0)
                _this.commandFactory.makeUpdateDependenciesCommand(childNode.key.value, collector.addNode(childNode), collector.collection);
            // collect all child dependencies
            collector.addDependencyNodeRange(childDeps, customVersionParser);
        });
    };
    AbstractCodeLensProvider = __decorate([
        di_1.inject('semver', 'appConfig', 'commandFactory')
    ], AbstractCodeLensProvider);
    return AbstractCodeLensProvider;
}());
exports.AbstractCodeLensProvider = AbstractCodeLensProvider;
//# sourceMappingURL=abstractCodeLensProvider.js.map