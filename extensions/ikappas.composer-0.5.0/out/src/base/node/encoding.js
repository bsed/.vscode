/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var iconv = require('iconv-lite');
exports.UTF8 = 'utf8';
exports.UTF8_with_bom = 'utf8bom';
exports.UTF16be = 'utf16be';
exports.UTF16le = 'utf16le';
function decode(buffer, encoding, options) {
    return iconv.decode(buffer, toNodeEncoding(encoding), options);
}
exports.decode = decode;
function encode(content, encoding, options) {
    return iconv.encode(content, toNodeEncoding(encoding), options);
}
exports.encode = encode;
function encodingExists(encoding) {
    return iconv.encodingExists(toNodeEncoding(encoding));
}
exports.encodingExists = encodingExists;
function decodeStream(encoding) {
    return iconv.decodeStream(toNodeEncoding(encoding));
}
exports.decodeStream = decodeStream;
function encodeStream(encoding) {
    return iconv.encodeStream(toNodeEncoding(encoding));
}
exports.encodeStream = encodeStream;
function toNodeEncoding(enc) {
    if (enc === exports.UTF8_with_bom) {
        return exports.UTF8; // iconv does not distinguish UTF 8 with or without BOM, so we need to help it
    }
    return enc;
}
function detectEncodingByBOMFromBuffer(buffer, bytesRead) {
    if (!buffer || bytesRead < 2) {
        return null;
    }
    var b0 = buffer.readUInt8(0);
    var b1 = buffer.readUInt8(1);
    // UTF-16 BE
    if (b0 === 0xFE && b1 === 0xFF) {
        return exports.UTF16be;
    }
    // UTF-16 LE
    if (b0 === 0xFF && b1 === 0xFE) {
        return exports.UTF16le;
    }
    if (bytesRead < 3) {
        return null;
    }
    var b2 = buffer.readUInt8(2);
    // UTF-8
    if (b0 === 0xEF && b1 === 0xBB && b2 === 0xBF) {
        return exports.UTF8;
    }
    return null;
}
exports.detectEncodingByBOMFromBuffer = detectEncodingByBOMFromBuffer;
//# sourceMappingURL=encoding.js.map