"use strict";
/** Various string-related functions */
/** Checks whether a line of text contains actual words etc, not just symbols */
function containsActualText(lineText) {
    var text = lineText.trim();
    // This exception needed for Ruby
    return text !== '=begin' && text !== '=end' && /\w/.test(text);
}
exports.containsActualText = containsActualText;
/** Gets the display size of a string prefix, taking in to account the render of
 *  tabs for the editor */
function prefixSize(tabSize, prefix) {
    var size = 0;
    for (var i = 0; i < prefix.length; i++) {
        if (prefix.charAt(i) === '\t') {
            size += tabSize - (size % tabSize);
        }
        else {
            size++;
        }
    }
    return size;
}
exports.prefixSize = prefixSize;
/** Gets the text of a line after the prefix (eg '  //') */
function textAfterPrefix(lineText, prefexRegex, prefixMaxLength) {
    if (prefixMaxLength === void 0) { prefixMaxLength = Number.MAX_VALUE; }
    var prefixLength = lineText.match(prefexRegex)[0].length;
    var textAfter = lineText.substr(Math.min(prefixLength, prefixMaxLength));
    // Allow an extra one-space indent
    if (prefixLength > prefixMaxLength && /^ \S/.test(textAfter)) {
        textAfter = textAfter.substr(1);
    }
    // Also trim end
    return trimInsignificantEnd(textAfter);
}
exports.textAfterPrefix = textAfterPrefix;
/** Trims all whitespace from just the end of the string */
function trimEnd(s) {
    return s.replace(/\s+$/, "");
}
exports.trimEnd = trimEnd;
/** Trims non-significant whitespace from the end of a string. Non-significant
 *  whitespace is defined as:
 *    No more than 1 space, or
 *    Any whitespace if the string is completely whitespace.
 */
function trimInsignificantEnd(s) {
    s = s.replace(/\r$/, "");
    if (/\S {2,}$/.test(s)) {
        return s;
    }
    else {
        return trimEnd(s);
    }
}
exports.trimInsignificantEnd = trimInsignificantEnd;
//# sourceMappingURL=Strings.js.map