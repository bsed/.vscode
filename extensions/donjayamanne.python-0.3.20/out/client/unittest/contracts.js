"use strict";
(function (TestStatus) {
    TestStatus[TestStatus["Unknown"] = 0] = "Unknown";
    TestStatus[TestStatus["Discovering"] = 1] = "Discovering";
    TestStatus[TestStatus["Idle"] = 2] = "Idle";
    TestStatus[TestStatus["Running"] = 3] = "Running";
    TestStatus[TestStatus["Error"] = 4] = "Error";
})(exports.TestStatus || (exports.TestStatus = {}));
var TestStatus = exports.TestStatus;
//# sourceMappingURL=contracts.js.map