"use strict";
var vscode_1 = require('vscode');
var Strings_1 = require('./Strings');
var Section = (function () {
    function Section(document, startAt, endAt, lineRegex, defaultLinePrefix, firstLineRegex) {
        if (lineRegex === void 0) { lineRegex = /^[ \t]*/; }
        if (defaultLinePrefix === void 0) { defaultLinePrefix = function (flp) { return flp; }; }
        if (firstLineRegex === void 0) { firstLineRegex = lineRegex; }
        this.document = document;
        this.startAt = startAt;
        this.endAt = endAt;
        var rawLines = Array.range(startAt, endAt + 1).map(function (i) { return document.lineAt(i).text; });
        var linePrefix, firstLinePrefix;
        // Get firstLinePrefix from first line
        firstLinePrefix = rawLines[0].match(firstLineRegex)[0];
        // Get linePrefix from the first line after that that has text
        var firstMiddleLineWithText = rawLines.slice(1).find(Strings_1.containsActualText);
        if (firstMiddleLineWithText) {
            linePrefix = firstMiddleLineWithText.match(lineRegex)[0];
        }
        else {
            linePrefix = defaultLinePrefix(firstLinePrefix);
        }
        if (linePrefix.length < firstLinePrefix.length
            || Strings_1.containsActualText(rawLines[0])) {
            var prefixLength = Math.min(linePrefix.length, firstLinePrefix.length);
            linePrefix = linePrefix.substr(0, prefixLength);
            firstLinePrefix = firstLinePrefix.substr(0, prefixLength);
        }
        this.lines =
            rawLines
                .map(function (line, i) {
                return i === 0
                    ? line.substr(linePrefix.length)
                    : Strings_1.textAfterPrefix(line, lineRegex, linePrefix.length);
            });
        this.linePrefix = linePrefix;
        this.firstLinePrefix = firstLinePrefix;
    }
    Section.sectionsInSelections = sectionsInSelections;
    return Section;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Section;
/** Gets all the sections that are touched by the given selections */
function sectionsInSelections(primarySections, secondarySections, selections) {
    return selections
        .flatMap(function (sel) {
        var priSectionsInSelection = sectionsInSelection(sel, primarySections);
        if (priSectionsInSelection.length)
            return priSectionsInSelection;
        var secSectionsInSelection = sectionsInSelection(sel, secondarySections);
        if (secSectionsInSelection.length)
            return secSectionsInSelection;
        return [];
    });
}
/** Gets all the sections that are touched by the given selection */
function sectionsInSelection(selection, sections) {
    return sections
        .map(function (s) { return sectionAndSelectionIntersection(selection, s); })
        .filter(function (ss) { return !!ss; });
}
/** Gets the intersection of a section and selection */
function sectionAndSelectionIntersection(selection, section) {
    var intersection = {
        start: Math.max(section.startAt, selection.start.line),
        end: Math.min(section.endAt, selection.end.line),
    };
    if (intersection.start <= intersection.end) {
        var range = selection.isEmpty
            ? new vscode_1.Range(section.startAt, 0, section.endAt, Number.MAX_VALUE)
            : new vscode_1.Range(intersection.start, 0, intersection.end, Number.MAX_VALUE);
        return { section: section, selection: range };
    }
    else
        return null;
}
//# sourceMappingURL=Section.js.map