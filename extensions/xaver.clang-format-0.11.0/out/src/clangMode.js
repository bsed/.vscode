'use strict';
const vscode = require('vscode');
let languages = [];
for (var l of ["cpp", "c", "objective-c", "java", "javascript", "typescript", "proto"]) {
    if (vscode.workspace.getConfiguration("clang-format").get("language." + l + ".enable")) {
        languages.push(l);
    }
}
exports.MODES = languages.map(language => ({ language, scheme: 'file' }));
//# sourceMappingURL=clangMode.js.map