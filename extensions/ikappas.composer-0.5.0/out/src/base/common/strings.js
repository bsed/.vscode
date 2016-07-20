/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
/**
 * The empty string.
 */
exports.empty = '';
exports.space = ' ';
/**
 * @returns the provided number with the given number of preceding zeros.
 */
function pad(n, l, char) {
    if (char === void 0) { char = '0'; }
    var str = '' + n;
    var r = [str];
    for (var i = str.length; i < l; i++) {
        r.push(char);
    }
    return r.reverse().join('');
}
exports.pad = pad;
var _formatRegexp = /{(\d+)}/g;
/**
 * Helper to produce a string with a variable number of arguments. Insert variable segments
 * into the string using the {n} notation where N is the index of the argument following the string.
 * @param value string to which formatting is applied
 * @param args replacements for {n}-entries
 */
function format(value) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (args.length === 0) {
        return value;
    }
    return value.replace(_formatRegexp, function (match, group) {
        var idx = parseInt(group, 10);
        return isNaN(idx) || idx < 0 || idx >= args.length ?
            match :
            args[idx];
    });
}
exports.format = format;
/**
 * Converts HTML characters inside the string to use entities instead. Makes the string safe from
 * being used e.g. in HTMLElement.innerHTML.
 */
function escape(html) {
    return html.replace(/[<|>|&]/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            default: return match;
        }
    });
}
exports.escape = escape;
/**
 * Escapes regular expression characters in a given string
 */
function escapeRegExpCharacters(value) {
    return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
exports.escapeRegExpCharacters = escapeRegExpCharacters;
/**
 * Removes all occurrences of needle from the beginning and end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim (default is a blank)
 */
function trim(haystack, needle) {
    if (needle === void 0) { needle = ' '; }
    var trimmed = ltrim(haystack, needle);
    return rtrim(trimmed, needle);
}
exports.trim = trim;
/**
 * Removes all occurrences of needle from the beginning of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
function ltrim(haystack, needle) {
    if (!haystack || !needle) {
        return haystack;
    }
    var needleLen = needle.length;
    if (needleLen === 0 || haystack.length === 0) {
        return haystack;
    }
    var offset = 0, idx = -1;
    while ((idx = haystack.indexOf(needle, offset)) === offset) {
        offset = offset + needleLen;
    }
    return haystack.substring(offset);
}
exports.ltrim = ltrim;
/**
 * Removes all occurrences of needle from the end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
function rtrim(haystack, needle) {
    if (!haystack || !needle) {
        return haystack;
    }
    var needleLen = needle.length, haystackLen = haystack.length;
    if (needleLen === 0 || haystackLen === 0) {
        return haystack;
    }
    var offset = haystackLen, idx = -1;
    while (true) {
        idx = haystack.lastIndexOf(needle, offset - 1);
        if (idx === -1 || idx + needleLen !== offset) {
            break;
        }
        if (idx === 0) {
            return '';
        }
        offset = idx;
    }
    return haystack.substring(0, offset);
}
exports.rtrim = rtrim;
function convertSimple2RegExpPattern(pattern) {
    return pattern.replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&').replace(/[\*]/g, '.*');
}
exports.convertSimple2RegExpPattern = convertSimple2RegExpPattern;
function stripWildcards(pattern) {
    return pattern.replace(/\*/g, '');
}
exports.stripWildcards = stripWildcards;
/**
 * Determines if haystack starts with needle.
 */
function startsWith(haystack, needle) {
    if (haystack.length < needle.length) {
        return false;
    }
    for (var i = 0; i < needle.length; i++) {
        if (haystack[i] !== needle[i]) {
            return false;
        }
    }
    return true;
}
exports.startsWith = startsWith;
/**
 * Determines if haystack ends with needle.
 */
function endsWith(haystack, needle) {
    var diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.lastIndexOf(needle) === diff;
    }
    else if (diff === 0) {
        return haystack === needle;
    }
    else {
        return false;
    }
}
exports.endsWith = endsWith;
function createRegExp(searchString, isRegex, matchCase, wholeWord, global) {
    if (searchString === '') {
        throw new Error('Cannot create regex from empty string');
    }
    if (!isRegex) {
        searchString = searchString.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
    }
    if (wholeWord) {
        if (!/\B/.test(searchString.charAt(0))) {
            searchString = '\\b' + searchString;
        }
        if (!/\B/.test(searchString.charAt(searchString.length - 1))) {
            searchString = searchString + '\\b';
        }
    }
    var modifiers = '';
    if (global) {
        modifiers += 'g';
    }
    if (!matchCase) {
        modifiers += 'i';
    }
    return new RegExp(searchString, modifiers);
}
exports.createRegExp = createRegExp;
/**
 * Create a regular expression only if it is valid and it doesn't lead to endless loop.
 */
