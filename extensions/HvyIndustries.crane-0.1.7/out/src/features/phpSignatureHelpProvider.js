"use strict";
var vscode_1 = require('vscode');
var PhpSignatureHelpProvider = (function () {
    function PhpSignatureHelpProvider(languageClient) {
        this.langClient = languageClient;
    }
    PhpSignatureHelpProvider.prototype.provideSignatureHelp = function (document, position, token) {
        var theCall = this.walkBackwardsToBeginningOfCall(document, position);
        if (theCall == null) {
            return Promise.resolve(null);
        }
        var callerStartPosition = this.previousTokenPosition(document, theCall.openParen);
        if (callerStartPosition == null) {
            return Promise.resolve(null);
        }
        // TODO -- Lookup in tree
        // TODO -- Add cache to each filenode:
        //           / class/interface/trait names
        //           / class properties/methods/consts (with the parent classname)
        //           / top level functions and variables
        // Look in file cache for word, return all matches
        // Filter to functions and methods
        // If single match -> find match in tree and return params
        // If muliple match -> determine if on $this, self:: ClassName:: or instance variable
        //                     and filter matches appropriately
        var wordPos = document.getWordRangeAtPosition(callerStartPosition);
        var text = document.getText();
        var lines = text.split(/\r\n|\r|\n/gm);
        var caller = lines[wordPos.start.line].substr(wordPos.start.character, wordPos.end.character);
        var requestType = { method: "findSymbolInTree" };
        this.langClient.sendRequest(requestType, caller).then(function (response) {
            var matches = response.matches;
            var types = response.types;
            if (types.length == 0)
                return void 0;
            if (types.length == 1) {
            }
            else {
            }
        });
        // return definitionLocation(document, callerPos).then(res => {
        //     if (!res) {
        //         // The definition was not found
        //         return null;
        //     }
        //     if (res.line === callerPos.line) {
        //         // This must be a function definition
        //         return null;
        //     }
        //     let result = new SignatureHelp();
        //     let text = res.lines[1];
        //     let nameEnd = text.indexOf(' ');
        //     let sigStart = nameEnd + 5; // ' func'
        //     let funcName = text.substring(0, nameEnd);
        //     let sig = text.substring(sigStart);
        //     let si = new SignatureInformation(funcName + sig, res.doc);
        //     si.parameters = parameters(sig).map(paramText =>
        //         new ParameterInformation(paramText)
        //     );
        //     result.signatures = [si];
        //     result.activeSignature = 0;
        //     result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
        //     return result;
        // });
        Promise.resolve();
    };
    PhpSignatureHelpProvider.prototype.previousTokenPosition = function (document, position) {
        while (position.character > 0) {
            var word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    };
    PhpSignatureHelpProvider.prototype.walkBackwardsToBeginningOfCall = function (document, position) {
        var currentLine = document.lineAt(position.line).text.substring(0, position.character);
        var parenBalance = 0;
        var commas = [];
        for (var char = position.character; char >= 0; char--) {
            switch (currentLine[char]) {
                case '(':
                    parenBalance--;
                    if (parenBalance < 0) {
                        return {
                            openParen: new vscode_1.Position(position.line, char),
                            commas: commas
                        };
                    }
                    break;
                case ')':
                    parenBalance++;
                    break;
                case ',':
                    if (parenBalance === 0) {
                        commas.push(new vscode_1.Position(position.line, char));
                    }
            }
        }
        return null;
    };
    return PhpSignatureHelpProvider;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PhpSignatureHelpProvider;
//# sourceMappingURL=phpSignatureHelpProvider.js.map