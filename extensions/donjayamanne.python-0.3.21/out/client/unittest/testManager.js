"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var contracts_1 = require('./contracts');
var pytestUtils_1 = require('./pytestUtils');
var vscode = require('vscode');
var events_1 = require('events');
var utils_1 = require('./../common/utils');
var helpers_1 = require('../common/helpers');
var path = require('path');
var TestManager = (function (_super) {
    __extends(TestManager, _super);
    function TestManager(rootDirectory, testDirectory) {
        if (rootDirectory === void 0) { rootDirectory = vscode.workspace.rootPath; }
        if (testDirectory === void 0) { testDirectory = vscode.workspace.rootPath; }
        _super.call(this);
        this.rootDirectory = rootDirectory;
        this.testDirectory = testDirectory;
        this._status = contracts_1.TestStatus.Unknown;
        this._runningTestsCounter = 0;
    }
    Object.defineProperty(TestManager.prototype, "status", {
        get: function () {
            return this._status;
        },
        enumerable: true,
        configurable: true
    });
    TestManager.prototype.reset = function () {
        this._status = contracts_1.TestStatus.Unknown;
        this.tests = null;
        this.lastError = null;
    };
    Object.defineProperty(TestManager.prototype, "testsAreRunning", {
        get: function () {
            return this._runningTestsCounter > 0;
        },
        enumerable: true,
        configurable: true
    });
    TestManager.prototype.updateStatus = function () {
        if (this.testsAreRunning) {
            this._status = contracts_1.TestStatus.Running;
            return;
        }
        if (this.lastError) {
            this._status = contracts_1.TestStatus.Error;
            return;
        }
        if (this.tests) {
            this._status = contracts_1.TestStatus.Idle;
            return;
        }
    };
    TestManager.prototype.getTestFiles = function () {
        var _this = this;
        if (this.tests) {
            return Promise.resolve(this.tests.testFiles);
        }
        if (this.lastError) {
            return Promise.reject(this.lastError);
        }
        this._status = contracts_1.TestStatus.Discovering;
        return pytestUtils_1.discoverTests(this.rootDirectory, this.testDirectory)
            .then(function (tests) {
            _this.tests = tests;
            _this.lastError = null;
            _this.updateStatus();
            return tests.testFiles;
        }).catch(function (reason) {
            _this.tests = null;
            _this.lastError = reason;
            _this.updateStatus();
            return Promise.reject(reason);
        });
    };
    TestManager.prototype.runTest = function (testFile, testSuite, testFunction) {
        var _this = this;
        this._runningTestsCounter += 1;
        this.updateStatus();
        return runTest(this.rootDirectory, this.testDirectory, this.tests, testFile, testSuite, testFunction)
            .then(function () {
            _this.tests.testFiles;
            _this._runningTestsCounter -= 1;
            _this.updateStatus();
            return _this.tests.testFiles;
        }).catch(function (reason) {
            _this._runningTestsCounter -= 1;
            _this.updateStatus();
            return Promise.reject(reason);
        });
    };
    return TestManager;
}(events_1.EventEmitter));
exports.TestManager = TestManager;
function runTest(rootDirectory, testDirectory, tests, testFile, testSuite, testFunction) {
    var testPath = '';
    if (testFile) {
        testPath = testFile.rawName;
    }
    if (testSuite) {
        testPath = testSuite.rawName;
    }
    if (testFunction) {
        testPath = testFunction.rawName;
    }
    if (testPath.length === 0) {
        testPath = testDirectory;
    }
    else {
        // Remove the ():: from the name
        testPath = testDirectory + path.sep + testPath.replace(/\(\)::/g, '');
    }
    var xmlLogFile = '';
    var xmlLogFileCleanup = null;
    var rawLogFile = '';
    var rawLogFileCleanup = null;
    return helpers_1.createTemporaryFile('.xml').then(function (xmlLogResult) {
        xmlLogFile = xmlLogResult.filePath;
        xmlLogFileCleanup = xmlLogResult.cleanupCallback;
        return helpers_1.createTemporaryFile('.log');
    }).then(function (rawLowResult) {
        rawLogFile = rawLowResult.filePath;
        rawLogFileCleanup = rawLowResult.cleanupCallback;
        // return execPythonFile('py.test', [testPath, `--junitxml="${xmlLogFile}"`, `--resultlog=${rawLogFile}`], rootDirectory);
        return utils_1.execPythonFile('py.test', [testPath, ("--junitxml=" + xmlLogFile), ("--resultlog=" + rawLogFile)], rootDirectory);
        // return execPythonFile('py.test', [testPath, `--junitxml=${xmlLogFile}`], rootDirectory);
    }).then(function () {
        return pytestUtils_1.updateResultsFromLogFiles(tests, xmlLogFile, rawLogFile);
    }).then(function (result) {
        xmlLogFileCleanup();
        rawLogFileCleanup();
        return result;
    }).catch(function (reason) {
        xmlLogFileCleanup();
        rawLogFileCleanup();
        return Promise.reject(reason);
    });
}
//# sourceMappingURL=testManager.js.map