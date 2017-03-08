"use strict";
const assert = require('assert');
const haskTagsSymbolProvider_1 = require('../src/symbolProviders/haskTagsSymbolProvider');
const vscode_languageserver_1 = require('vscode-languageserver');
const path = require('path');
const testLogger_1 = require('./helpers/testLogger');
const fileUrl = require('file-url');
describe('HaskTagsSymbolProvider', () => {
    let logger = new testLogger_1.TestLogger();
    let haskTagsCommand = 'hasktags';
    let cwd = process.cwd();
    let symbolsZeroPath = path.join(cwd, '/test/fixtures/symbols/symbols0.hs');
    let symbolsOnePath = path.join(cwd, '/test/fixtures/symbols/symbols1.hs');
    let position0 = vscode_languageserver_1.Position.create(0, 0);
    let range0 = vscode_languageserver_1.Range.create(position0, position0);
    let uri0 = fileUrl(symbolsZeroPath);
    let position1 = vscode_languageserver_1.Position.create(1, 0);
    let range1 = vscode_languageserver_1.Range.create(position1, position1);
    let uri1 = fileUrl(symbolsOnePath);
    let locationA = vscode_languageserver_1.Location.create(uri0, range0);
    let locationB = vscode_languageserver_1.Location.create(uri1, range0);
    let locationCube = vscode_languageserver_1.Location.create(uri0, range1);
    describe('#getSymbolsForFile', () => {
        it('should return the correct symbols from a file', () => {
            let symbolProvider = new haskTagsSymbolProvider_1.HaskTagsSymbolProvider(haskTagsCommand, cwd, logger);
            let documentSymbolParams = { textDocument: { uri: uri0 } };
            return symbolProvider.getSymbolsForFile(documentSymbolParams).then((symbols) => {
                let expectedSymbols = [
                    {
                        name: 'A',
                        kind: vscode_languageserver_1.SymbolKind.Module,
                        location: locationA
                    },
                    {
                        name: 'cube',
                        kind: vscode_languageserver_1.SymbolKind.Function,
                        location: locationCube
                    }
                ];
                assert.deepEqual(symbols, expectedSymbols);
            });
        });
        it('should return an empty array when the file is empty', () => {
            let symbolProvider = new haskTagsSymbolProvider_1.HaskTagsSymbolProvider(haskTagsCommand, cwd, logger);
            let path = './test/fixtures/empty.hs';
            let documentSymbolParams = { textDocument: { uri: fileUrl(path) } };
            return symbolProvider.getSymbolsForFile(documentSymbolParams).then((symbols) => {
                assert.equal(symbols.length, 0);
            });
        });
    });
    describe('#getSymbolsForFile', () => {
        it('should return the symbols matching the query', () => {
            let symbolProvider = new haskTagsSymbolProvider_1.HaskTagsSymbolProvider(haskTagsCommand, cwd, logger);
            return symbolProvider.getSymbolsForWorkspace({ query: 'B' }).then((symbols) => {
                let expectedSymbols = [
                    {
                        name: 'B',
                        kind: vscode_languageserver_1.SymbolKind.Module,
                        location: locationB
                    },
                    {
                        name: 'cube',
                        kind: vscode_languageserver_1.SymbolKind.Function,
                        location: locationCube
                    }
                ];
                assert.deepEqual(symbols, expectedSymbols);
            });
        });
        it('should return an empty array when the directory is empty', () => {
            let symbolProvider = new haskTagsSymbolProvider_1.HaskTagsSymbolProvider(haskTagsCommand, './test/fixtures/symbols/empty/', logger);
            return symbolProvider.getSymbolsForWorkspace({ query: 'b' }).then((symbols) => {
                assert.equal(symbols.length, 0);
            });
        });
    });
});
//# sourceMappingURL=haskTagsSymbolProvider.spec.js.map