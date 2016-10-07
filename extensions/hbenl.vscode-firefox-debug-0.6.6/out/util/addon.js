"use strict";
var path = require('path');
var fs = require('fs');
var FirefoxProfile = require('firefox-profile');
var getJetpackAddonId = require('jetpack-id');
/**
 * Returns either true and the addonId or false and an error message
 */
function findAddonId(addonType, addonPath) {
    var manifestPath;
    var manifest;
    switch (addonType) {
        case 'legacy':
            manifestPath = path.join(addonPath, 'install.rdf');
            try {
                fs.accessSync(manifestPath, fs.R_OK);
            }
            catch (err) {
                return [false, ("Couldn't read " + manifestPath)];
            }
            return [true, getLegacyAddonId(addonPath)];
        case 'addonSdk':
            manifestPath = path.join(addonPath, 'package.json');
            try {
                fs.accessSync(manifestPath, fs.R_OK);
            }
            catch (err) {
                return [false, ("Couldn't read " + manifestPath)];
            }
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            return [true, getJetpackAddonId(manifest)];
        case 'webExtension':
            manifestPath = path.join(addonPath, 'manifest.json');
            try {
                fs.accessSync(manifestPath, fs.R_OK);
            }
            catch (err) {
                return [false, ("Couldn't read " + manifestPath)];
            }
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            var addonId = (((manifest || {}).applications || {}).gecko || {}).id;
            if (!addonId) {
                return [false, ("Please define your addonId (as applications.gecko.id) in " + manifestPath)];
            }
            return [true, addonId];
    }
}
exports.findAddonId = findAddonId;
// we perform some Voodoo tricks to extract the private _addonDetails method
// (which uses the _sanitizePref method) from FirefoxProfile
function FirefoxProfileVoodoo() { }
FirefoxProfileVoodoo.prototype._addonDetails = FirefoxProfile.prototype._addonDetails;
FirefoxProfileVoodoo.prototype._sanitizePref = FirefoxProfile.prototype._sanitizePref;
// and now more Voodoo tricks to turn the (blocking) callback-based method
// into a simple synchronous method
function getLegacyAddonId(addonPath) {
    var addonDetails;
    var voodoo = new FirefoxProfileVoodoo();
    voodoo._addonDetails(addonPath, function (result) { return addonDetails = result; });
    return addonDetails.id;
}
//# sourceMappingURL=addon.js.map