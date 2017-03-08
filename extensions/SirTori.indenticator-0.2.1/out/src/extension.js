'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let indentSpy = new IndentSpy();
    let indentSpyController = new IndentSpyController(indentSpy);
    context.subscriptions.push(indentSpy);
    context.subscriptions.push(indentSpyController);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class IndentSpy {
    constructor() {
        this._locales = {
            en: { statusText: `Indents: {indent}`,
                statusTooltip: `current indent depth: {indent}` },
            de: { statusText: `Einzüge: {indent}`,
                statusTooltip: `aktuelle Einzugtiefe: {indent}` },
            default: { statusText: `Indents: {indent}`,
                statusTooltip: `current indent depth: {indent}` },
        };
        this.updateConfig();
    }
    updateConfig() {
        this._clearDecorators();
        let config = vscode_1.workspace.getConfiguration('indenticator');
        let locale = vscode_1.env.language;
        let multipartLocale = vscode_1.env.language.indexOf('-');
        if (multipartLocale >= 0) {
            locale = locale.substring(0, multipartLocale);
        }
        if (!this._locales[locale]) {
            this._currentLocale = this._locales['default'];
        }
        else {
            this._currentLocale = this._locales[locale];
        }
        this._indicatorStyle = vscode_1.window.createTextEditorDecorationType({
            dark: {
                borderColor: config.get('color.dark', '#888'),
                borderStyle: config.get('style', 'solid'),
                borderWidth: config.get('width', 1) + "px"
            },
            light: {
                borderColor: config.get('color.light', '#999'),
                borderStyle: config.get('style', 'solid'),
                borderWidth: config.get('width', 1) + "px"
            }
        });
        if (config.get('showCurrentDepthInStatusBar', true)) {
            if (!this._statusBarItem) {
                this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
            }
        }
        else if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
        this.updateCurrentIndent();
    }
    updateCurrentIndent() {
        let hideStatusbarIfPossible = () => {
            if (this._statusBarItem) {
                this._statusBarItem.hide();
            }
        };
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            hideStatusbarIfPossible();
            return;
        }
        let document = editor.document;
        if (!document) {
            hideStatusbarIfPossible();
            return;
        }
        let selection = editor.selection;
        if (!selection) {
            hideStatusbarIfPossible();
            return;
        }
        let tabSize = this._getTabSize(editor.options);
        let selectedIndent = this._getSelectedIndentDepth(document, selection, tabSize);
        let activeIndentRanges = this._getActiveIndentRanges(document, selection, selectedIndent, tabSize);
        editor.setDecorations(this._indicatorStyle, activeIndentRanges);
        if (this._statusBarItem) {
            this._statusBarItem.text = this._currentLocale['statusText']
                .replace('{indent}', selectedIndent);
            this._statusBarItem.tooltip = this._currentLocale['statusTooltip']
                .replace('{indent}', selectedIndent);
            this._statusBarItem.show();
        }
    }
    _clearDecorators() {
        if (!this._indicatorStyle) {
            return;
        }
        for (let i = 0; i < vscode_1.window.visibleTextEditors.length; i++) {
            vscode_1.window.visibleTextEditors[i].setDecorations(this._indicatorStyle, []);
        }
    }
    _getTabSize(options) {
        return options.insertSpaces ? Number(options.tabSize) : 1;
    }
    _getIndentDepth(index, tabSize) {
        return Math.ceil(index / tabSize);
    }
    _getLinesIndentDepth(line, tabSize) {
        return this._getIndentDepth(line.firstNonWhitespaceCharacterIndex, tabSize);
    }
    _createIndicatorRange(line, character) {
        return new vscode_1.Range(new vscode_1.Position(line, character), new vscode_1.Position(line, character));
    }
    _getSelectedIndentDepth(document, selection, tabSize) {
        if (selection.isSingleLine) {
            let line = document.lineAt(selection.start.line);
            return this._getIndentDepth(Math.min(selection.start.character, line.firstNonWhitespaceCharacterIndex), tabSize);
        }
        let selectedIndent = Number.MAX_VALUE;
        for (let i = selection.start.line; i <= selection.end.line; i++) {
            let line = document.lineAt(i);
            if (line.isEmptyOrWhitespace) {
                continue;
            }
            selectedIndent = Math.min(selectedIndent, this._getLinesIndentDepth(line, tabSize));
        }
        return selectedIndent;
    }
    _getActiveIndentRanges(document, selection, selectedIndent, tabSize) {
        if (selectedIndent == 0) {
            return [];
        }
        let selectedIndentPos = (selectedIndent - 1) * tabSize;
        let activeRanges = [];
        // add ranges for selected block
        for (let i = selection.start.line; i <= selection.end.line; i++) {
            let line = document.lineAt(i);
            activeRanges.push(this._createIndicatorRange(i, selectedIndentPos));
        }
        // add ranges for preceeding lines on same indent
        for (let i = selection.start.line - 1; i >= 0; i--) {
            let line = document.lineAt(i);
            let lineIndent = this._getLinesIndentDepth(line, tabSize);
            if (lineIndent >= selectedIndent || (line.isEmptyOrWhitespace && selectedIndent == 1)) {
                activeRanges.push(this._createIndicatorRange(i, selectedIndentPos));
            }
            else if (!line.isEmptyOrWhitespace) {
                break;
            }
        }
        // add ranges for following lines on same indent
        for (let i = selection.end.line + 1; i < document.lineCount; i++) {
            let line = document.lineAt(i);
            let lineIndent = this._getLinesIndentDepth(line, tabSize);
            if (lineIndent >= selectedIndent || (line.isEmptyOrWhitespace && selectedIndent == 1)) {
                activeRanges.push(this._createIndicatorRange(i, selectedIndentPos));
            }
            else if (!line.isEmptyOrWhitespace) {
                break;
            }
        }
        return activeRanges;
    }
    dispose() {
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
        }
    }
}
exports.IndentSpy = IndentSpy;
class IndentSpyController {
    constructor(indentSpy) {
        this._indentSpy = indentSpy;
        this._indentSpy.updateCurrentIndent();
        // subscribe to selection change and editor activation events
        let subscriptions = [];
        vscode_1.window.onDidChangeTextEditorSelection(this._onUpdateEvent, this, subscriptions);
        vscode_1.window.onDidChangeActiveTextEditor(this._onUpdateEvent, this, subscriptions);
        // subscribe to configuration change events
        vscode_1.workspace.onDidChangeConfiguration(this._onChangedConfigEvent, this, subscriptions);
        this._disposable = vscode_1.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
    }
    _onUpdateEvent(e) {
        this._indentSpy.updateCurrentIndent();
    }
    _onChangedConfigEvent(e) {
        this._indentSpy.updateConfig();
    }
}
//# sourceMappingURL=extension.js.map