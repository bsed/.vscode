"use strict";
var Strings_1 = require('./Strings');
var Wrapping_1 = require('./Wrapping');
/** Base class for different sorts of document handlers */
var DocumentProcessor = (function () {
    function DocumentProcessor() {
    }
    DocumentProcessor.prototype.editSection = function (wrappingColumn, tabSize, sectionToEdit) {
        var section = sectionToEdit.section, selection = sectionToEdit.selection, wrappingWidth = wrappingColumn - Strings_1.prefixSize(tabSize, section.linePrefix);
        var lines = linesToWrap(section, selection)
            .map(Strings_1.trimInsignificantEnd)
            .apply(function (ls) { return Wrapping_1.wrapLinesDetectingTypes(wrappingWidth, ls); })
            .map(function (line, i) {
            var prefix = selection.start.line + i === section.startAt
                ? section.firstLinePrefix
                : section.linePrefix;
            // If the line is empty then trim all trailing ws from the prefix
            return (line ? prefix : Strings_1.trimEnd(prefix)) + line;
        });
        return {
            startLine: selection.start.line,
            endLine: selection.end.line,
            lines: lines,
        };
    };
    return DocumentProcessor;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DocumentProcessor;
/** Gets the lines that need wrapping, given a section and selection range */
function linesToWrap(section, selection) {
    return section.lines
        .filter(function (line, i) {
        var row = section.startAt + i;
        return row >= selection.start.line && row <= selection.end.line;
    });
}
//# sourceMappingURL=DocumentProcessor.js.map