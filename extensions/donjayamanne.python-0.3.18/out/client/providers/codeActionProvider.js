'use strict';
var PythonCodeActionsProvider = (function () {
    function PythonCodeActionsProvider(context) {
    }
    PythonCodeActionsProvider.prototype.provideCodeActions = function (document, range, context, token) {
        return new Promise(function (resolve, reject) {
            var commands = [
                {
                    command: 'python.sortImports',
                    title: 'Sort Imports'
                },
                {
                    command: 'python.runtests',
                    title: 'Run Tests'
                }
            ];
            resolve(commands);
        });
    };
    return PythonCodeActionsProvider;
}());
exports.PythonCodeActionsProvider = PythonCodeActionsProvider;
//# sourceMappingURL=codeActionProvider.js.map