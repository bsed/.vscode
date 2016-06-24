"use strict";
var text_parser_1 = require('./text-parser');
var fs_functions_1 = require('./fs-functions');
var PathCompletionItem_1 = require('./PathCompletionItem');
var PathIntellisense = (function () {
    function PathIntellisense(getChildrenOfPath) {
        this.getChildrenOfPath = getChildrenOfPath;
    }
    PathIntellisense.prototype.provideCompletionItems = function (document, position) {
        var line = document.getText(document.lineAt(position).range);
        var isImport = text_parser_1.isImportOrRequire(line);
        var textWithinString = text_parser_1.getTextWithinString(line, position.character);
        var path = fs_functions_1.getPath(document.fileName, textWithinString);
        if (this.shouldProvide(textWithinString, isImport)) {
            return this.getChildrenOfPath(path).then(function (children) { return children.map(function (child) { return new PathCompletionItem_1.PathCompletionItem(child, isImport); }); });
        }
        else {
            return Promise.resolve([]);
        }
    };
    PathIntellisense.prototype.shouldProvide = function (textWithinString, isImport) {
        if (!textWithinString || textWithinString.length === 0) {
            return false;
        }
        if (isImport && textWithinString[0] !== '.') {
            return false;
        }
        if (textWithinString.slice(-1) !== '/') {
            return false;
        }
        return true;
    };
    return PathIntellisense;
}());
exports.PathIntellisense = PathIntellisense;
//# sourceMappingURL=PathIntellisense.js.map