/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
var https = require('https');
var tmp = require('tmp');
var url_1 = require('url');
var utils_1 = require('./utils');
var proxy_1 = require('./proxy');
var decompress = require('decompress');
var BaseDownloadUrl = 'https://omnisharpdownload.blob.core.windows.net/ext';
var DefaultInstallLocation = path.join(__dirname, '../.omnisharp');
exports.OmniSharpVersion = '1.9-beta11';
tmp.setGracefulCleanup();
function getOmnisharpAssetName() {
    switch (utils_1.getSupportedPlatform()) {
        case utils_1.SupportedPlatform.Windows:
            return "omnisharp-" + exports.OmniSharpVersion + "-win-x64-net451.zip";
        case utils_1.SupportedPlatform.OSX:
            return "omnisharp-" + exports.OmniSharpVersion + "-osx-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.CentOS:
            return "omnisharp-" + exports.OmniSharpVersion + "-centos-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.Debian:
            return "omnisharp-" + exports.OmniSharpVersion + "-debian-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.Fedora:
            return "omnisharp-" + exports.OmniSharpVersion + "-fedora-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.OpenSUSE:
            return "omnisharp-" + exports.OmniSharpVersion + "-opensuse-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.RHEL:
            return "omnisharp-" + exports.OmniSharpVersion + "-rhel-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.Ubuntu14:
            return "omnisharp-" + exports.OmniSharpVersion + "-ubuntu14-x64-netcoreapp1.0.tar.gz";
        case utils_1.SupportedPlatform.Ubuntu16:
            return "omnisharp-" + exports.OmniSharpVersion + "-ubuntu16-x64-netcoreapp1.0.tar.gz";
        default:
            if (process.platform === 'linux') {
                throw new Error("Unsupported linux distribution");
            }
            else {
                throw new Error("Unsupported platform: " + process.platform);
            }
    }
}
exports.getOmnisharpAssetName = getOmnisharpAssetName;
function download(urlString, proxy, strictSSL) {
    var url = url_1.parse(urlString);
    var agent = proxy_1.getProxyAgent(url, proxy, strictSSL);
    var options = {
        host: url.host,
        path: url.path,
        agent: agent
    };
    return new Promise(function (resolve, reject) {
        return https.get(options, function (res) {
            // handle redirection
            if (res.statusCode === 302) {
                return download(res.headers.location);
            }
            else if (res.statusCode !== 200) {
                return reject(Error("Download failed with code " + res.statusCode + "."));
            }
            return resolve(res);
        });
    });
}
function downloadOmnisharp(log, omnisharpAssetName, proxy, strictSSL) {
    return new Promise(function (resolve, reject) {
        log("[INFO] Installing to " + DefaultInstallLocation);
        var assetName = omnisharpAssetName || getOmnisharpAssetName();
        var urlString = BaseDownloadUrl + "/" + assetName;
        log("[INFO] Attempting to download " + assetName + "...");
        return download(urlString, proxy, strictSSL)
            .then(function (inStream) {
            tmp.file(function (err, tmpPath, fd, cleanupCallback) {
                if (err) {
                    return reject(err);
                }
                log("[INFO] Downloading to " + tmpPath + "...");
                var outStream = fs.createWriteStream(null, { fd: fd });
                outStream.once('error', function (err) { return reject(err); });
                inStream.once('error', function (err) { return reject(err); });
                outStream.once('finish', function () {
                    // At this point, the asset has finished downloading.
                    log("[INFO] Download complete!");
                    log("[INFO] Decompressing...");
                    return decompress(tmpPath, DefaultInstallLocation)
                        .then(function (files) {
                        log("[INFO] Done! " + files.length + " files unpacked.");
                        return resolve(true);
                    })
                        .catch(function (err) {
                        log("[ERROR] " + err);
                        return reject(err);
                    });
                });
                inStream.pipe(outStream);
            });
        })
            .catch(function (err) {
            log("[ERROR] " + err);
        });
    });
}
exports.downloadOmnisharp = downloadOmnisharp;
//# sourceMappingURL=omnisharpDownload.js.map