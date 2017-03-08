"use strict";
const haskellLexicalStructure_1 = require('./haskellLexicalStructure');
class DocumentUtils {
    static getSymbolAtOffset(text, offset) {
        if (text === null || offset === null) {
            return '';
        }
        const identifierCharacterRegex = new RegExp('^' + haskellLexicalStructure_1.HaskellLexicalRules.IdentifierRegexCharacterClass + '$', 'u');
        const operatorCharacterRegex = new RegExp('^' + haskellLexicalStructure_1.HaskellLexicalRules.OperatorRegexCharacterClass + '$', 'u');
        const character = text.charAt(offset);
        const isIdentifier = identifierCharacterRegex.test(character);
        const isOperator = operatorCharacterRegex.test(character);
        let symbol;
        if (isIdentifier && isOperator) {
            throw new Error(`Failed to disambiguate character '${character}' at offset ${offset}`);
        }
        else if (isIdentifier) {
            symbol = DocumentUtils.expandAtOffset(text, offset, char => identifierCharacterRegex.test(char));
        }
        else if (isOperator) {
            symbol = DocumentUtils.expandAtOffset(text, offset, char => operatorCharacterRegex.test(char));
        }
        else {
            return '';
        }
        // Ordinary comment is not a symbol
        if (/^--+$/.test(symbol.string)) {
            return '';
        }
        // Nested coment open/close are not symbols
        if (text.charAt(symbol.start) === '-' && text.charAt(symbol.start - 1) === '{') {
            return '';
        }
        if (text.charAt(symbol.end - 1) === '-' && text.charAt(symbol.end) === '}') {
            return '';
        }
        return symbol.string;
    }
    static isPositionInRange(position, range) {
        if (position === null || range === null) {
            return false;
        }
        if (position.line < range.start.line || position.line > range.end.line ||
            position.character < range.start.character || position.character > range.end.character) {
            return false;
        }
        return true;
    }
    static expandAtOffset(text, offset, shouldIncludeCharacter) {
        let start = offset;
        let end = offset;
        for (; shouldIncludeCharacter(text.charAt(start - 1)); start--) { }
        for (; shouldIncludeCharacter(text.charAt(end)); end++) { }
        return {
            string: text.substring(start, end),
            start: start,
            end: end,
        };
    }
}
exports.DocumentUtils = DocumentUtils;
//# sourceMappingURL=document.js.map