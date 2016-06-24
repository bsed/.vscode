var vs = require("vscode");
var openurl = require("openurl");
var serializeError = require("serialize-error");
var childProcess = require("child_process");
var documenter_1 = require("./documenter");
var utilities_1 = require("./utilities");
var documenter;
function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new documenter_1.Documenter();
    }
}
function verifyLanguageSupport(document, commandName) {
    if (document.languageId !== "javascript" &&
        document.languageId !== "typescript" &&
        document.languageId !== "javascriptreact" &&
        document.languageId !== "typescriptreact") {
        vs.window.showWarningMessage("Sorry! '" + commandName + "' currently supports JavaScript and TypeScript only.");
        return false;
    }
    return true;
}
function reportError(error, action) {
    vs.window.showErrorMessage("Sorry! '" + action + "' encountered an error.", "Report Issue").then(function () {
        try {
            var sb = new utilities_1.StringBuilder();
            sb.appendLine("Platform: " + process.platform);
            sb.appendLine();
            sb.appendLine("Exception:");
            sb.appendLine(serializeError(error));
            var uri = "https://github.com/joelday/vscode-docthis/issues/new?title=" + encodeURIComponent("Exception thrown in '" + action + "': " + error.message) + "&body=" + encodeURIComponent(sb.toString());
            if (process.platform !== "win32") {
                openurl.open(uri, function (openErr) { console.error("Failed to launch browser", openErr); });
            }
            else {
                var proc = childProcess.spawnSync("cmd", [
                    "/c",
                    "start",
                    uri.replace(/[&]/g, "^&")
                ]);
            }
        }
        catch (reportErr) {
            reportError(reportErr, "Report Error");
        }
    });
}
function runCommand(commandName, document, implFunc) {
    if (!verifyLanguageSupport(document, commandName)) {
        return;
    }
    try {
        lazyInitializeDocumenter();
        implFunc();
    }
    catch (e) {
        reportError(e, commandName);
    }
}
function activate(context) {
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentThis", function (editor, edit) {
        var commandName = "Document This";
        runCommand(commandName, editor.document, function () {
            documenter.documentThis(editor, edit, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverything", function (editor, edit) {
        var commandName = "Document Everything";
        runCommand(commandName, editor.document, function () {
            documenter.documentEverything(editor, edit, false, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverythingVisible", function (editor, edit) {
        var commandName = "Document Everything Visible";
        runCommand(commandName, editor.document, function () {
            documenter.documentEverything(editor, edit, true, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.traceTypeScriptSyntaxNode", function (editor, edit) {
        var commandName = "Trace TypeScript Syntax Node";
        runCommand(commandName, editor.document, function () {
            documenter.traceNode(editor, edit);
        });
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map