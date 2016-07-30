/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var child_process = require('child_process');
(function (Platform) {
    Platform[Platform["Unknown"] = 0] = "Unknown";
    Platform[Platform["Windows"] = 1] = "Windows";
    Platform[Platform["OSX"] = 2] = "OSX";
    Platform[Platform["CentOS"] = 3] = "CentOS";
    Platform[Platform["Debian"] = 4] = "Debian";
    Platform[Platform["Fedora"] = 5] = "Fedora";
    Platform[Platform["OpenSUSE"] = 6] = "OpenSUSE";
    Platform[Platform["RHEL"] = 7] = "RHEL";
    Platform[Platform["Ubuntu14"] = 8] = "Ubuntu14";
    Platform[Platform["Ubuntu16"] = 9] = "Ubuntu16";
})(exports.Platform || (exports.Platform = {}));
var Platform = exports.Platform;
function getCurrentPlatform() {
    if (process.platform === 'win32') {
        return Platform.Windows;
    }
    else if (process.platform === 'darwin') {
        return Platform.OSX;
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
                    return Platform.Ubuntu14;
                }
                else if (versionId.startsWith("16")) {
                    return Platform.Ubuntu16;
                }
            case 'centos':
                return Platform.CentOS;
            case 'fedora':
                return Platform.Fedora;
            case 'opensuse':
                return Platform.OpenSUSE;
            case 'rhel':
                return Platform.RHEL;
            case 'debian':
                return Platform.Debian;
            case 'ol':
                // Oracle Linux is binary compatible with CentOS
                return Platform.CentOS;
        }
    }
    return Platform.Unknown;
}
exports.getCurrentPlatform = getCurrentPlatform;
//# sourceMappingURL=platform.js.map