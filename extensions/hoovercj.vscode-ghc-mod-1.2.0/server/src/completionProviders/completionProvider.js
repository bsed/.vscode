/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
const Path = require('path');
class CompletionProvider {
    constructor(extensionRoot, logger) {
        this.logger = logger;
        this.logger.warn('completionProvider constructor START');
        this.extensionRoot = extensionRoot;
        // this.logger.warn(__dirname);
        // this.logger.warn(Path.resolve(__dirname));
        let textmateRegistry = require(Path.join(this.extensionRoot, '../../node_modules/vscode-textmate/release/main.js')).Registry;
        let registry = new textmateRegistry();
        let grammarPath = 'C:/Users/cohoov/Documents/GitHub/vscode-ghc-mod/server/src/completionProviders/grammars/haskell.plist';
        this.grammar = registry.loadGrammarFromPathSync(grammarPath);
        this.logger.warn('completionProvider constructor END');
    }
    // TODO: deal with completion resolve
    // TODO: tie into tags or ghc-mod backend
    getCompletionItems(document, position) {
        let text = document.getText();
        let lineContent = text.split('\n')[position.line];
        let lineTokens = this.grammar.tokenizeLine(lineContent, null);
        let token = lineTokens.tokens.filter(lineToken => CompletionProvider.isInRange(position.character, lineToken.startIndex, lineToken.endIndex))[0];
        let test = 'undefined';
        if (CompletionProvider.isInScope(token.scopes, CompletionProvider.instancePreprocessorScope)) {
            test = 'INSTANCE_PREPROCESSOR';
        }
        else if (CompletionProvider.isInScope(token.scopes, CompletionProvider.typeScope)) {
            test = 'TYPE';
        }
        else if (CompletionProvider.isInScope(token.scopes, CompletionProvider.moduleScope)) {
            test = 'MODULE';
        }
        else if (CompletionProvider.isInScope(token.scopes, CompletionProvider.exportsScope)) {
            test = 'EXPORTS';
        }
        else if (CompletionProvider.isInScope(token.scopes, CompletionProvider.preprocessorScope)) {
            test = 'PREPROCESSOR';
        }
        let testCompletion = {
            label: test,
            data: test,
            detail: test,
            insertText: test
        };
        return new Promise(() => [testCompletion]);
    }
    static isInRange(position, start, end) {
        return position >= start && position <= end;
    }
    static isInScope(actualScopes, targetScopes) {
        return targetScopes.every(scope => scope in actualScopes);
    }
}
CompletionProvider.typeScope = ['meta.type-signature.haskell'];
CompletionProvider.sourceScope = ['source.haskell'];
CompletionProvider.moduleScope = ['meta.import.haskell', 'support.other.module.haskell'];
CompletionProvider.preprocessorScope = ['meta.preprocessor.haskell'];
CompletionProvider.instancePreprocessorScope = ['meta.declaration.instance.haskell', 'meta.preprocessor.haskell'];
CompletionProvider.exportsScope = ['meta.import.haskell', 'meta.declaration.exports.haskell'];
CompletionProvider.pragmaWords = [
    'LANGUAGE', 'OPTIONS_GHC', 'INCLUDE', 'WARNING', 'DEPRECATED', 'INLINE',
    'NOINLINE', 'ANN', 'LINE', 'RULES', 'SPECIALIZE', 'UNPACK', 'SOURCE'
];
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=completionProvider.js.map