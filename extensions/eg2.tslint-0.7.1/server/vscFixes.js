"use strict";
exports.vscFixes = [];
/**
 * AutoFix rules are all in this file
 * each autoFix should support the interface TsLintAutoFix and added in this.tsLintAutoFixes
 *
 * the key to map tsLint problem and autofix rules is => tsLintMessage
 */
let vscFix;
vscFix = {
    tsLintMessage: "trailing whitespace",
    autoFix: (codeBefore) => {
        let codeAfter = "";
        return codeAfter;
    },
    overrideTSLintFix: false
};
this.vscFixes.push(vscFix);
vscFix = {
    tsLintMessage: "file should end with a newline",
    autoFix: (codeBefore) => {
        let codeAfter = "\n";
        return codeAfter;
    },
    overrideTSLintFix: false
};
this.vscFixes.push(vscFix);
vscFix = {
    tsLintMessage: "Comment must start with a space",
    autoFix: (codeBefore) => {
        let codeAfter = " " + codeBefore;
        return codeAfter;
    },
    overrideTSLintFix: false
};
this.vscFixes.push(vscFix);
//# sourceMappingURL=vscFixes.js.map