function createSafeRegExp(searchString, isRegex, matchCase, wholeWord) {
    if (searchString === '') {
        return null;
    }
    // Try to create a RegExp out of the params
    var regex = null;
    try {
        regex = createRegExp(searchString, isRegex, matchCase, wholeWord, true);
    }
    catch (err) {
        return null;
    }
    // Guard against endless loop RegExps & wrap around try-catch as very long regexes produce an exception when executed the first time
    try {
        if (regExpLeadsToEndlessLoop(regex)) {
            return null;
        }
    }
    catch (err) {
        return null;
    }
    return regex;
}
exports.createSafeRegExp = createSafeRegExp;
function regExpLeadsToEndlessLoop(regexp) {
    // Exit early if it's one of these special cases which are meant to match
    // against an empty string
    if (regexp.source === '^' || regexp.source === '^$' || regexp.source === '$') {
        return false;
    }
    // We check against an empty string. If the regular expression doesn't advance
    // (e.g. ends in an endless loop) it will match an empty string.
    var match = regexp.exec('');
    return (match && regexp.lastIndex === 0);
}
exports.regExpLeadsToEndlessLoop = regExpLeadsToEndlessLoop;
/**
 * The normalize() method returns the Unicode Normalization Form of a given string. The form will be
 * the Normalization Form Canonical Composition.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize}
 */
exports.canNormalize = typeof (''.normalize) === 'function';
var nonAsciiCharactersPattern = /[^\u0000-\u0080]/;
var normalizedCache = Object.create(null);
var cacheCounter = 0;
function normalizeNFC(str) {
    if (!exports.canNormalize || !str) {
        return str;
    }
    var cached = normalizedCache[str];
    if (cached) {
        return cached;
    }
    var res;
    if (nonAsciiCharactersPattern.test(str)) {
        res = str.normalize('NFC');
    }
    else {
        res = str;
    }
    // Use the cache for fast lookup but do not let it grow unbounded
    if (cacheCounter < 10000) {
        normalizedCache[str] = res;
        cacheCounter++;
    }
    return res;
}
exports.normalizeNFC = normalizeNFC;
/**
 * Returns first index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
function firstNonWhitespaceIndex(str) {
    for (var i = 0, len = str.length; i < len; i++) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return i;
        }
    }
    return -1;
}
exports.firstNonWhitespaceIndex = firstNonWhitespaceIndex;
/**
 * Returns the leading whitespace of the string.
 * If the string contains only whitespaces, returns entire string
 */
function getLeadingWhitespace(str) {
    for (var i = 0, len = str.length; i < len; i++) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return str.substring(0, i);
        }
    }
    return str;
}
exports.getLeadingWhitespace = getLeadingWhitespace;
/**
 * Returns last index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
function lastNonWhitespaceIndex(str) {
    for (var i = str.length - 1; i >= 0; i--) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return i;
        }
    }
    return -1;
}
exports.lastNonWhitespaceIndex = lastNonWhitespaceIndex;
function localeCompare(strA, strB) {
    return strA.localeCompare(strB);
}
exports.localeCompare = localeCompare;
function isAsciiChar(code) {
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
}
function equalsIgnoreCase(a, b) {
    var len1 = a.length, len2 = b.length;
    if (len1 !== len2) {
        return false;
    }
    for (var i = 0; i < len1; i++) {
        var codeA = a.charCodeAt(i), codeB = b.charCodeAt(i);
        if (codeA === codeB) {
            continue;
        }
        else if (isAsciiChar(codeA) && isAsciiChar(codeB)) {
            var diff = Math.abs(codeA - codeB);
            if (diff !== 0 && diff !== 32) {
                return false;
            }
        }
        else {
            if (String.fromCharCode(codeA).toLocaleLowerCase() !== String.fromCharCode(codeB).toLocaleLowerCase()) {
                return false;
            }
        }
    }
    return true;
}
exports.equalsIgnoreCase = equalsIgnoreCase;
/**
 * @returns the length of the common prefix of the two strings.
 */
