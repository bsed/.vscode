"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var utils_1 = require('../../common/utils');
var semver = require('semver');
function bowerVersionParser(node, appConfig) {
    var _a = node.value, packageName = _a.location, packageVersion = _a.value;
    var result;
    // check if we have a github version
    if (result = parseGithubVersionLink(packageName, packageVersion, appConfig.githubCompareOptions))
        return result;
    // check if its a valid semver, if not could be a tag
    var isValidSemver = semver.validRange(packageVersion);
    return [{
            packageName: packageName,
            packageVersion: packageVersion,
            meta: {
                type: 'bower'
            },
            isValidSemver: isValidSemver,
            customGenerateVersion: null
        }];
}
exports.bowerVersionParser = bowerVersionParser;
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
                customGenerateVersion: function (packageInfo, newVersion) { return (packageInfo.meta.userRepo + "#" + newVersion); }
            };
            return parseResult;
        });
    }
}
exports.parseGithubVersionLink = parseGithubVersionLink;
//# sourceMappingURL=bowerVersionParser.js.map