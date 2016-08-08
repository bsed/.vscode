"use strict";
var vscode = require("vscode");
var unittest = require("./../unittest/unittest");
var nosetest = require("./../unittest/nosetests");
var pytest = require("./../unittest/pytest");
var telemetryHelper = require("../common/telemetry");
var telemetryContracts = require("../common/telemetryContracts");
var pythonOutputChannel;
var testProviders = [];
function activateUnitTestProvider(context, settings, outputChannel) {
    pythonOutputChannel = outputChannel;
    vscode.commands.registerCommand("python.runtests", function () { return runUnitTests(); });
    testProviders.push(new unittest.PythonUnitTest(settings, outputChannel, vscode.workspace.rootPath));
    testProviders.push(new nosetest.NoseTests(settings, outputChannel, vscode.workspace.rootPath));
    testProviders.push(new pytest.PyTestTests(settings, outputChannel, vscode.workspace.rootPath));
}
exports.activateUnitTestProvider = activateUnitTestProvider;
function runUnitTests() {
    pythonOutputChannel.clear();
    var promises = testProviders.map(function (t) {
        if (!t.isEnabled()) {
            return Promise.resolve();
        }
        var delays = new telemetryHelper.Delays();
        t.runTests().then(function () {
            delays.stop();
            telemetryHelper.sendTelemetryEvent(telemetryContracts.Commands.UnitTests, { UnitTest_Provider: t.Id }, delays.toMeasures());
        });
    });
    Promise.all(promises).then(function () {
        pythonOutputChannel.show();
    });
}
//# sourceMappingURL=testProvider.js.map