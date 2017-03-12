/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_languageserver_1 = require("vscode-languageserver");
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
var documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
connection.onInitialize(function (params) {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [
                    '.',
                    '+',
                    '=',
                    ':',
                    '$',
                    '>',
                    '@',
                    '(',
                    ' ',
                    '\\' // triggered by a namespace classname
                ]
            }
        }
    };
});
connection.onDidChangeConfiguration(function (change) {
    connection.console.log('We recevied a config change event');
});
// Use this to send a request to the client
// https://github.com/Microsoft/vscode/blob/80bd73b5132268f68f624a86a7c3e56d2bbac662/extensions/json/client/src/jsonMain.ts
// https://github.com/Microsoft/vscode/blob/580d19ab2e1fd6488c3e515e27fe03dceaefb819/extensions/json/server/src/server.ts
//connection.sendRequest()
connection.onDidChangeWatchedFiles(function (change) {
    connection.console.log('We recevied an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion(function (textDocumentPosition) {
    if (textDocumentPosition.languageId != "php")
        return;
    var doc = documents.get(textDocumentPosition.uri);
    var offset = doc.offsetAt(textDocumentPosition.position);
    var results = [];
    return results;
});
connection.onCompletionResolve(function (item) {
    // TODO -- Add phpDoc info
    return item;
});
connection.listen();
//# sourceMappingURL=server.js.map