"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var utils_1 = require('../../common/utils');
var semver = require('semver');
function npmVersionParser(node, appConfig) {
    var _a = node.value, packageName = _a.location, packageVersion = _a.value;
    var result;
    // check if we have a local file version
    if (result = parseFileVersion(packageName, packageVersion))
        return result;
    // TODO: implement raw git url support too
    // check if we have a github version
    if (result = parseGithubVersionLink(packageName, packageVersion, appConfig.githubCompareOptions))
        return result;
    // must be a registry version
    // check if its a valid semver, if not could be a tag
    var isValidSemver = semver.validRange(packageVersion);
    return [{
            packageName: packageName,
            packageVersion: packageVersion,
            meta: {
                type: 'npm'
            },
            isValidSemver: isValidSemver,
            customGenerateVersion: null
        }];
}
exports.npmVersionParser = npmVersionParser;
function parseFileVersion(packageName, packageVersion) {
    var fileRegExpResult = utils_1.fileDependencyRegex.exec(packageVersion);
    if (fileRegExpResult) {
        var meta = {
            type: "file",
            remoteUrl: "" + fileRegExpResult[1]
        };
        return [{
                packageName: packageName,
                packageVersion: packageVersion,
                meta: meta,
                customGenerateVersion: null
            }];
    }
}
exports.parseFileVersion = parseFileVersion;
function parseGithubVersionLink(packageName, packageVersion, githubCompareOptions) {
    var gitHubRegExpResult = utils_1.gitHubDependencyRegex.exec(packageVersion);
    if (gitHubRegExpResult) {
        var proto = "https";
        var user = gitHubRegExpResult[1];
        var repo = gitHubRegExpResult[3];
        var userRepo_1 = user + "/" + repo;
        var commitish_1 = gitHubRegExpResult[4] ? gitHubRegExpResult[4].substring(1) : '';
        var commitishSlug = commitish_1 ? "/commit/" + commitish_1 : '';
        var remoteUrl_1 = proto + "://github.com/" + user + "/" + repo + commitishSlug;
        return githubCompareOptions.map(function (category) {
            var parseResult = {
                packageName: packageName,
                packageVersion: packageVersion,
                meta: {
                    category: category,
                    type: "github",
                    remoteUrl: remoteUrl_1,
                    userRepo: userRepo_1,
                    commitish: commitish_1
                },
                customGenerateVersion: customGenerateVersion
            };
            return parseResult;
        });
    }
}
exports.parseGithubVersionLink = parseGithubVersionLink;
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
    return packageInfo.meta.userRepo + "#" + preservedLeadingVersion;
}
exports.customGenerateVersion = customGenerateVersion;
//# sourceMappingURL=npmVersionParser.js.map