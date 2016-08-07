"use strict";
var utils_1 = require("./../common/utils");
var BaseTestRunner = (function () {
    function BaseTestRunner(id, pythonSettings, outputChannel, includeErrorAsResponse, workspaceRootPath) {
        if (includeErrorAsResponse === void 0) { includeErrorAsResponse = false; }
        this.workspaceRootPath = workspaceRootPath;
        this.Id = id;
        this.pythonSettings = pythonSettings;
        this.outputChannel = outputChannel;
        this.includeErrorAsResponse = includeErrorAsResponse;
    }
    BaseTestRunner.prototype.runTests = function () {
        return Promise.resolve();
    };
    BaseTestRunner.prototype.run = function (command, args) {
        var _this = this;
        var outputChannel = this.outputChannel;
        var linterId = this.Id;
        return new Promise(function (resolve, reject) {
            utils_1.execPythonFile(command, args, _this.workspaceRootPath, _this.includeErrorAsResponse).then(function (data) {
                outputChannel.append(data);
                outputChannel.show();
            }, function (error) {
                outputChannel.append(error);
                outputChannel.show();
            });
        });
    };
    return BaseTestRunner;
}());
exports.BaseTestRunner = BaseTestRunner;
//# sourceMappingURL=baseTestRunner.js.map