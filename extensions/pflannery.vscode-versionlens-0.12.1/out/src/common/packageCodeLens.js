"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var vscode_1 = require('vscode');
var utils_1 = require('./utils');
var PackageCodeLens = (function (_super) {
    __extends(PackageCodeLens, _super);
    function PackageCodeLens(entryRange, versionRange, packageInfo, documentUrl) {
        _super.call(this, entryRange);
        this.versionRange = versionRange || entryRange;
        this.package = packageInfo;
        this.documentUrl = documentUrl;
        this.command = null;
    }
    PackageCodeLens.prototype.generateNewVersion = function (newVersion) {
        if (!this.package.customGenerateVersion)
            return utils_1.formatWithExistingLeading(this.package.version, newVersion);
        return this.package.customGenerateVersion.call(this, this.package, newVersion);
    };
    PackageCodeLens.prototype.setCommand = function (text, command, args) {
        this.command = {
            title: text,
            command: command || null,
            arguments: args || null
        };
        return this;
    };
    return PackageCodeLens;
}(vscode_1.CodeLens));
exports.PackageCodeLens = PackageCodeLens;
//# sourceMappingURL=packageCodeLens.js.map