"use strict";
var fs_1 = require('fs');
var path_1 = require('path');
var FileInfo_1 = require('./FileInfo');
function getChildrenOfPath(path) {
    return readdirPromise(path)
        .then(function (files) { return files.filter(notHidden).map(function (f) { return new FileInfo_1.FileInfo(path, f); }); })
        .catch(function () { return []; });
}
exports.getChildrenOfPath = getChildrenOfPath;
function getPath(fileName, text) {
    return path_1.resolve(fileName.substring(0, fileName.lastIndexOf(path_1.sep)), text);
}
exports.getPath = getPath;
function readdirPromise(path) {
    return new Promise(function (resolve, reject) {
        fs_1.readdir(path, function (error, files) {
            if (error) {
                reject(error);
            }
            else {
                resolve(files);
            }
        });
    });
}
function notHidden(filename) {
    return filename[0] !== '.';
}
//# sourceMappingURL=fs-functions.js.map