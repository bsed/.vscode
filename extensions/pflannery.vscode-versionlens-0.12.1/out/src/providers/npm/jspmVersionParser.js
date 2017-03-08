"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var semver = require('semver');
var utils_1 = require('../../common/utils');
var npmVersionParser_1 = require('./npmVersionParser');
var jspmDependencyRegex = /^(npm|github):(.*)@(.*)$/;
function jspmVersionParser(node, appConfig) {
    var _a = node.value, packageName = _a.location, packageVersion = _a.value;
    var regExpResult = jspmDependencyRegex.exec(packageVersion);
    if (!regExpResult)
        return;
    var packageManager = regExpResult[1];
    var extractedPkgName = regExpResult[2];
    var newPkgVersion = regExpResult[3];
    if (packageManager === 'github') {
        var results = npmVersionParser_1.parseGithubVersionLink(extractedPkgName, extractedPkgName + "#" + newPkgVersion, appConfig.githubCompareOptions);
        return results.map(function (result) {
            result.customGenerateVersion = customGenerateVersion;
            return result;
        });
    }
    var isValidSemver = semver.validRange(newPkgVersion);
    return [{
            packageName: extractedPkgName,
            packageVersion: newPkgVersion,
            isValidSemver: isValidSemver,
            meta: {
                type: 'npm'
            },
            customGenerateVersion: customGenerateVersion
        }];
}
exports.jspmVersionParser = jspmVersionParser;
function customGenerateVersion(packageInfo, newVersion) {
    var existingVersion;
    // test if the newVersion is a valid semver range
    // if it is then we need to use the commitish for github versions 
    if (packageInfo.meta.type === 'github' && semver.validRange(newVersion))
        existingVersion = packageInfo.meta.commitish;
    else
        existingVersion = packageInfo.version;
    // preserve the leading symbol from the existing version
    var preservedLeadingVersion = utils_1.formatWithExistingLeading(existingVersion, newVersion);
    return packageInfo.meta.type + ":" + packageInfo.name + "@" + preservedLeadingVersion;
}
exports.customGenerateVersion = customGenerateVersion;
//# sourceMappingURL=jspmVersionParser.js.map