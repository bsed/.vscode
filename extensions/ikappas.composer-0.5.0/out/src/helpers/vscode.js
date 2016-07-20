/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require("vscode");
var constants_1 = require("./constants");
var BaseQuickPickItem = (function () {
    function BaseQuickPickItem() {
    }
    return BaseQuickPickItem;
}());
exports.BaseQuickPickItem = BaseQuickPickItem;
var WorkItemQueryQuickPickItem = (function (_super) {
    __extends(WorkItemQueryQuickPickItem, _super);
    function WorkItemQueryQuickPickItem() {
        _super.apply(this, arguments);
    }
    return WorkItemQueryQuickPickItem;
}(BaseQuickPickItem));
exports.WorkItemQueryQuickPickItem = WorkItemQueryQuickPickItem;
var VsCodeUtils = (function () {
    function VsCodeUtils() {
    }
    VsCodeUtils.ShowErrorMessage = function (message) {
        vscode_1.window.showErrorMessage("(" + constants_1.Constants.ExtensionName + ") " + message);
    };
    VsCodeUtils.ShowWarningMessage = function (message) {
        vscode_1.window.showWarningMessage("(" + constants_1.Constants.ExtensionName + ") " + message);
    };
    return VsCodeUtils;
}());
exports.VsCodeUtils = VsCodeUtils;
//# sourceMappingURL=vscode.js.map