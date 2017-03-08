'use strict';
const vscode = require('vscode');
const vscode_languageclient_1 = require('vscode-languageclient');
const logger_1 = require('./utils/logger');
var InsertTypeRequest;
(function (InsertTypeRequest) {
    'use strict';
    InsertTypeRequest.type = { get method() { return 'insertType'; } };
})(InsertTypeRequest || (InsertTypeRequest = {}));
var OpenSettingsRequest;
(function (OpenSettingsRequest) {
    'use strict';
    OpenSettingsRequest.type = { get method() { return 'openSettings'; } };
})(OpenSettingsRequest = exports.OpenSettingsRequest || (exports.OpenSettingsRequest = {}));
var Commands;
(function (Commands) {
    'use strict';
    function insertType(client, editor) {
        let selection = editor.selections[0];
        let info = vscode_languageclient_1.TextDocumentPositionParams.create(editor.document.uri.toString(), selection.active);
        client.sendRequest(InsertTypeRequest.type, info).then(type => {
            if (!type) {
                logger_1.Logger.log('No type information found. Not inserting type.');
                return;
            }
            let cleanedType = type
                .replace(/[ ]+/g, ' ') // make multiple spaces unique
                .replace(/[\r\n]/g, '') // remove all line breaks
                .replace(/[\r\n\s]+$/, ''); // remove trailing whitespaces/line breakes
            logger_1.Logger.log(`received type: ${type}`);
            let positionToInsert = new vscode.Position(selection.active.line, 0);
            editor.edit(editBuilder => {
                let definitionLine = editor.document.lineAt(positionToInsert.line);
                let indent = definitionLine.text.substring(0, definitionLine.firstNonWhitespaceCharacterIndex);
                let typeLine = `${indent}${cleanedType}\n`;
                editBuilder.insert(positionToInsert, typeLine);
            });
        });
    }
    function register(context, client) {
        let registerCommand = (command, callback) => context.subscriptions.push(vscode.commands.registerTextEditorCommand(command, (editor, edit) => callback(client, editor)));
        registerCommand('ghcmod.insertType', insertType);
    }
    Commands.register = register;
})(Commands = exports.Commands || (exports.Commands = {}));
//# sourceMappingURL=commands.js.map