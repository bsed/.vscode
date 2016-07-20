'use strict';
var vscode = require('vscode');
var systemVariables_1 = require('./systemVariables');
var systemVariables = new systemVariables_1.SystemVariables();
var PythonSettings = (function () {
    function PythonSettings() {
        var _this = this;
        if (PythonSettings.pythonSettings) {
            throw new Error('Singleton class, Use getInstance method');
        }
        vscode.workspace.onDidChangeConfiguration(function () {
            _this.initializeSettings();
        });
        this.initializeSettings();
    }
    PythonSettings.getInstance = function () {
        return PythonSettings.pythonSettings;
    };
    PythonSettings.prototype.initializeSettings = function () {
        var pythonSettings = vscode.workspace.getConfiguration('python');
        this.pythonPath = systemVariables.resolveAny(pythonSettings.get('pythonPath'));
        this.devOptions = systemVariables.resolveAny(pythonSettings.get('devOptions'));
        this.devOptions = Array.isArray(this.devOptions) ? this.devOptions : [];
        var lintingSettings = systemVariables.resolveAny(pythonSettings.get('linting'));
        if (this.linting) {
            Object.assign(this.linting, lintingSettings);
        }
        else {
            this.linting = lintingSettings;
        }
        var formattingSettings = systemVariables.resolveAny(pythonSettings.get('formatting'));
        if (this.formatting) {
            Object.assign(this.formatting, formattingSettings);
        }
        else {
            this.formatting = formattingSettings;
        }
        var autoCompleteSettings = systemVariables.resolveAny(pythonSettings.get('autoComplete'));
        if (this.autoComplete) {
            Object.assign(this.autoComplete, autoCompleteSettings);
        }
        else {
            this.autoComplete = autoCompleteSettings;
        }
        var unitTestSettings = systemVariables.resolveAny(pythonSettings.get('unitTest'));
        if (this.unitTest) {
            Object.assign(this.unitTest, unitTestSettings);
        }
        else {
            this.unitTest = unitTestSettings;
        }
    };
    PythonSettings.pythonSettings = new PythonSettings();
    return PythonSettings;
}());
exports.PythonSettings = PythonSettings;
//# sourceMappingURL=configSettings.js.map