"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var vscode_1 = require('vscode');
var typeAssertion_1 = require('./typeAssertion');
var packageCodeLens_1 = require('./packageCodeLens');
var PackageCodeLensList = (function () {
    function PackageCodeLensList(document, appConfig) {
        typeAssertion_1.assertDefined(document, "PackageCodeLensList: document parameter is invalid");
        typeAssertion_1.assertDefined(appConfig, "PackageCodeLensList: appConfig parameter is invalid");
        this.collection = [];
        this.document = document;
        this.appConfig = appConfig;
    }
    PackageCodeLensList.prototype.addDependencyNode = function (node, versionParser) {
        var packageNode = node.value;
        var entryRange = new vscode_1.Range(this.document.positionAt(packageNode.start), this.document.positionAt(packageNode.end));
        var documentUrl = vscode_1.Uri.file(this.document.fileName);
        var versionRange = entryRange;
        var packageInfo = {
            name: packageNode.location,
            version: packageNode.value,
            meta: null,
            isValidSemver: null
        };
        // handle cases where version is stored as a child property.
        if (packageNode.type === 'object') {
            var versionInfo = this.getVersionRangeFromParent_(packageNode);
            // if there isn't any version info then dont add this item
            if (!versionInfo)
                return;
            // update the version info
            versionRange = versionInfo.range;
            packageInfo.version = versionInfo.version;
        }
        if (!versionParser) {
            // append a single code lens for rendering
            this.collection.push(new packageCodeLens_1.PackageCodeLens(entryRange, versionRange, packageInfo, documentUrl));
            return;
        }
        // execute the custom version parser (if present)
        var parseResults = versionParser(node, this.appConfig);
        if (!parseResults)
            return;
        var codeLensToAdd = parseResults.map(function (parseResult) {
            var pkg = {
                name: parseResult.packageName,
                version: parseResult.packageVersion,
                meta: parseResult.meta,
                isValidSemver: parseResult.isValidSemver,
                customGenerateVersion: parseResult.customGenerateVersion
            };
            return new packageCodeLens_1.PackageCodeLens(entryRange, versionRange, pkg, documentUrl);
        });
        this.collection.push.apply(this.collection, codeLensToAdd);
    };
    PackageCodeLensList.prototype.addNode = function (node) {
        var entryRange = new vscode_1.Range(this.document.positionAt(node.start), this.document.positionAt(node.end));
        var documentUrl = vscode_1.Uri.file(this.document.fileName);
        var newCodeLens = new packageCodeLens_1.PackageCodeLens(entryRange, null, null, documentUrl);
        this.collection.push(newCodeLens);
        return newCodeLens;
    };
    PackageCodeLensList.prototype.addDependencyNodeRange = function (nodes, versionParser) {
        var _this = this;
        nodes.forEach(function (node) { return _this.addDependencyNode(node, versionParser); });
    };
    PackageCodeLensList.prototype.getVersionRangeFromParent_ = function (parentNode) {
        var childNodes = parentNode.getChildNodes();
        for (var i = 0; i < childNodes.length; i++) {
            var childNode = childNodes[i];
            if (childNode.key.value === 'version') {
                return {
                    range: new vscode_1.Range(this.document.positionAt(childNode.value.start), this.document.positionAt(childNode.value.end)),
                    version: childNode.value.value
                };
            }
        }
    };
    return PackageCodeLensList;
}());
exports.PackageCodeLensList = PackageCodeLensList;
//# sourceMappingURL=packageCodeLensList.js.map