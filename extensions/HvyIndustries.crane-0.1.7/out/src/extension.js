/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
"use strict";
var path = require("path");
var vscode_1 = require("vscode");
var vscode_languageclient_1 = require("vscode-languageclient");
var crane_1 = require("./crane");
var qualityOfLife_1 = require("./features/qualityOfLife");
function activate(context) {
    var qol = new qualityOfLife_1.default();
    var serverModule = context.asAbsolutePath(path.join("server", "server.js"));
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    var clientOptions = {
        documentSelector: ["php"],
        synchronize: {
            configurationSection: "languageServerExample",
            fileEvents: vscode_1.workspace.createFileSystemWatcher("**/.clientrc")
        }
    };
    // Create the language client and start the client.
    var langClient = new vscode_languageclient_1.LanguageClient("Crane Language Server", serverOptions, clientOptions);
    // Use this to handle a request sent from the server
    // https://github.com/Microsoft/vscode/blob/80bd73b5132268f68f624a86a7c3e56d2bbac662/extensions/json/client/src/jsonMain.ts
    // https://github.com/Microsoft/vscode/blob/580d19ab2e1fd6488c3e515e27fe03dceaefb819/extensions/json/server/src/server.ts
    //langClient.onRequest()
    var disposable = langClient.start();
    var crane = new crane_1.default(langClient);
    var requestType = { method: "workDone" };
    langClient.onRequest(requestType, function () {
        // Load settings
        var craneSettings = vscode_1.workspace.getConfiguration("crane");
        if (craneSettings) {
            var showStatusBarItem = craneSettings.get("showStatusBarBugReportLink", true);
            if (showStatusBarItem) {
                crane.statusBarItem.text = "$(bug) Report PHP Intellisense Bug";
                crane.statusBarItem.tooltip = "Found a problem with the PHP Intellisense provided by Crane? Click here to file a bug report on Github";
                crane.statusBarItem.command = "crane.reportBug";
                crane.statusBarItem.show();
            }
            else {
                crane.statusBarItem.hide();
            }
        }
        else {
            crane.statusBarItem.hide();
        }
    });
    // Register commands for QoL improvements
    var duplicateLineCommand = vscode_1.commands.registerCommand("crane.duplicateLine", qol.duplicateLineOrSelection);
    var reportBugCommand = vscode_1.commands.registerCommand("crane.reportBug", crane.reportBug);
    context.subscriptions.push(disposable);
    context.subscriptions.push(duplicateLineCommand);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map