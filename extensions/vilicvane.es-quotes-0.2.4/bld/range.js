var vscode_1 = require('vscode');
var RangeBuilder = (function () {
    function RangeBuilder(source) {
        var regex = /(.*)(\r?\n|$)/g;
        var indexRanges = [];
        while (true) {
            var groups = regex.exec(source);
            var lineText = groups[1];
            var lineEnding = groups[2];
            var lastIndex = regex.lastIndex - lineEnding.length;
            indexRanges.push({
                start: lastIndex - lineText.length,
                end: lastIndex
            });
            if (!lineEnding.length) {
                break;
            }
        }
        this.indexRanges = indexRanges;
    }
    RangeBuilder.prototype.getPosition = function (index) {
        var indexRanges = this.indexRanges;
        for (var i = 0; i < indexRanges.length; i++) {
            var indexRange = indexRanges[i];
            if (indexRange.end >= index) {
                if (indexRange.start <= index) {
                    // Within range.
                    return new vscode_1.Position(i, index - indexRange.start);
                }
                else {
                    // End of line?
                    var previousIndexRange = indexRanges[i - 1];
                    return new vscode_1.Position(i, previousIndexRange.end - previousIndexRange.start + 1);
                }
            }
        }
    };
    RangeBuilder.prototype.getRange = function (startIndex, endIndex) {
        var start = this.getPosition(startIndex);
        var end = this.getPosition(endIndex);
        return new vscode_1.Range(start, end);
    };
    return RangeBuilder;
})();
exports.RangeBuilder = RangeBuilder;
//# sourceMappingURL=range.js.map