function commonPrefixLength(a, b) {
    var i, len = Math.min(a.length, b.length);
    for (i = 0; i < len; i++) {
        if (a.charCodeAt(i) !== b.charCodeAt(i)) {
            return i;
        }
    }
    return len;
}
exports.commonPrefixLength = commonPrefixLength;
/**
 * @returns the length of the common suffix of the two strings.
 */
function commonSuffixLength(a, b) {
    var i, len = Math.min(a.length, b.length);
    var aLastIndex = a.length - 1;
    var bLastIndex = b.length - 1;
    for (i = 0; i < len; i++) {
        if (a.charCodeAt(aLastIndex - i) !== b.charCodeAt(bLastIndex - i)) {
            return i;
        }
    }
    return len;
}
exports.commonSuffixLength = commonSuffixLength;
// --- unicode
// http://en.wikipedia.org/wiki/Surrogate_pair
// Returns the code point starting at a specified index in a string
// Code points U+0000 to U+D7FF and U+E000 to U+FFFF are represented on a single character
// Code points U+10000 to U+10FFFF are represented on two consecutive characters
//export function getUnicodePoint(str:string, index:number, len:number):number {
//	let chrCode = str.charCodeAt(index);
//	if (0xD800 <= chrCode && chrCode <= 0xDBFF && index + 1 < len) {
//		let nextChrCode = str.charCodeAt(index + 1);
//		if (0xDC00 <= nextChrCode && nextChrCode <= 0xDFFF) {
//			return (chrCode - 0xD800) << 10 + (nextChrCode - 0xDC00) + 0x10000;
//		}
//	}
//	return chrCode;
//}
//export function isLeadSurrogate(chr:string) {
//	let chrCode = chr.charCodeAt(0);
//	return ;
//}
//
//export function isTrailSurrogate(chr:string) {
//	let chrCode = chr.charCodeAt(0);
//	return 0xDC00 <= chrCode && chrCode <= 0xDFFF;
//}
function isFullWidthCharacter(charCode) {
    // Do a cheap trick to better support wrapping of wide characters, treat them as 2 columns
    // http://jrgraphix.net/research/unicode_blocks.php
    //          2E80 — 2EFF   CJK Radicals Supplement
    //          2F00 — 2FDF   Kangxi Radicals
    //          2FF0 — 2FFF   Ideographic Description Characters
    //          3000 — 303F   CJK Symbols and Punctuation
    //          3040 — 309F   Hiragana
    //          30A0 — 30FF   Katakana
    //          3100 — 312F   Bopomofo
    //          3130 — 318F   Hangul Compatibility Jamo
    //          3190 — 319F   Kanbun
    //          31A0 — 31BF   Bopomofo Extended
    //          31F0 — 31FF   Katakana Phonetic Extensions
    //          3200 — 32FF   Enclosed CJK Letters and Months
    //          3300 — 33FF   CJK Compatibility
    //          3400 — 4DBF   CJK Unified Ideographs Extension A
    //          4DC0 — 4DFF   Yijing Hexagram Symbols
    //          4E00 — 9FFF   CJK Unified Ideographs
    //          A000 — A48F   Yi Syllables
    //          A490 — A4CF   Yi Radicals
    //          AC00 — D7AF   Hangul Syllables
    // [IGNORE] D800 — DB7F   High Surrogates
    // [IGNORE] DB80 — DBFF   High Private Use Surrogates
    // [IGNORE] DC00 — DFFF   Low Surrogates
    // [IGNORE] E000 — F8FF   Private Use Area
    //          F900 — FAFF   CJK Compatibility Ideographs
    // [IGNORE] FB00 — FB4F   Alphabetic Presentation Forms
    // [IGNORE] FB50 — FDFF   Arabic Presentation Forms-A
    // [IGNORE] FE00 — FE0F   Variation Selectors
    // [IGNORE] FE20 — FE2F   Combining Half Marks
    // [IGNORE] FE30 — FE4F   CJK Compatibility Forms
    // [IGNORE] FE50 — FE6F   Small Form Variants
    // [IGNORE] FE70 — FEFF   Arabic Presentation Forms-B
    //          FF00 — FFEF   Halfwidth and Fullwidth Forms
    //               [https://en.wikipedia.org/wiki/Halfwidth_and_fullwidth_forms]
    //               of which FF01 - FF5E fullwidth ASCII of 21 to 7E
    // [IGNORE]    and FF65 - FFDC halfwidth of Katakana and Hangul
    // [IGNORE] FFF0 — FFFF   Specials
    charCode = +charCode; // @perf
    return ((charCode >= 0x2E80 && charCode <= 0xD7AF)
        || (charCode >= 0xF900 && charCode <= 0xFAFF)
        || (charCode >= 0xFF01 && charCode <= 0xFF5E));
}
exports.isFullWidthCharacter = isFullWidthCharacter;
/**
 * Computes the difference score for two strings. More similar strings have a higher score.
 * We use largest common subsequence dynamic programming approach but penalize in the end for length differences.
 * Strings that have a large length difference will get a bad default score 0.
 * Complexity - both time and space O(first.length * second.length)
 * Dynamic programming LCS computation http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 *
 * @param first a string
 * @param second a string
 */
