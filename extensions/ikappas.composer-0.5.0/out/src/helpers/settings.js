/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require("vscode");
var constants_1 = require("./constants");
var BaseSettings = (function () {
    function BaseSettings() {
    }
    BaseSettings.prototype.readSetting = function (name, defaultValue) {
        var configuration = vscode_1.workspace.getConfiguration();
        var value = configuration.get(name, undefined);
        // If user specified a value, use it
        if (value !== undefined && value !== null) {
            return value;
        }
        return defaultValue;
    };
    return BaseSettings;
}());
var Settings = (function (_super) {
    __extends(Settings, _super);
    function Settings() {
        _super.call(this);
        this._enabled = this.readSetting(constants_1.SettingNames.Enabled, true);
        this._executablePath = this.readSetting(constants_1.SettingNames.ExecutablePath, undefined);
    }
    Object.defineProperty(Settings.prototype, "enabled", {
        get: function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Settings.prototype, "executablePath", {
        get: function () {
            return this._executablePath;
        },
        enumerable: true,
        configurable: true
    });
    return Settings;
}(BaseSettings));
exports.Settings = Settings;
//# sourceMappingURL=settings.js.map