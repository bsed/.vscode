"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
exports.fileDependencyRegex = /^file:(.*)$/;
exports.gitHubDependencyRegex = /^\/?([^:\/\s]+)(\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;
exports.stripSymbolFromVersionRegex = /^(?:[^0-9]+)?(.+)$/;
exports.extractSymbolFromVersionRegex = /^([^0-9]*)?.*$/;
exports.semverLeadingChars = ['^', '~', '<', '<=', '>', '>='];
function formatWithExistingLeading(existingVersion, newVersion) {
    var regExResult = exports.extractSymbolFromVersionRegex.exec(existingVersion);
    var leading = regExResult && regExResult[1];
    if (!leading || !exports.semverLeadingChars.includes(leading))
        return newVersion;
    return "" + leading + newVersion;
}
exports.formatWithExistingLeading = formatWithExistingLeading;
//# sourceMappingURL=utils.js.map