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
    SupportedPlatform[SupportedPlatform["Fedora"] = 5] = "Fedora";
    SupportedPlatform[SupportedPlatform["OpenSUSE"] = 6] = "OpenSUSE";
    SupportedPlatform[SupportedPlatform["RHEL"] = 7] = "RHEL";
    SupportedPlatform[SupportedPlatform["Ubuntu14"] = 8] = "Ubuntu14";
    SupportedPlatform[SupportedPlatform["Ubuntu16"] = 9] = "Ubuntu16";
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
        // Get the text of /etc/os-release to discover which Linux distribution we're running on.
        // For details: https://www.freedesktop.org/software/systemd/man/os-release.html
        var text = child_process.execSync('cat /etc/os-release').toString();
        var lines_1 = text.split('\n');
        function getValue(name) {
            for (var _i = 0, lines_2 = lines_1; _i < lines_2.length; _i++) {
                var line = lines_2[_i];
                line = line.trim();
                if (line.startsWith(name)) {
                    var equalsIndex = line.indexOf('=');
                    if (equalsIndex >= 0) {
                        var value = line.substring(equalsIndex + 1);
                        // Strip double quotes if necessary
                        if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        return value;
                    }
                }
            }
            return undefined;
        }
        var id = getValue("ID");
        switch (id) {
            case 'ubuntu':
                var versionId = getValue("VERSION_ID");
                if (versionId.startsWith("14")) {
                    // This also works for Linux Mint
                    return SupportedPlatform.Ubuntu14;
                }
                else if (versionId.startsWith("16")) {
                    return SupportedPlatform.Ubuntu16;
                }
            case 'centos':
                return SupportedPlatform.CentOS;
            case 'fedora':
                return SupportedPlatform.Fedora;
            case 'opensuse':
                return SupportedPlatform.OpenSUSE;
            case 'rhel':
                return SupportedPlatform.RHEL;
            case 'debian':
                return SupportedPlatform.Debian;
            case 'ol':
                // Oracle Linux is binary compatible with CentOS
                return SupportedPlatform.CentOS;
        }
    }
    return SupportedPlatform.None;
}
exports.getSupportedPlatform = getSupportedPlatform;
//# sourceMappingURL=utils.js.map