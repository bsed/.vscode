/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
/* tslint:disable:variable-name */
var Constants = (function () {
    function Constants() {
    }
    Constants.ExtensionName = 'composer';
    Constants.OutputChannel = 'Composer';
    return Constants;
}());
exports.Constants = Constants;
var CommandNames = (function () {
    function CommandNames() {
    }
    CommandNames.CommandPrefix = Constants.ExtensionName + '.';
    CommandNames.About = CommandNames.CommandPrefix + 'About';
    CommandNames.Archive = CommandNames.CommandPrefix + 'Archive';
    CommandNames.ClearCache = CommandNames.CommandPrefix + 'ClearCache';
    CommandNames.Diagnose = CommandNames.CommandPrefix + 'Diagnose';
    CommandNames.DumpAutoload = CommandNames.CommandPrefix + 'DumpAutoload';
    CommandNames.Install = CommandNames.CommandPrefix + 'Install';
    CommandNames.Remove = CommandNames.CommandPrefix + 'Remove';
    CommandNames.RemovePackage = CommandNames.CommandPrefix + 'RemovePackage';
    CommandNames.Require = CommandNames.CommandPrefix + 'Require';
    CommandNames.RunScript = CommandNames.CommandPrefix + 'RunScript';
    CommandNames.SelfUpdate = CommandNames.CommandPrefix + 'SelfUpdate';
    CommandNames.Show = CommandNames.CommandPrefix + 'Show';
    CommandNames.Status = CommandNames.CommandPrefix + 'Status';
    CommandNames.Update = CommandNames.CommandPrefix + 'Update';
    CommandNames.Validate = CommandNames.CommandPrefix + 'Validate';
    CommandNames.Version = CommandNames.CommandPrefix + 'Version';
    return CommandNames;
}());
exports.CommandNames = CommandNames;
var SettingNames = (function () {
    function SettingNames() {
    }
    SettingNames.SettingsPrefix = Constants.ExtensionName + '.';
    SettingNames.Enabled = SettingNames.SettingsPrefix + 'enabled';
    SettingNames.ExecutablePath = SettingNames.SettingsPrefix + 'executablePath';
    return SettingNames;
}());
exports.SettingNames = SettingNames;
//# sourceMappingURL=constants.js.map