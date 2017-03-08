"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const vscode_languageserver_1 = require('vscode-languageserver');
const abstractTagsSymbolProvider_1 = require('./abstractTagsSymbolProvider');
const fileUrl = require('file-url');
class FastTagsSymbolProvider extends abstractTagsSymbolProvider_1.AbstractTagsSymbolProvider {
    constructor(executable, workspaceRoot, logger) {
        super(executable || 'fast-tags', workspaceRoot, logger);
    }
    getFileSymbolsCommand(documentSymbolParams) {
        let uri = documentSymbolParams.textDocument.uri;
        return `${this.executable} -o - ${vscode_languageserver_1.Files.uriToFilePath(uri)}`;
    }
    getWorkspaceSymbolsCommand() {
        return `${this.executable} -R ${this.workspaceRoot} -o - `;
    }
    parseTags(rawTags) {
        let symbolInformation = rawTags
            .split('\n')
            .slice(1)
            .map((tagLine) => { return tagLine.split('\t'); })
            .filter((line) => line.length === 4)
            .map(([name, path, line, kind]) => {
            let uri = fileUrl(path, { resolve: true });
            let lineNumber = parseInt(line, 10) - 1;
            let range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(lineNumber, 0), vscode_languageserver_1.Position.create(lineNumber, 0));
            let symbolKind = FastTagsSymbolProvider.toSymbolKind(kind);
            return {
                name: name,
                kind: symbolKind,
                location: vscode_languageserver_1.Location.create(uri, range)
            };
        });
        this.logger.log(`Found ${symbolInformation.length} tags`);
        return symbolInformation;
    }
    static toSymbolKind(rawKind) {
        switch (rawKind.trim()) {
            case 'm':
                return vscode_languageserver_1.SymbolKind.Module;
            case 'f':
                return vscode_languageserver_1.SymbolKind.Function;
            case 'c':
                return vscode_languageserver_1.SymbolKind.Class;
            case 't':
                return vscode_languageserver_1.SymbolKind.Interface;
            case 'C':
                return vscode_languageserver_1.SymbolKind.Constructor;
            case 'o':
                return vscode_languageserver_1.SymbolKind.Method;
            default:
                return vscode_languageserver_1.SymbolKind.Function;
        }
    }
}
exports.FastTagsSymbolProvider = FastTagsSymbolProvider;
//# sourceMappingURL=fastTagsSymbolProvider.js.map