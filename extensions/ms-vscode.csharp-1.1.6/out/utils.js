/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var child_process = require('child_process');
(function (SupportedPlatform) {
    SupportedPlatform[SupportedPlatform["None"] = 0] = "None";
    SupportedPlatform[SupportedPlatform["Windows"] = 1] = "Windows";
    SupportedPlatform[SupportedPlatform["OSX"] = 2] = "OSX";
    SupportedPlatform[SupportedPlatform["CentOS"] = 3] = "CentOS";
    SupportedPlatform[SupportedPlatform["Debian"] = 4] = "Debian";
    SupportedPlatform[SupportedPlatform["RHEL"] = 5] = "RHEL";
    SupportedPlatform[SupportedPlatform["Ubuntu"] = 6] = "Ubuntu";
})(exports.SupportedPlatform || (exports.SupportedPlatform = {}));
var SupportedPlatform = exports.SupportedPlatform;
function getSupportedPlatform() {
    if (process.platform === 'win32') {
        return SupportedPlatform.Windows;
    }
    else if (process.platform === 'darwin') {
        return SupportedPlatform.OSX;
    }
    else if (process.platform === 'linux') {
        // Get the text of /etc/*-release to discover which Linux distribution we're running on.
        var release = child_process.execSync('cat /etc/os-release').toString().toLowerCase();
        if (release.indexOf('ubuntu') >= 0) {
            return SupportedPlatform.Ubuntu;
        }
        else if (release.indexOf('centos') >= 0) {
            return SupportedPlatform.CentOS;
        }
        else if (release.indexOf('rhel') >= 0) {
            return SupportedPlatform.RHEL;
        }
        else if (release.indexOf('debian') >= 0) {
            return SupportedPlatform.Debian;
        }
    }
    return SupportedPlatform.None;
}
exports.getSupportedPlatform = getSupportedPlatform;
//# sourceMappingURL=utils.js.map