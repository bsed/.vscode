// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var semver = require("semver");
var package_1 = require("./node/package");
var ReactNativeProjectHelper = (function () {
    function ReactNativeProjectHelper(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Ensures that we are in a React Native project and then executes the operation
     * Otherwise, displays an error message banner
     * {operation} - a function that performs the expected operation
     */
    ReactNativeProjectHelper.prototype.isReactNativeProject = function () {
        var currentPackage = new package_1.Package(this.workspaceRoot);
        return currentPackage.dependencies().then(function (dependencies) {
            return !!(dependencies && dependencies["react-native"]);
        }).catch(function (err) {
            return Q.resolve(false);
        });
    };
    ReactNativeProjectHelper.prototype.validateReactNativeVersion = function () {
        return new package_1.Package(this.workspaceRoot).dependencyPackage(ReactNativeProjectHelper.REACT_NATIVE_NPM_LIB_NAME).version()
            .then(function (version) {
            if (semver.gte(version, "0.19.0")) {
                return Q.resolve(void 0);
            }
            else {
                return Q.reject(new RangeError("Project version = " + version));
            }
        });
    };
    ReactNativeProjectHelper.REACT_NATIVE_NPM_LIB_NAME = "react-native";
    return ReactNativeProjectHelper;
}());
exports.ReactNativeProjectHelper = ReactNativeProjectHelper;

//# sourceMappingURL=reactNativeProjectHelper.js.map
