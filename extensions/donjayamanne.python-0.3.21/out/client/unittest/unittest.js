"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var baseTestRunner = require("./baseTestRunner");
var PythonUnitTest = (function (_super) {
    __extends(PythonUnitTest, _super);
    function PythonUnitTest(pythonSettings, outputChannel, workspaceRoot) {
        _super.call(this, "unittest", pythonSettings, outputChannel, true, workspaceRoot);
    }
    PythonUnitTest.prototype.isEnabled = function () {
        return this.pythonSettings.unitTest.unittestEnabled;
    };
    PythonUnitTest.prototype.runTests = function () {
        var _this = this;
        if (!this.pythonSettings.unitTest.unittestEnabled) {
            return Promise.resolve();
        }
        var ptyhonPath = this.pythonSettings.pythonPath;
        var pythonUnitTestArgs = Array.isArray(this.pythonSettings.unitTest.unittestArgs) ? this.pythonSettings.unitTest.unittestArgs : [];
        return new Promise(function (resolve) {
            _this.run(ptyhonPath, ["-m", "unittest"].concat(pythonUnitTestArgs.concat(["discover"]))).then(function (messages) {
                resolve(messages);
            });
        });
    };
    return PythonUnitTest;
}(baseTestRunner.BaseTestRunner));
exports.PythonUnitTest = PythonUnitTest;
//# sourceMappingURL=unittest.js.map