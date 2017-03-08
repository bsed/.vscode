"use strict";
const assert = require('assert');
const document_1 = require('../../src/utils/document');
const vscode_languageserver_1 = require('vscode-languageserver');
describe('DocumentUtils', () => {
    describe('#getSymbolAtPosition', () => {
        it('should return entire string if entire string is a symbol', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('identifier', 3), 'identifier');
        });
        it('should return a single character operator', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('+', 0), '+');
        });
        it('should return a single character identifier', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('x', 0), 'x');
        });
        it('should return entire symbol if it is bracketed by whitespace', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset(' function ', 3), 'function');
        });
        it('should return an operator if it is bracketed by identifiers', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('x*x', 1), '*');
        });
        it('should return an operator if it contains two dashes', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('|--', 0), '|--');
        });
        it('should return an operator if it consists of Unicode punctuation', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('»', 0), '»');
        });
        it('should return an identifier if it consists of Unicode letters', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('ψ', 0), 'ψ');
        });
        it('should return an operator if it consists double equal signs', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('==', 0), '==');
        });
        it('should return an empty string for an ordinary comment', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('--comment', 0), '');
        });
        it('should return an empty string for an ordinary comment with more than two dashes', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('---', 0), '');
        });
        it('should return an empty string for start of nested comment', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('{-', 1), '');
        });
        it('should return an empty string for end of nested comment', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('-}', 0), '');
        });
        it('should return an empty string for start of a pragma', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('{-#', 2), '');
        });
        it('should return an empty string for end of pragma', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('#-}', 0), '');
        });
        it('should return an empty string if the position is a space', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset(' ', 0), '');
        });
        it('should return an empty string if the text is null', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset(null, 0), '');
        });
        it('should return an empty string if the position is null', () => {
            assert.equal(document_1.DocumentUtils.getSymbolAtOffset('text', null), '');
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