function difference(first, second, maxLenDelta) {
    if (maxLenDelta === void 0) { maxLenDelta = 4; }
    var lengthDifference = Math.abs(first.length - second.length);
    // We only compute score if length of the currentWord and length of entry.name are similar.
    if (lengthDifference > maxLenDelta) {
        return 0;
    }
    // Initialize LCS (largest common subsequence) matrix.
    var LCS = [];
    var zeroArray = [];
    var i, j;
    for (i = 0; i < second.length + 1; ++i) {
        zeroArray.push(0);
    }
    for (i = 0; i < first.length + 1; ++i) {
        LCS.push(zeroArray);
    }
    for (i = 1; i < first.length + 1; ++i) {
        for (j = 1; j < second.length + 1; ++j) {
            if (first[i - 1] === second[j - 1]) {
                LCS[i][j] = LCS[i - 1][j - 1] + 1;
            }
            else {
                LCS[i][j] = Math.max(LCS[i - 1][j], LCS[i][j - 1]);
            }
        }
    }
    return LCS[first.length][second.length] - Math.sqrt(lengthDifference);
}
exports.difference = difference;
/**
 * Returns an array in which every entry is the offset of a
 * line. There is always one entry which is zero.
 */
function computeLineStarts(text) {
    var regexp = /\r\n|\r|\n/g, ret = [0], match;
    while ((match = regexp.exec(text))) {
        ret.push(regexp.lastIndex);
    }
    return ret;
}
exports.computeLineStarts = computeLineStarts;
/**
 * Given a string and a max length returns a shorted version. Shorting
 * happens at favorable positions - such as whitespace or punctuation characters.
 */
function lcut(text, n) {
    if (text.length < n) {
        return text;
    }
    var segments = text.split(/\b/), count = 0;
    for (var i = segments.length - 1; i >= 0; i--) {
        count += segments[i].length;
        if (count > n) {
            segments.splice(0, i);
            break;
        }
    }
    return segments.join(exports.empty).replace(/^\s/, exports.empty);
}
exports.lcut = lcut;
// Escape codes
// http://en.wikipedia.org/wiki/ANSI_escape_code
var EL = /\x1B\x5B[12]?K/g; // Erase in line
var LF = /\xA/g; // line feed
var COLOR_START = /\x1b\[\d+m/g; // Color
var COLOR_END = /\x1b\[0?m/g; // Color
function removeAnsiEscapeCodes(str) {
    if (str) {
        str = str.replace(EL, '');
        str = str.replace(LF, '\n');
        str = str.replace(COLOR_START, '');
        str = str.replace(COLOR_END, '');
    }
    return str;
}
exports.removeAnsiEscapeCodes = removeAnsiEscapeCodes;
// -- UTF-8 BOM
var __utf8_bom = 65279;
exports.UTF8_BOM_CHARACTER = String.fromCharCode(__utf8_bom);
function startsWithUTF8BOM(str) {
    return (str && str.length > 0 && str.charCodeAt(0) === __utf8_bom);
}
exports.startsWithUTF8BOM = startsWithUTF8BOM;
/**
 * Appends two strings. If the appended result is longer than maxLength,
 * trims the start of the result and replaces it with '...'.
 */
function appendWithLimit(first, second, maxLength) {
    var newLength = first.length + second.length;
    if (newLength > maxLength) {
        first = '...' + first.substr(newLength - maxLength);
    }
    if (second.length > maxLength) {
        first += second.substr(second.length - maxLength);
    }
    else {
        first += second;
    }
    return first;
}
exports.appendWithLimit = appendWithLimit;
function repeat(s, count) {
    var result = '';
    for (var i = 0; i < count; i++) {
        result += s;
    }
    return result;
}
exports.repeat = repeat;
//# sourceMappingURL=strings.js.map