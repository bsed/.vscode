"use strict";
const assert = require('assert');
const document_1 = require('../../src/utils/document');
const vscode_languageserver_1 = require('vscode-languageserver');
describe('DocumentUtils', () => {
    describe('#getgetWordAtPosition', () => {
        let text = 'Typescript is fun.\nHaskell is too.';
        it('should return the word at the position', () => {
            let position = vscode_languageserver_1.Position.create(1, 0);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), 'Haskell');
        });
        it('should return an empty string if the word the position is a space', () => {
            let position = vscode_languageserver_1.Position.create(0, 10);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), '');
        });
        it('should return the first word of the line if the start character is negative', () => {
            let position = vscode_languageserver_1.Position.create(0, -4);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), 'Typescript');
        });
        it('should return the last word of the line if the start character exceeds line length', () => {
            let position = vscode_languageserver_1.Position.create(0, Number.MAX_VALUE);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), 'fun.');
        });
        it('should return an empty string if the line number is negative', () => {
            let position = vscode_languageserver_1.Position.create(-1, 4);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), '');
        });
        it('should return an empty string if the line number exceeds the lines of text', () => {
            let position = vscode_languageserver_1.Position.create(4, 4);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, position), '');
        });
        it('should return an empty string if the text is null', () => {
            let position = vscode_languageserver_1.Position.create(0, 0);
            assert.equal(document_1.DocumentUtils.getWordAtPosition(null, position), '');
        });
        it('should return an empty string if the position is null', () => {
            assert.equal(document_1.DocumentUtils.getWordAtPosition(text, null), '');
        });
    });
    describe('#isPositionInRange', () => {
        it('should return true if position is in range', () => {
            let position = vscode_languageserver_1.Position.create(1, 1);
            let range = vscode_languageserver_1.Range.create(0, 0, 2, 2);
            assert.equal(document_1.DocumentUtils.isPositionInRange(position, range), true);
        });
        it('should return false if position is not in range', () => {
            let position = vscode_languageserver_1.Position.create(2, 4);
            let range = vscode_languageserver_1.Range.create(0, 0, 2, 2);
            assert.equal(document_1.DocumentUtils.isPositionInRange(position, range), false);
        });
        it('should return false if position is null', () => {
            assert.equal(document_1.DocumentUtils.isPositionInRange(null, vscode_languageserver_1.Range.create(0, 0, 1, 1)), false);
        });
        it('should return false if range is null', () => {
            assert.equal(document_1.DocumentUtils.isPositionInRange(vscode_languageserver_1.Position.create(0, 0), null), false);
        });
    });
});
//# sourceMappingURL=document.spec.js.map