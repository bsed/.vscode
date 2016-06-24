"use strict";
exports.tsLintAutoFixes = [];
/**
 * AutoFix rules are all in this file
 * each autoFix should support the interface TsLintAutoFix and added in this.tsLintAutoFixes
 *
 * the key to map tsLint problem and autofix rules is => tsLintMessage
 */
var autoFix;
autoFix = {
    tsLintCode: "one-line",
    tsLintMessage: "missing whitespace",
    autoFixMessage: "Add a whitespace",
    autoFix: function (codeBefore) {
        var codeAfter = " " + codeBefore;
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "one-line",
    tsLintMessage: "missing semicolon",
    autoFixMessage: "Add semicolon",
    autoFix: function (codeBefore) {
        var codeAfter = codeBefore + ";";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "quotemark",
    tsLintMessage: "' should be \"",
    autoFixMessage: "Replace ' by \" ",
    autoFix: function (codeBefore) {
        var codeAfter = "\"" + codeBefore.slice(1, codeBefore.length - 1) + "\"";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "quotemark",
    tsLintMessage: "\" should be '",
    autoFixMessage: "Replace \" by ' ",
    autoFix: function (codeBefore) {
        var codeAfter = "'" + codeBefore.slice(1, codeBefore.length - 1) + "'";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "no-trailing-whitespace",
    tsLintMessage: "trailing whitespace",
    autoFixMessage: "Trim whitespace",
    autoFix: function (codeBefore) {
        var codeAfter = "";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "indent",
    tsLintMessage: "tab indentation expected",
    autoFixMessage: "Replace 4 spaces by 1 tab",
    autoFix: function (codeBefore) {
        var codeAfter = "	";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "indent",
    tsLintMessage: "space indentation expected",
    autoFixMessage: "Replace 1 tab by 4 spaces",
    autoFix: function (codeBefore) {
        var codeAfter = "    ";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
autoFix = {
    tsLintCode: "eofline",
    tsLintMessage: "file should end with a newline",
    autoFixMessage: "add new line",
    autoFix: function (codeBefore) {
        var codeAfter = "\n";
        return codeAfter;
    }
};
this.tsLintAutoFixes.push(autoFix);
//# sourceMappingURL=tslintAutoFix.js.map