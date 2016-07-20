"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var baseTestRunner = require("./baseTestRunner");
var NoseTests = (function (_super) {
    __extends(NoseTests, _super);
    function NoseTests(pythonSettings, outputChannel, workspaceRoot) {
        _super.call(this, "nosetests", pythonSettings, outputChannel, true, workspaceRoot);
    }
    NoseTests.prototype.isEnabled = function () {
        return this.pythonSettings.unitTest.nosetestsEnabled;
    };
    NoseTests.prototype.runTests = function () {
        var _this = this;
        if (!this.pythonSettings.unitTest.nosetestsEnabled) {
            return Promise.resolve();
        }
        var nosetestsPath = this.pythonSettings.unitTest.nosetestPath;
        var nosetestArgs = Array.isArray(this.pythonSettings.unitTest.nosetestArgs) ? this.pythonSettings.unitTest.nosetestArgs : [];
        return new Promise(function (resolve) {
            _this.run(nosetestsPath, nosetestArgs).then(function (messages) {
                resolve(messages);
            });
        });
    };
    return NoseTests;
}(baseTestRunner.BaseTestRunner));
exports.NoseTests = NoseTests;
//# sourceMappingURL=nosetests.js.map