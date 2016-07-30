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
var https = require('https');
var tmp = require('tmp');
var url_1 = require('url');
var omnisharp_1 = require('./omnisharp');
var platform_1 = require('../platform');
var proxy_1 = require('../proxy');
var decompress = require('decompress');
var BaseDownloadUrl = 'https://omnisharpdownload.blob.core.windows.net/ext';
var OmniSharpVersion = '1.9-beta12';
tmp.setGracefulCleanup();
function getDownloadFileName(flavor, platform) {
    var fileName = "omnisharp-" + OmniSharpVersion + "-";
    if (flavor === omnisharp_1.Flavor.CoreCLR) {
        switch (platform) {
            case platform_1.Platform.Windows:
                fileName += 'win-x64-netcoreapp1.0.zip';
                break;
            case platform_1.Platform.OSX:
                fileName += 'osx-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.CentOS:
                fileName += 'centos-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.Debian:
                fileName += 'debian-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.Fedora:
                fileName += 'fedora-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.OpenSUSE:
                fileName += 'opensuse-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.RHEL:
                fileName += 'rhel-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.Ubuntu14:
                fileName += 'ubuntu14-x64-netcoreapp1.0.tar.gz';
                break;
            case platform_1.Platform.Ubuntu16:
                fileName += 'ubuntu16-x64-netcoreapp1.0.tar.gz';
                break;
            default:
                if (process.platform === 'linux') {
                    throw new Error("Unsupported linux distribution");
                }
                else {
                    throw new Error("Unsupported platform: " + process.platform);
                }
        }
    }
    else if (flavor === omnisharp_1.Flavor.Desktop) {
        fileName += 'win-x64-net451.zip';
    }
    else if (flavor === omnisharp_1.Flavor.Mono) {
        fileName += 'mono.tar.gz';
    }
    else {
        throw new Error("Unexpected OmniSharp flavor specified: " + flavor);
    }
    return fileName;
}
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
function go(flavor, platform, log, proxy, strictSSL) {
    return new Promise(function (resolve, reject) {
        log = log || (function (_) { });
        log("Flavor: " + flavor + ", Platform: " + platform);
        var fileName = getDownloadFileName(flavor, platform);
        var installDirectory = omnisharp_1.getInstallDirectory(flavor);
        log("[INFO] Installing OmniSharp to " + installDirectory);
        var urlString = BaseDownloadUrl + "/" + fileName;
        log("[INFO] Attempting to download " + fileName + "...");
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
                    return decompress(tmpPath, installDirectory)
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
exports.go = go;
//# sourceMappingURL=download.js.map