"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var wrap = require('greedy-wrap');
var Strings_1 = require('./Strings');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports;
/** The main function that takes text and wraps it. */
function wrapLinesDetectingTypes(wrappingWidth, lines) {
    return (lines
        .map(function (text) { return ({ text: text, type: lineType(text) }); })
        .apply(groupLinesWithTypes)
        .flatMap(function (_a) {
        var text = _a.text, wrap = _a.wrap;
        return wrap ? wrapText(wrappingWidth, text) : [text];
    }));
}
exports.wrapLinesDetectingTypes = wrapLinesDetectingTypes;
/** Gets the LineType of a line */
function lineType(text) {
    if (
    // No text on line
    !Strings_1.containsActualText(text) ||
        // After implementing trimInsignificantStart, make this 2 spaces
        // Don't forget ^ priority
        /^[ \t]/.test(text) ||
        // Whole line is a single xml tag
        /^<[^!][^>]*>$/.test(text)) {
        return new LineType.NoWrap();
    }
    else {
        var breakBefore = false, breakAfter = false;
        // Start and end xml tag on same line
        if (/^<[^>]+>[^<]*<\/[^>+]>$/.test(text)) {
            _a = [true, true], breakBefore = _a[0], breakAfter = _a[1];
        }
        else {
            // Starts with xml or @ tag
            if (/^[@<]/.test(text))
                breakBefore = true;
            // Ends with (at least) 2 spaces
            if (/  $/.test(text))
                breakAfter = true;
        }
        return new LineType.Wrap(breakBefore, breakAfter);
    }
    var _a;
}
exports.lineType = lineType;
function wrapText(wrappingWidth, text) {
    return (wrap(text, { width: wrappingWidth })
        .split('\n')
        .map(Strings_1.trimInsignificantEnd) // trim off extra whitespace left by greedy-wrap
    );
}
exports.wrapText = wrapText;
/** Groups lines with the same LineType, to be wrapped together */
function groupLinesWithTypes(lines) {
    var groups = [];
    while (lines.length > 0) {
        var i = 0;
        for (; i < lines.length; i++) {
            var type = lines[i].type;
            if (type.breakBefore && i > 0) {
                break;
            }
            else if (type.breakAfter) {
                i = i + 1;
                break;
            }
        }
        // lines becomes the tail
        var doWrap = lines[i - 1].type instanceof LineType.Wrap, sectionLines = lines.splice(0, i).map(function (_a) {
            var text = _a.text;
            return text;
        }), group = { text: sectionLines.join(' '), wrap: doWrap };
        groups.push(group);
    }
    return groups;
}
/** Types that represent how individual lines within a comment or paragraph
 *  should be handled */
var LineType = (function () {
    function LineType() {
    }
    Object.defineProperty(LineType.prototype, "breakBefore", {
        /** The line requires a line break before it */
        get: function () {
            return this._breakBefore;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LineType.prototype, "breakAfter", {
        /** The line requires a line break after it */
        get: function () {
            return this._breakAfter;
        },
        enumerable: true,
        configurable: true
    });
    /** Represents a line that should be wrapped */
    LineType.Wrap = (function (_super) {
        __extends(class_1, _super);
        function class_1(breakBefore, breakAfter) {
            _super.call(this);
            this._breakBefore = breakBefore;
            this._breakAfter = breakAfter;
        }
        return class_1;
    }(LineType));
    /** Represents a line that sould not be wrapped */
    LineType.NoWrap = (function (_super) {
        __extends(class_2, _super);
        function class_2() {
            _super.call(this);
            this._breakBefore = true;
            this._breakAfter = true;
        }
        return class_2;
    }(LineType));
    return LineType;
}());
exports.LineType = LineType;
//# sourceMappingURL=Wrapping.js.map