"use strict";
const os = require("os");
function vscodePath() {
    let appPath = process.env.APPDATA;
    if (!appPath) {
        if (process.platform === 'darwin') {
            appPath = process.env.HOME + '/Library/Application Support';
        }
        else if (process.platform === 'linux') {
            appPath = os.homedir() + '/.config';
        }
        else {
            appPath = '/var/local';
        }
    }
    return appPath;
}
exports.vscodePath = vscodePath;
;
//# sourceMappingURL=vscodePath.js.map