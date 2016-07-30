/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/*
 * Note that this file intentionally does not import 'vscode' as the code within is intended
 * to be usable outside of VS Code.
 */
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
(function (Flavor) {
    Flavor[Flavor["CoreCLR"] = 0] = "CoreCLR";
    Flavor[Flavor["Mono"] = 1] = "Mono";
    Flavor[Flavor["Desktop"] = 2] = "Desktop";
})(exports.Flavor || (exports.Flavor = {}));
var Flavor = exports.Flavor;
/**
 * Given a file path, returns the path to the OmniSharp launch file.
 */
function findServerPath(filePath) {
    return fs.lstatAsync(filePath).then(function (stats) {
        // If a file path was passed, assume its the launch file.
        if (stats.isFile()) {
            return filePath;
        }
        // Otherwise, search the specified folder.
        var candidate;
        candidate = path.join(filePath, 'OmniSharp.exe');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        candidate = path.join(filePath, 'OmniSharp');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        throw new Error("Could not find OmniSharp launch file in " + filePath + ".");
    });
}
exports.findServerPath = findServerPath;
function getInstallDirectory(flavor) {
    var basePath = path.join(__dirname, '../.omnisharp');
    switch (flavor) {
        case Flavor.CoreCLR:
            return basePath + '-coreclr';
        case Flavor.Desktop:
            return basePath + '-desktop';
        case Flavor.Mono:
            return basePath + '-mono';
        default:
            throw new Error("Unexpected OmniSharp flavor specified: " + flavor);
    }
}
exports.getInstallDirectory = getInstallDirectory;
//# sourceMappingURL=omnisharp.js.map