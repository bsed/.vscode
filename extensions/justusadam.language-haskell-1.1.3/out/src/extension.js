var vscode = require('vscode');
function activate(context) {
    vscode.languages.setLanguageConfiguration('haskell', {
        indentationRules: {
            // I dont know what to put here ...
            decreaseIndentPattern: /[\]})][ \t]*$/m,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /((\b(if\b.*|then|else|do|of|let|in|where))|=|->|>>=|>=>|=<<|(^(data)( |\t)+(\w|')+( |\t)*))( |\t)*$/
        },
        comments: {
            lineComment: '--',
            blockComment: ['{-', '-}']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ]
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map