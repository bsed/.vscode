"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DocumentProcessor_1 = require('./DocumentProcessor');
var Section_1 = require('./Section');
var BasicLanguage = (function (_super) {
    __extends(BasicLanguage, _super);
    function BasicLanguage(commentMarkers) {
        _super.call(this);
        this.commentMarkers = commentMarkers;
    }
    BasicLanguage.prototype.findSections = function (doc) {
        var ws = '[ \\t]*', leadingWS = '^' + ws, _a = this.commentMarkers, start = _a.start, end = _a.end, line = _a.line, startOrLine = [start, line].filter(function (s) { return !!s; }).join('|'), plainPattern = leadingWS + '(?!' + startOrLine + ')\\S[^]*?' +
            '(?=\\n' + leadingWS + '(' + startOrLine + '|$))', multiLinePattern = start && end &&
            leadingWS + start + '[^]+?' + end, singleLinePattern = line &&
            leadingWS + line + '[^]+?$(?!\\r?\\n' + leadingWS + line + ')', combinedPattern = [plainPattern, multiLinePattern, singleLinePattern]
            .filter(function (p) { return !!p; })
            .join('|'), combinedRegex = new RegExp(combinedPattern, 'mg');
        var multiLinePrefixRegex = start && new RegExp(leadingWS + start), linePrefixRegex = line && new RegExp(leadingWS + line);
        var primarySections = [], secondarySections = [], text = doc.getText() + '\n';
        var match;
        while (match = combinedRegex.exec(text)) {
            var sectionText = match[0], startAt = doc.positionAt(match.index).line, endAt = doc.positionAt(match.index + sectionText.length).line;
            if (multiLinePrefixRegex && sectionText.match(multiLinePrefixRegex)) {
                primarySections.push(new Section_1.default(doc, startAt, endAt, /^[ \t]*[#*]?[ \t]*/, selectLinePrefixMaker(sectionText), new RegExp('^[ \\t]*' + start + '[ \\t]*')));
            }
            else if (linePrefixRegex && sectionText.match(linePrefixRegex)) {
                primarySections.push(new Section_1.default(doc, startAt, endAt, new RegExp(leadingWS + line + ws)));
            }
            else {
                secondarySections.push(new Section_1.default(doc, startAt, endAt));
            }
        }
        return { primary: primarySections, secondary: secondarySections };
    };
    /** Edits the comment to rewrap the selected lines. If no edit needs doing, return null */
    BasicLanguage.prototype.editSection = function (wrappingColumn, tabSize, _a) {
        var section = _a.section, selection = _a.selection;
        var edit = _super.prototype.editSection.call(this, wrappingColumn, tabSize, { section: section, selection: selection });
        // Final tweak for jsdoc/coffeedoc comments: ignore the last line
        if (edit.lines.length > 1) {
            var lastLine = edit.lines[edit.lines.length - 1].trim();
            if (lastLine.match(/^\*\s+\//) || lastLine.match(/^[#\*]\s+##/)) {
                edit.endLine--;
                edit.lines.pop();
            }
        }
        return edit;
    };
    return BasicLanguage;
}(DocumentProcessor_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BasicLanguage;
/** Gets a line prefix maker function for multiline comments. Handles the
 *  special cases of javadoc and coffeedoc */
function selectLinePrefixMaker(sectionText) {
    var trimmedText = sectionText.trim();
    if (trimmedText.startsWith('/**') || trimmedText.startsWith('###*')) {
        return (function (flp) { return flp.replace(/\S+/, ' * '); });
    }
    else {
        return (function (fpl) { return fpl.match(/^[ \t]*/)[0]; });
    }
}
//# sourceMappingURL=BasicLanguage.js.map