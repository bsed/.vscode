"use strict";
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
var adm_zip = require('adm-zip');
var temp = require('temp').track();
class Util {
    static HttpPostJson(path, obj, headers) {
        return new Promise(function (resolve, reject) {
            var item = url.parse(path);
            var postData = JSON.stringify(obj);
            var newHeader = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            };
            Object.assign(newHeader, headers);
            var options = {
                host: item.hostname,
                port: +item.port,
                path: item.path,
                method: 'POST',
                headers: newHeader
            };
            if (item.protocol.startsWith('https:')) {
                var req = https.request(options, function (res) {
                    if (res.statusCode !== 200) {
                    }
                    var result = '';
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        result += chunk;
                    });
                    res.on('end', function () {
                        resolve(result);
                    });
                    res.on('error', function (e) {
                        reject(e);
                    });
                });
                req.write(postData);
            }
            else {
                var req = http.request(options, function (res) {
                    var result = '';
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        result += chunk;
                    });
                    res.on('end', function () {
                        resolve(result);
                    });
                    res.on('error', function (e) {
                        reject(e);
                    });
                });
                req.write(postData);
            }
        });
    }
    static HttpGetFile(path) {
        var tempFile = temp.path();
        var file = fs.createWriteStream(tempFile);
        return new Promise(function (resolve, reject) {
            if (path.startsWith('https:')) {
                https.get(path, (res) => {
                    // return value
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(tempFile);
                    });
                }).on('error', (e) => {
                    reject(e);
                });
            }
            else {
                http.get(path, (res) => {
                    // return value
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(tempFile);
                    });
                }).on('error', (e) => {
                    reject(e);
                });
            }
        });
    }
    static WriteToFile(content) {
        var tempFile = temp.path();
        return new Promise(function (resolve, reject) {
            fs.writeFile(tempFile, content, function (err) {
                if (err) {
                    reject(err);
                }
                resolve(tempFile);
            });
        });
    }
    static Extract(filePath) {
        var dirName = temp.path();
        var zip = new adm_zip(filePath);
        return new Promise(function (resolve, reject) {
            temp.mkdir(dirName, function (err, dirPath) {
                try {
                    zip.extractAllTo(dirName, /*overwrite*/ true);
                    resolve(dirName);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.Util = Util;
//# sourceMappingURL=util.js.map