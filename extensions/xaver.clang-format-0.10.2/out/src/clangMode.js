'use strict';
var vscode = require('vscode');
var languages = [];
for (var _i = 0, _a = ["cpp", "c", "objective-c", "java", "javascript", "typescript", "proto"]; _i < _a.length; _i++) {
    var l = _a[_i];
    if (vscode.workspace.getConfiguration("clang-format").get("language." + l + ".enable")) {
        languages.push(l);
    }
}
exports.MODES = languages.map(function (language) { return ({ language: language, scheme: 'file' }); });
//# sourceMappingURL=clangMode.js.map