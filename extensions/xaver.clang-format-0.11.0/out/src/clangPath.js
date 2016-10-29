'use strict';
const fs = require('fs');
const path = require('path');
var binPathCache = {};
function getBinPath(binname) {
    binname = correctBinname(binname);
    if (binPathCache[binname])
        return binPathCache[binname];
    // clang-format.executable has a valid absolute path
    if (fs.existsSync(binname)) {
        binPathCache[binname] = binname;
        return binname;
    }
    if (process.env["PATH"]) {
        var pathparts = process.env["PATH"].split(path.delimiter);
        for (var i = 0; i < pathparts.length; i++) {
            let binpath = path.join(pathparts[i], binname);
            if (fs.existsSync(binpath)) {
                binPathCache[binname] = binpath;
                return binpath;
            }
        }
    }
    // Else return the binary name directly (this will likely always fail downstream) 
    binPathCache[binname] = binname;
    return binname;
}
exports.getBinPath = getBinPath;
function correctBinname(binname) {
    if (process.platform === 'win32') {
        if (binname.substr(binname.length - 4).toLowerCase() !== '.exe') {
            return binname + ".exe";
        }
        else {
            return binname;
        }
    }
    else {
        return binname;
    }
}
//# sourceMappingURL=clangPath.js.map