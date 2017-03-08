"use strict";
var provider_1 = require('./provider');
var CompleteActionProvider = (function () {
    function CompleteActionProvider() {
    }
    CompleteActionProvider.prototype.provideCodeActions = function (document, range, context, token) {
        return new Promise(function (resolve, reject) {
            // optimizeImports(DefinitionProvider.instance.cachedExports, pickedItem.label);
            var keyword = document.getText(range);
            if (provider_1.DefinitionProvider.instance.containsItem(keyword)) {
                resolve([
                    {
                        arguments: [keyword],
                        command: 'genGetSet.addImport',
                        title: 'Add import for ' + keyword
                    }
                ]);
            }
            else {
                resolve([]);
            }
        });
    };
    return CompleteActionProvider;
}());
exports.CompleteActionProvider = CompleteActionProvider;
//# sourceMappingURL=bulb.js.map