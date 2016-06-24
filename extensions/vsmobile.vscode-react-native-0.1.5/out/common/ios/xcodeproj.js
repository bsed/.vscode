// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var errorHelper_1 = require("../../common/error/errorHelper");
var log_1 = require("../../common/log/log");
var fileSystem_1 = require("../../common/node/fileSystem");
var telemetryHelper_1 = require("../../common/telemetryHelper");
var Xcodeproj = (function () {
    function Xcodeproj(_a) {
        var _b = (_a === void 0 ? {} : _a).nodeFileSystem, nodeFileSystem = _b === void 0 ? new fileSystem_1.FileSystem() : _b;
        this.nodeFileSystem = nodeFileSystem;
    }
    Xcodeproj.prototype.findXcodeprojFile = function (projectRoot) {
        return this.nodeFileSystem
            .findFilesByExtension(projectRoot, "xcodeproj")
            .then(function (projectFiles) {
            if (projectFiles.length > 1) {
                telemetryHelper_1.TelemetryHelper.sendSimpleEvent("multipleXcodeprojFound");
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("More than one xcodeproj found. Using " + projectFiles[0]));
            }
            return projectFiles[0];
        });
    };
    return Xcodeproj;
}());
exports.Xcodeproj = Xcodeproj;

//# sourceMappingURL=xcodeproj.js.map
