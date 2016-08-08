/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const path = require('path');
const vscode_1 = require('vscode');
const vscode_languageclient_1 = require('vscode-languageclient');
const commands_1 = require('./commands');
const logger_1 = require('./utils/logger');
function activate(context) {
    setLogLevel();
    vscode_1.workspace.onDidChangeConfiguration(setLogLevel);
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ['--nolazy', '--debug=6004'] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: ['haskell'],
        synchronize: {
            // Synchronize the setting section 'ghcMod' to the server
            configurationSection: 'haskell.ghcMod'
        }
    };
    // Create the language client and start the client.
    let languageClient = new vscode_languageclient_1.LanguageClient('ghc-mod server', serverOptions, clientOptions);
    let disposable = languageClient.start();
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
    commands_1.Commands.register(context, languageClient);
}
exports.activate = activate;
function setLogLevel() {
    let config = vscode_1.workspace.getConfiguration('haskell.ghcMod');
    let logLevel = config.get('logLevel', 'error');
    logger_1.Logger.setLogLevel(logger_1.Logger.LogLevel[logLevel]);
}
//# sourceMappingURL=extension.js.map