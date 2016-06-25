"use strict";
var vscode_1 = require('vscode');
var PhpDefinitionProvider = (function () {
    function PhpDefinitionProvider(languageClient) {
        this.langClient = languageClient;
    }
    PhpDefinitionProvider.prototype.findSymbol = function (document, position) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Lookup in tree -> get node back
            // Look in file cache for word, return all matches
            // Filter to functions and methods
            // If single match -> find match in tree and return params
            // If muliple match -> determine if on $this, self:: ClassName:: or instance variable
            //                     and filter matches appropriately
            var wordPos = document.getWordRangeAtPosition(position);
            var text = document.getText();
            var lines = text.split(/\r\n|\r|\n/gm);
            var callerName = lines[wordPos.start.line].substr(wordPos.start.character, wordPos.end.character);
            var requestType = { method: "findSymbolInTree" };
            _this.langClient.sendRequest(requestType, { word: callerName, position: position }).then(function (response) {
                var node = response.node;
                resolve(node);
            });
        });
    };
    PhpDefinitionProvider.prototype.provideDefinition = function (document, position, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.findSymbol(document, position).then(function (node) {
                // Check node is null
                // If not null, check if has location
                var location = new vscode_1.Location(null, null);
                Promise.resolve(location);
            });
        });
    };
    PhpDefinitionProvider.prototype.previousTokenPosition = function (document, position) {
        while (position.character > 0) {
            var word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    };
    return PhpDefinitionProvider;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PhpDefinitionProvider;
//# sourceMappingURL=phpDefinitionProvider.js.map