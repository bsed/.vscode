/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var fs = require('fs');
var path = require('path');
var binPathCache = {};
var runtimePathCache = null;
function getBinPath(binname) {
    binname = correctBinname(binname);
    if (binPathCache[binname])
        return binPathCache[binname];
    // First search each GOPATH workspace's bin folder
    if (process.env['GOPATH']) {
        var workspaces = process.env['GOPATH'].split(path.delimiter);
        for (var i = 0; i < workspaces.length; i++) {
            var binpath = path.join(workspaces[i], 'bin', binname);
            if (fs.existsSync(binpath)) {
                binPathCache[binname] = binpath;
                return binpath;
            }
        }
    }
    // Then search PATH parts
    if (process.env['PATH']) {
        var pathparts = process.env['PATH'].split(path.delimiter);
        for (var i = 0; i < pathparts.length; i++) {
            var binpath = path.join(pathparts[i], binname);
            if (fs.existsSync(binpath)) {
                binPathCache[binname] = binpath;
                return binpath;
            }
        }
    }
    // Finally check GOROOT just in case
    if (process.env['GOROOT']) {
        var binpath = path.join(process.env['GOROOT'], 'bin', binname);
        if (fs.existsSync(binpath)) {
            binPathCache[binname] = binpath;
            return binpath;
        }
    }
    // Else return the binary name directly (this will likely always fail downstream) 
    binPathCache[binname] = binname;
    return binname;
}
exports.getBinPath = getBinPath;
function correctBinname(binname) {
    if (process.platform === 'win32')
        return binname + '.exe';
    else
        return binname;
}
/**
 * Returns Go runtime binary path.
 *
 * @return the path to the Go binary.
 */
function getGoRuntimePath() {
    if (runtimePathCache)
        return runtimePathCache;
    if (process.env['GOROOT']) {
        runtimePathCache = path.join(process.env['GOROOT'], 'bin', correctBinname('go'));
    }
    else if (process.env['PATH']) {
        var pathparts = process.env.PATH.split(path.delimiter);
        runtimePathCache = pathparts.map(function (dir) { return path.join(dir, correctBinname('go')); }).filter(function (candidate) { return fs.existsSync(candidate); })[0];
    }
    return runtimePathCache;
}
exports.getGoRuntimePath = getGoRuntimePath;
//# sourceMappingURL=goPath.js.map