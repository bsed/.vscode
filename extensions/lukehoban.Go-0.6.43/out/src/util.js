/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
var path = require('path');
function byteOffsetAt(document, position) {
    var offset = document.offsetAt(position);
    var text = document.getText();
    var byteOffset = 0;
    for (var i = 0; i < offset; i++) {
        var clen = Buffer.byteLength(text[i]);
        byteOffset += clen;
    }
    return byteOffset;
}
exports.byteOffsetAt = byteOffsetAt;
function parseFilePrelude(text) {
    var lines = text.split('\n');
    var ret = { imports: [], pkg: null };
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^(\s)*package(\s)+/)) {
            ret.pkg = { start: i, end: i };
        }
        if (line.match(/^(\s)*import(\s)+\(/)) {
            ret.imports.push({ kind: 'multi', start: i, end: -1 });
        }
        if (line.match(/^(\s)*import(\s)+[^\(]/)) {
            ret.imports.push({ kind: 'single', start: i, end: i });
        }
        if (line.match(/^(\s)*\)/)) {
            if (ret.imports[ret.imports.length - 1].end === -1) {
                ret.imports[ret.imports.length - 1].end = i;
            }
        }
        if (line.match(/^(\s)*(func|const|type|var)/)) {
            break;
        }
    }
    return ret;
}
exports.parseFilePrelude = parseFilePrelude;
// Takes a Go function signature like:
//     (foo, bar string, baz number) (string, string) 
// and returns an array of parameter strings:
//     ["foo", "bar string", "baz string"]
// Takes care of balancing parens so to not get confused by signatures like:
//     (pattern string, handler func(ResponseWriter, *Request)) {
function parameters(signature) {
    var ret = [];
    var parenCount = 0;
    var lastStart = 1;
    for (var i = 1; i < signature.length; i++) {
        switch (signature[i]) {
            case '(':
                parenCount++;
                break;
            case ')':
                parenCount--;
                if (parenCount < 0) {
                    if (i > lastStart) {
                        ret.push(signature.substring(lastStart, i));
                    }
                    return ret;
                }
                break;
            case ',':
                if (parenCount === 0) {
                    ret.push(signature.substring(lastStart, i));
                    lastStart = i + 2;
                }
                break;
        }
    }
    return null;
}
exports.parameters = parameters;
function canonicalizeGOPATHPrefix(filename) {
    var gopath = process.env['GOPATH'];
    if (!gopath)
        return filename;
    var workspaces = gopath.split(path.delimiter);
    var filenameLowercase = filename.toLowerCase();
    for (var _i = 0, workspaces_1 = workspaces; _i < workspaces_1.length; _i++) {
        var workspace = workspaces_1[_i];
        if (filenameLowercase.substring(0, workspace.length) === workspace.toLowerCase()) {
            return workspace + filename.slice(workspace.length);
        }
    }
    return filename;
}
exports.canonicalizeGOPATHPrefix = canonicalizeGOPATHPrefix;
//# sourceMappingURL=util.js.map