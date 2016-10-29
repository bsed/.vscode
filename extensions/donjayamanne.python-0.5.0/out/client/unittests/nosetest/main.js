'use strict';
const configSettings_1 = require('../../common/configSettings');
const collector_1 = require('./collector');
const baseTestManager_1 = require('../common/baseTestManager');
const runner_1 = require('./runner');
const settings = configSettings_1.PythonSettings.getInstance();
class TestManager extends baseTestManager_1.BaseTestManager {
    constructor(rootDirectory, outputChannel) {
        super('nosetest', rootDirectory, outputChannel);
    }
    discoverTestsImpl(ignoreCache) {
        let args = settings.unitTest.pyTestArgs.slice(0);
        return collector_1.discoverTests(this.rootDirectory, args, this.cancellationToken);
    }
    runTestImpl(tests, testsToRun, runFailedTests) {
        let args = settings.unitTest.pyTestArgs.slice(0);
        if (runFailedTests === true && args.indexOf('--failed') === -1) {
            args.push('--failed');
        }
        return runner_1.runTest(this.rootDirectory, tests, args, testsToRun, this.cancellationToken, this.outputChannel);
    }
}
exports.TestManager = TestManager;
//# sourceMappingURL=main.js.map