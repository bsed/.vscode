"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DocumentProcessor_1 = require('./DocumentProcessor');
var Section_1 = require('./Section');
/** Processor for xml & html files */
var Sgml = (function (_super) {
    __extends(Sgml, _super);
    function Sgml() {
        _super.apply(this, arguments);
    }
    Sgml.prototype.findSections = function (doc) {
        var InComment = (function () {
            function InComment(start) {
                this.start = start;
            }
            return InComment;
        }());
        var InParagraph = (function () {
            function InParagraph(start, indent) {
                this.start = start;
                this.indent = indent;
            }
            return InParagraph;
        }());
        var InWhitespace = (function () {
            function InWhitespace() {
            }
            return InWhitespace;
        }());
        var state = new InWhitespace(), row;
        var sections = [];
        for (row = 0; row < doc.lineCount; row++) {
            var line = doc.lineAt(row), lineIndent = line.firstNonWhitespaceCharacterIndex;
            var stateCopy = state; // This is needed for the TS type guards
            if (stateCopy instanceof InWhitespace) {
                if (line.text.match(/^[ \t]*<!--/)) {
                    state = new InComment(row);
                }
                else if (!line.isEmptyOrWhitespace) {
                    state = new InParagraph(row, lineIndent);
                }
            }
            else if (stateCopy instanceof InParagraph) {
                if (line.text.match(/^[ \t]*<!--/)) {
                    sections.push(new Section_1.default(doc, stateCopy.start, row - 1));
                    state = new InComment(row);
                }
                else if (line.isEmptyOrWhitespace) {
                    sections.push(new Section_1.default(doc, stateCopy.start, row - 1));
                    state = new InWhitespace();
                }
                else if (Math.abs(stateCopy.indent - lineIndent) >= 2) {
                    sections.push(new Section_1.default(doc, stateCopy.start, row - 1));
                    state = new InParagraph(row, lineIndent);
                }
            }
            stateCopy = state;
            if (stateCopy instanceof InComment) {
                if (line.text.match(/-->/)) {
                    sections.push(new Section_1.default(doc, stateCopy.start, row, /^[ \t]*/, function (flp) { return flp.match(/^[ \t]*/)[0]; }, /^[ \t]*<!--[ \t]*/));
                    state = new InWhitespace();
                }
            }
        }
        if (state instanceof InParagraph) {
            sections.push(new Section_1.default(doc, state.start, row - 1));
        }
        return { primary: sections, secondary: [] };
    };
    return Sgml;
}(DocumentProcessor_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sgml;
//# sourceMappingURL=Sgml.js.map