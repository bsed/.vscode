"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const vscode_languageserver_1 = require('vscode-languageserver');
const abstractTagsSymbolProvider_1 = require('./abstractTagsSymbolProvider');
const fileUrl = require('file-url');
class HaskTagsSymbolProvider extends abstractTagsSymbolProvider_1.AbstractTagsSymbolProvider {
    constructor(executable, workspaceRoot, logger) {
        super(executable || 'hasktags', workspaceRoot, logger);
    }
    getFileSymbolsCommand(documentSymbolParams) {
        let uri = documentSymbolParams.textDocument.uri;
        return `${this.executable} -c -x -o - ${vscode_languageserver_1.Files.uriToFilePath(uri)}`;
    }
    getWorkspaceSymbolsCommand() {
        return `${this.executable} -c -x -o - ${this.workspaceRoot}`;
    }
    parseTags(rawTags) {
        let symbolInformation = rawTags
            .split('\n')
            .slice(3)
            .map((tagLine) => { return tagLine.split('\t'); })
            .filter((line) => line.length === 6)
            .map(([name, path, , kind, line,]) => {
            let uri = fileUrl(path, { resolve: true });
            let lineNumber = parseInt(line.replace('line:', ''), 10) - 1;
            let range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(lineNumber, 0), vscode_languageserver_1.Position.create(lineNumber, 0));
            let symbolKind = HaskTagsSymbolProvider.toSymbolKind(kind);
            return {
                name: name,
                kind: symbolKind,
                location: vscode_languageserver_1.Location.create(uri, range)
            };
        })
            .filter(HaskTagsSymbolProvider.onlyUnique)
            .filter(HaskTagsSymbolProvider.noBackToBack);
        this.logger.log(`Found ${symbolInformation.length} tags`);
        return symbolInformation;
    }
    static toSymbolKind(rawKind) {
        switch (rawKind.trim()) {
            case 'm':
                return vscode_languageserver_1.SymbolKind.Module;
            case 'ft':
                return vscode_languageserver_1.SymbolKind.Function;
            case 'c':
                return vscode_languageserver_1.SymbolKind.Class;
            case 'cons':
                return vscode_languageserver_1.SymbolKind.Constructor;
            case 't':
            case 'nt':
                return vscode_languageserver_1.SymbolKind.Interface;
            case 'o':
                return vscode_languageserver_1.SymbolKind.Method;
            default:
                return vscode_languageserver_1.SymbolKind.Function;
        }
    }
    static onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
    static noBackToBack(value, index, self) {
        return index === 0 ? true :
            !(value.name === self[index - 1].name &&
                value.location.range.start.line - self[index - 1].location.range.start.line <= 1);
    }
}
exports.HaskTagsSymbolProvider = HaskTagsSymbolProvider;
//# sourceMappingURL=haskTagsSymbolProvider.js.map