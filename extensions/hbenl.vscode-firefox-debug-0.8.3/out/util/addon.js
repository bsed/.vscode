"use strict";
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
const semver = require("semver");
const FirefoxProfile = require("firefox-profile");
const zipdir = require("zip-dir");
function createXpi(addonType, addonPath, destDir) {
    return new Promise((resolve, reject) => {
        switch (addonType) {
            case 'legacy':
            case 'webExtension':
                let destFile = path.join(destDir, 'addon.xpi');
                zipdir(addonPath, { saveTo: destFile }, (err, buffer) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(destFile);
                    }
                });
                break;
            case 'addonSdk':
                try {
                    let jpmVersion = child_process_1.execSync('jpm -V', { encoding: 'utf8' });
                    jpmVersion = jpmVersion.trim();
                    if (semver.lt(jpmVersion, '1.2.0')) {
                        reject(`Please install a newer version of jpm (You have ${jpmVersion}, but 1.2.0 or newer is required)`);
                        return;
                    }
                    child_process_1.execSync(`jpm xpi --dest-dir "${destDir}"`, { cwd: addonPath });
                    resolve(path.join(destDir, fs.readdirSync(destDir)[0]));
                }
                catch (err) {
                    reject(`Couldn't run jpm: ${err.stderr}`);
                }
                break;
        }
    });
}
exports.createXpi = createXpi;
function findAddonId(addonPath) {
    return new Promise((resolve) => {
        var dummyProfile = new FirefoxProfile();
        dummyProfile._addonDetails(addonPath, (addonDetails) => {
            resolve(addonDetails.id);
        });
    });
}
exports.findAddonId = findAddonId;
//# sourceMappingURL=addon.js.map