"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var baseTestRunner = require("./baseTestRunner");
var PyTestTests = (function (_super) {
    __extends(PyTestTests, _super);
    function PyTestTests(pythonSettings, outputChannel, workspaceRoot) {
        _super.call(this, "pytest", pythonSettings, outputChannel, true, workspaceRoot);
    }
    PyTestTests.prototype.isEnabled = function () {
        return this.pythonSettings.unitTest.pyTestEnabled;
    };
    PyTestTests.prototype.runTests = function () {
        var _this = this;
        if (!this.pythonSettings.unitTest.pyTestEnabled) {
            return Promise.resolve();
        }
        var pyTestPath = this.pythonSettings.unitTest.pyTestPath;
        var pytestArgs = Array.isArray(this.pythonSettings.unitTest.pyTestArgs) ? this.pythonSettings.unitTest.pyTestArgs : [];
        return new Promise(function (resolve) {
            _this.run(pyTestPath, pytestArgs).then(function (messages) {
                resolve(messages);
            });
        });
    };
    return PyTestTests;
}(baseTestRunner.BaseTestRunner));
exports.PyTestTests = PyTestTests;
//# sourceMappingURL=pytest.js.map