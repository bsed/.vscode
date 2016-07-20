"use strict";
var vscode = require("vscode");
var sortProvider = require("./providers/importSortProvider");
var telemetryHelper = require("./common/telemetry");
var telemetryContracts = require("./common/telemetryContracts");
function activate(context, outChannel) {
    var rootDir = context.asAbsolutePath(".");
    var disposable = vscode.commands.registerCommand("python.sortImports", function () {
        var activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.languageId !== "python") {
            vscode.window.showErrorMessage("Please open a Python source file to sort the imports.");
            return;
        }
        var delays = new telemetryHelper.Delays();
        new sortProvider.PythonImportSortProvider().sortImports(rootDir, activeEditor.document).then(function (changes) {
            if (changes.length === 0) {
                return;
            }
            return activeEditor.edit(function (builder) {
                changes.forEach(function (change) { return builder.replace(change.range, change.newText); });
            });
        }).then(function () {
            delays.stop();
            telemetryHelper.sendTelemetryEvent(telemetryContracts.Commands.SortImports, null, delays.toMeasures());
        }).catch(function (error) {
            var message = typeof error === "string" ? error : (error.message ? error.message : error);
            outChannel.appendLine(error);
            outChannel.show();
            vscode.window.showErrorMessage(message);
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=sortImports.js.map