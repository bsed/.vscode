"use strict";
const vs = require("vscode");
const ts = require("typescript");
const utils = require("./utilities");
const languageServiceHost_1 = require("./languageServiceHost");
function includeTypes() {
    return vs.workspace.getConfiguration().get("docthis.includeTypes", true);
}
function enableHungarianNotationEvaluation() {
    return vs.workspace.getConfiguration().get("docthis.enableHungarianNotationEvaluation", false);
}
class Documenter {
    constructor() {
        this._languageServiceHost = new languageServiceHost_1.LanguageServiceHost();
        this._services = ts.createLanguageService(this._languageServiceHost, ts.createDocumentRegistry());
    }
    automaticDocument(editor, edit) {
        const selection = editor.selection;
        const caret = selection.start;
        const sourceFile = this._getSourceFile(editor.document);
        const newText = editor.document.getText();
        sourceFile.update(newText, {
            newLength: newText.length,
            span: {
                start: 0,
                length: newText.length
            }
        });
        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        const sb = new utils.StringBuilder();
        const foundLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (foundLocation) {
            const foundLocationOffset = editor.document.offsetAt(new vs.Position(foundLocation.line, foundLocation.character));
            const caretOffset = editor.document.offsetAt(caret);
            if (caretOffset > foundLocationOffset) {
                return;
            }
            this._insertDocumentation(sb, caret, editor, edit, sourceFile, false, true);
        }
    }
    documentThis(editor, edit, commandName) {
        const selection = editor.selection;
        const caret = selection.start;
        const sourceFile = this._getSourceFile(editor.document);
        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current caret position");
            return;
        }
        const sb = new utils.StringBuilder();
        const docLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, edit, sourceFile, true, true);
        }
        else {
            this._showFailureMessage(commandName, "at the current caret position");
        }
    }
    _jumpToDescriptionLocation(commentText) {
        if (vs.workspace.getConfiguration().get("docthis.enableJumpToDescriptionLocation", true)) {
            const lines = commentText.split("\n");
            const count = lines.length;
            const line = vs.window.activeTextEditor.selection.start.line - (count - 2);
            const character = lines[1].length;
            const position = new vs.Position(line, character);
            const selection = new vs.Selection(position, position);
            vs.window.activeTextEditor.selection = selection;
        }
    }
    documentEverything(editor, edit, visibleOnly, commandName) {
        let sourceFile = this._getSourceFile(editor.document);
        const documentable = visibleOnly ? utils.findVisibleChildrenOfKind(sourceFile) : utils.findChildrenOfKind(sourceFile);
        let showFailure = false;
        documentable.forEach(node => {
            const sb = new utils.StringBuilder();
            const docLocation = this._documentNode(sb, node, editor, sourceFile);
            if (docLocation) {
                this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
            }
            else {
                showFailure = true;
            }
            sourceFile = this._getSourceFile(editor.document);
        });
        if (showFailure) {
            this._showFailureMessage(commandName, "for everything in the document");
        }
    }
    traceNode(editor, edit) {
        const selection = editor.selection;
        const caret = selection.start;
        const sourceFile = this._getSourceFile(editor.document);
        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const nodes = [];
        let parent = node;
        while (parent) {
            nodes.push(this._printNodeInfo(parent, sourceFile));
            parent = parent.parent;
        }
        const sb = new utils.StringBuilder();
        nodes.reverse().forEach(n => {
            sb.appendLine(n);
        });
        if (!this._outputChannel) {
            this._outputChannel = vs.window.createOutputChannel("TypeScript Syntax Node Trace");
        }
        this._outputChannel.show();
        this._outputChannel.appendLine(sb.toString());
    }
    _printNodeInfo(node, sourceFile) {
        const sb = new utils.StringBuilder();
        sb.appendLine(`${node.getStart()} to ${node.getEnd()} --- (${node.kind}) ${ts.SyntaxKind[node.kind]}`);
        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart()).character;
        for (let i = 0; i < column; i++) {
            sb.append(" ");
        }
        sb.appendLine(node.getText());
        return sb.toString();
    }
    _showFailureMessage(commandName, condition) {
        vs.window.showErrorMessage(`Sorry! '${commandName}' wasn't able to produce documentation ${condition}.`);
    }
    // TODO: This is pretty messy...
    _insertDocumentation(sb, position, editor, edit, sourceFile, withStart = true, goToDescription = false) {
        let location = new vs.Position(position.line, position.character);
        const indentStartLocation = new vs.Position(position.line, 0);
        let indentRange = new vs.Range(indentStartLocation, location);
        let commentText;
        if (!withStart) {
            if (position.character - 3 >= 0) {
                indentRange = new vs.Range(indentStartLocation, new vs.Position(position.line, position.character - 3));
            }
            const indent = editor.document.getText(indentRange);
            commentText = sb.toCommentString(indent, withStart);
            const lines = commentText.split("\n");
            const firstLines = lines.splice(0, 2).join("\n");
            edit.insert(location, firstLines);
            const latterLocation = new vs.Position(position.line, position.character);
            edit.insert(latterLocation, "\n" + lines.join("\n"));
        }
        else {
            const indent = editor.document.getText(indentRange);
            commentText = sb.toCommentString(indent, withStart);
            edit.insert(location, commentText);
        }
        if (withStart) {
            const newText = editor.document.getText();
            try {
                sourceFile.update(newText, {
                    newLength: newText.length,
                    span: {
                        start: 0,
                        length: newText.length
                    }
                });
            }
            catch (error) {
                console.warn("Error in source file update:", error);
            }
        }
        if (goToDescription) {
            setTimeout(() => {
                this._jumpToDescriptionLocation(commentText);
            }, 100);
        }
    }
    _getSourceFile(document) {
        const fileName = utils.fixWinPath(document.fileName);
        const canonicalFileName = ts.sys.useCaseSensitiveFileNames ? fileName.toLowerCase() : fileName;
        const fileText = document.getText();
        this._languageServiceHost.updateCurrentFile(canonicalFileName, fileText);
        this._services.getSyntacticDiagnostics(canonicalFileName);
        return this._services.getProgram().getSourceFile(canonicalFileName);
    }
    _documentNode(sb, node, editor, sourceFile) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                this._emitClassDeclaration(sb, node);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                this._emitPropertyDeclaration(sb, node);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this._emitInterfaceDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this._emitEnumDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumMember:
                sb.appendLine();
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                this._emitMethodDeclaration(sb, node);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, node);
                break;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return this._emitFunctionExpression(sb, node, sourceFile);
            default:
                return;
        }
        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    }
    _emitFunctionExpression(sb, node, sourceFile) {
        let targetNode = node.parent;
        if (node.parent.kind !== ts.SyntaxKind.PropertyAssignment &&
            node.parent.kind !== ts.SyntaxKind.BinaryExpression) {
            targetNode = utils.findFirstParent(targetNode, [ts.SyntaxKind.VariableDeclarationList]);
            if (!targetNode) {
                return;
            }
        }
        sb.appendLine();
        sb.appendLine();
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
        return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
    }
    _emitClassDeclaration(sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine(`@class ${node.name.getText()}`);
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    _emitPropertyDeclaration(sb, node) {
        sb.appendLine();
        sb.appendLine();
        if (node.kind === ts.SyntaxKind.GetAccessor) {
            const name = utils.findFirstChildOfKindDepthFirst(node, [ts.SyntaxKind.Identifier]).getText();
            const parentClass = node.parent;
            let hasSetter = !!parentClass.members.find(c => c.kind === ts.SyntaxKind.SetAccessor &&
                utils.findFirstChildOfKindDepthFirst(c, [ts.SyntaxKind.Identifier]).getText() === name);
            if (!hasSetter) {
                sb.appendLine("@readonly");
            }
        }
        this._emitModifiers(sb, node);
        // JSDoc fails to emit documentation for arrow function syntax. (https://github.com/jsdoc3/jsdoc/issues/1100)
        if (includeTypes()) {
            if (node.type && node.type.getText().indexOf("=>") === -1) {
                sb.append(`@type ${utils.formatTypeName(node.type.getText())}`);
            }
            else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(node.name.getText())) {
                sb.append(`@type ${this._getHungarianNotationType(node.name.getText())}`);
            }
        }
        this._emitMemberOf(sb, node.parent);
    }
    _emitInterfaceDeclaration(sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine(`@interface ${node.name.getText()}`);
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    _emitEnumDeclaration(sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine(`@enum {number}`);
    }
    _emitDescriptionDeclaration(sb) {
        if (vs.workspace.getConfiguration().get("docthis.includeDescriptionTag", true)) {
            sb.appendLine("@description");
        }
    }
    _emitMethodDeclaration(sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
        this._emitDescriptionDeclaration(sb);
    }
    _emitMemberOf(sb, parent) {
        let enabledForClasses = parent.kind === ts.SyntaxKind.ClassDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnClassMembers", true);
        let enabledForInterfaces = parent.kind === ts.SyntaxKind.InterfaceDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnInterfaceMembers", true);
        if (parent && (enabledForClasses || enabledForInterfaces)) {
            sb.appendLine();
            sb.appendLine("@memberOf " + parent["name"].text);
        }
    }
    _emitReturns(sb, node) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.append("@returns");
            if (includeTypes() && node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            sb.appendLine();
        }
    }
    _emitParameters(sb, node) {
        if (!node.parameters) {
            return;
        }
        node.parameters.forEach(parameter => {
            const name = parameter.name.getText();
            const isOptional = parameter.questionToken || parameter.initializer;
            const isArgs = !!parameter.dotDotDotToken;
            const initializerValue = parameter.initializer ? parameter.initializer.getText() : null;
            let typeName = "{any}";
            if (includeTypes()) {
                if (parameter.initializer && !parameter.type) {
                    if (/^[0-9]/.test(initializerValue)) {
                        typeName = "{number}";
                    }
                    else if (initializerValue.indexOf("\"") !== -1 ||
                        initializerValue.indexOf("'") !== -1 ||
                        initializerValue.indexOf("`") !== -1) {
                        typeName = "{string}";
                    }
                    else if (initializerValue.indexOf("true") !== -1 ||
                        initializerValue.indexOf("false") !== -1) {
                        typeName = "{boolean}";
                    }
                }
                else if (parameter.type) {
                    typeName = utils.formatTypeName((isArgs ? "..." : "") + parameter.type.getFullText().trim());
                }
                else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(name)) {
                    typeName = this._getHungarianNotationType(name);
                }
            }
            sb.append("@param ");
            if (includeTypes()) {
                sb.append(typeName + " ");
            }
            if (isOptional) {
                sb.append("[");
            }
            sb.append(name);
            if (parameter.initializer && typeName) {
                sb.append("=" + parameter.initializer.getText());
            }
            if (isOptional) {
                sb.append("]");
            }
            sb.appendLine();
        });
    }
    _isHungarianNotation(name) {
        return /^[abefimos][A-Z]/.test(name);
    }
    _getHungarianNotationType(name) {
        switch (name.charAt(0)) {
            case "a": return "{Array}";
            case "b": return "{boolean}";
            case "e": return "{Object}"; // Enumeration
            case "f": return "{function}";
            case "i": return "{number}";
            case "m": return "{Object}"; // Map
            case "o": return "{Object}";
            case "s": return "{string}";
            default: return "{any}";
        }
    }
    _emitConstructorDeclaration(sb, node) {
        sb.appendLine(`Creates an instance of ${node.parent.name.getText()}.`);
        sb.appendLine();
        this._emitParameters(sb, node);
        this._emitMemberOf(sb, node.parent);
    }
    _emitTypeParameters(sb, node) {
        if (!node.typeParameters) {
            return;
        }
        node.typeParameters.forEach(parameter => {
            sb.appendLine(`@template ${parameter.name.getText()}`);
        });
    }
    _emitHeritageClauses(sb, node) {
        if (!node.heritageClauses || !includeTypes()) {
            return;
        }
        node.heritageClauses.forEach((clause) => {
            const heritageType = clause.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";
            clause.types.forEach(t => {
                let tn = t.expression.getText();
                if (t.typeArguments) {
                    tn += "<";
                    tn += t.typeArguments.map(a => a.getText()).join(", ");
                    tn += ">";
                }
                sb.append(`${heritageType} ${utils.formatTypeName(tn)}`);
                sb.appendLine();
            });
        });
    }
    _emitModifiers(sb, node) {
        if (!node.modifiers) {
            return;
        }
        node.modifiers.forEach(modifier => {
            switch (modifier.kind) {
                case ts.SyntaxKind.ExportKeyword:
                    sb.appendLine("@export");
                    return;
                case ts.SyntaxKind.AbstractKeyword:
                    sb.appendLine("@abstract");
                    return;
                case ts.SyntaxKind.ProtectedKeyword:
                    sb.appendLine("@protected");
                    return;
                case ts.SyntaxKind.PrivateKeyword:
                    sb.appendLine("@private");
                    return;
                case ts.SyntaxKind.StaticKeyword:
                    sb.appendLine("@static");
                    return;
            }
        });
    }
    dispose() {
        if (this._outputChannel) {
            this._outputChannel.dispose();
        }
        this._services.dispose();
    }
}
exports.Documenter = Documenter;
//# sourceMappingURL=documenter.js.map