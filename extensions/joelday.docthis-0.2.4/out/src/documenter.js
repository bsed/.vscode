var vs = require("vscode");
var ts = require("typescript");
var utils = require("./utilities");
var languageServiceHost_1 = require("./languageServiceHost");
var Documenter = (function () {
    function Documenter() {
        this._languageServiceHost = new languageServiceHost_1.LanguageServiceHost();
        this._services = ts.createLanguageService(this._languageServiceHost, ts.createDocumentRegistry());
        this._program = this._services.getProgram();
    }
    Documenter.prototype.documentThis = function (editor, edit, commandName) {
        var selection = editor.selection;
        var caret = selection.start;
        var sourceFile = this._getSourceFile(editor.document);
        var position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        var node = utils.findChildForPosition(sourceFile, position);
        var documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current caret position");
            return;
        }
        var sb = new utils.StringBuilder();
        var docLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
        }
        else {
            this._showFailureMessage(commandName, "at the current caret position");
        }
    };
    Documenter.prototype.documentEverything = function (editor, edit, visibleOnly, commandName) {
        var _this = this;
        var sourceFile = this._getSourceFile(editor.document);
        var documentable = visibleOnly ? utils.findVisibleChildrenOfKind(sourceFile) : utils.findChildrenOfKind(sourceFile);
        var showFailure = false;
        documentable.forEach(function (node) {
            var sb = new utils.StringBuilder();
            var docLocation = _this._documentNode(sb, node, editor, sourceFile);
            if (docLocation) {
                _this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
            }
            else {
                showFailure = true;
            }
            sourceFile = _this._getSourceFile(editor.document);
        });
        if (showFailure) {
            this._showFailureMessage(commandName, "for everything in the document");
        }
    };
    Documenter.prototype.traceNode = function (editor, edit) {
        var selection = editor.selection;
        var caret = selection.start;
        var sourceFile = this._getSourceFile(editor.document);
        var position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        var node = utils.findChildForPosition(sourceFile, position);
        var nodes = [];
        var parent = node;
        while (parent) {
            nodes.push(this._printNodeInfo(parent, sourceFile));
            parent = parent.parent;
        }
        var sb = new utils.StringBuilder();
        nodes.reverse().forEach(function (n) {
            sb.appendLine(n);
        });
        if (!this._outputChannel) {
            this._outputChannel = vs.window.createOutputChannel("TypeScript Syntax Node Trace");
        }
        this._outputChannel.show();
        this._outputChannel.appendLine(sb.toString());
    };
    Documenter.prototype._printNodeInfo = function (node, sourceFile) {
        var sb = new utils.StringBuilder();
        sb.appendLine(node.getStart() + " to " + node.getEnd() + " --- (" + node.kind + ") " + ts.SyntaxKind[node.kind]);
        var column = sourceFile.getLineAndCharacterOfPosition(node.getStart()).character;
        for (var i = 0; i < column; i++) {
            sb.append(" ");
        }
        sb.appendLine(node.getText());
        return sb.toString();
    };
    Documenter.prototype._showFailureMessage = function (commandName, condition) {
        vs.window.showErrorMessage("Sorry! '" + commandName + "' wasn't able to produce documentation " + condition + ".");
    };
    Documenter.prototype._insertDocumentation = function (sb, position, editor, edit, sourceFile) {
        var location = new vs.Position(position.line, position.character);
        var indentStartLocation = new vs.Position(position.line, 0);
        var indent = editor.document.getText(new vs.Range(indentStartLocation, location));
        edit.insert(location, sb.toCommentString(indent));
        var newText = editor.document.getText();
        sourceFile.update(newText, {
            newLength: newText.length,
            span: {
                start: 0,
                length: newText.length
            }
        });
    };
    Documenter.prototype._getSourceFile = function (document) {
        var fileName = utils.fixWinPath(document.fileName);
        var fileText = document.getText();
        this._languageServiceHost.setCurrentFile(fileName, fileText);
        return this._services.getSourceFile(fileName);
    };
    Documenter.prototype._documentNode = function (sb, node, editor, sourceFile) {
        switch (node.kind) {
            case 214 /* ClassDeclaration */:
                this._emitClassDeclaration(sb, node);
                break;
            case 141 /* PropertyDeclaration */:
            case 140 /* PropertySignature */:
            case 145 /* GetAccessor */:
            case 146 /* SetAccessor */:
                this._emitPropertyDeclaration(sb, node);
                break;
            case 215 /* InterfaceDeclaration */:
                this._emitInterfaceDeclaration(sb, node);
                break;
            case 217 /* EnumDeclaration */:
                this._emitEnumDeclaration(sb, node);
                break;
            case 247 /* EnumMember */:
                sb.appendLine("(description)");
                break;
            case 213 /* FunctionDeclaration */:
            case 143 /* MethodDeclaration */:
            case 142 /* MethodSignature */:
                this._emitMethodDeclaration(sb, node);
                break;
            case 144 /* Constructor */:
                this._emitConstructorDeclaration(sb, node);
                break;
            case 173 /* FunctionExpression */:
            case 174 /* ArrowFunction */:
                return this._emitFunctionExpression(sb, node, sourceFile);
            default:
                return;
        }
        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    };
    Documenter.prototype._emitFunctionExpression = function (sb, node, sourceFile) {
        var targetNode = node.parent;
        if (node.parent.kind !== 245 /* PropertyAssignment */ &&
            node.parent.kind !== 181 /* BinaryExpression */) {
            targetNode = utils.findFirstParent(targetNode, [212 /* VariableDeclarationList */]);
            if (!targetNode) {
                return;
            }
        }
        sb.appendLine("(description)");
        sb.appendLine();
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
    };
    Documenter.prototype._emitClassDeclaration = function (sb, node) {
        sb.appendLine("(description)");
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@class " + node.name.getText());
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    };
    Documenter.prototype._emitPropertyDeclaration = function (sb, node) {
        sb.appendLine("(description)");
        sb.appendLine();
        if (node.kind === 145 /* GetAccessor */) {
            var name = utils.findFirstChildOfKindDepthFirst(node, [69 /* Identifier */]).getText();
            var parentClass = node.parent;
            var hasSetter = !!parentClass.members.find(function (c) { return c.kind === 146 /* SetAccessor */ &&
                utils.findFirstChildOfKindDepthFirst(c, [69 /* Identifier */]).getText() === name; });
            if (!hasSetter) {
                sb.appendLine("@readonly");
            }
        }
        this._emitModifiers(sb, node);
        if (node.type) {
            sb.append("@type " + utils.formatTypeName(node.type.getText()));
        }
    };
    Documenter.prototype._emitInterfaceDeclaration = function (sb, node) {
        sb.appendLine("(description)");
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@interface " + node.name.text);
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    };
    Documenter.prototype._emitEnumDeclaration = function (sb, node) {
        sb.appendLine("(description)");
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@enum {number}");
    };
    Documenter.prototype._emitMethodDeclaration = function (sb, node) {
        sb.appendLine("(description)");
        sb.appendLine();
        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
    };
    Documenter.prototype._emitReturns = function (sb, node) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.append("@returns");
            if (node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            sb.appendLine(" (description)");
        }
    };
    Documenter.prototype._emitParameters = function (sb, node) {
        if (!node.parameters)
            return;
        node.parameters.forEach(function (parameter) {
            var name = parameter.name.getText();
            var isOptional = parameter.questionToken || parameter.initializer;
            var isArgs = !!parameter.dotDotDotToken;
            var initializerValue = parameter.initializer ? parameter.initializer.getText() : null;
            var typeName = null;
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
            sb.append("@param ");
            if (typeName) {
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
            sb.appendLine(" (description)");
        });
    };
    Documenter.prototype._emitConstructorDeclaration = function (sb, node) {
        sb.appendLine("Creates an instance of " + node.parent.name.getText() + ".");
        sb.appendLine();
        this._emitParameters(sb, node);
    };
    Documenter.prototype._emitTypeParameters = function (sb, node) {
        if (!node.typeParameters)
            return;
        node.typeParameters.forEach(function (parameter) {
            sb.appendLine("@template " + parameter.name.getText());
        });
    };
    Documenter.prototype._emitHeritageClauses = function (sb, node) {
        if (!node.heritageClauses)
            return;
        node.heritageClauses.forEach(function (clause) {
            var heritageType = clause.token === 83 /* ExtendsKeyword */ ? "@extends" : "@implements";
            clause.types.forEach(function (t) {
                var tn = t.expression.getText();
                if (t.typeArguments) {
                    tn += "<";
                    tn += t.typeArguments.map(function (a) { return a.getText(); }).join(", ");
                    tn += ">";
                }
                sb.append(heritageType + " " + utils.formatTypeName(tn));
                sb.appendLine();
            });
        });
    };
    Documenter.prototype._emitModifiers = function (sb, node) {
        if (!node.modifiers)
            return;
        node.modifiers.forEach(function (modifier) {
            switch (modifier.kind) {
                case 82 /* ExportKeyword */:
                    sb.appendLine("@export");
                    return;
                case 115 /* AbstractKeyword */:
                    sb.appendLine("@abstract");
                    return;
                case 111 /* ProtectedKeyword */:
                    sb.appendLine("@protected");
                    return;
                case 110 /* PrivateKeyword */:
                    sb.appendLine("@private");
                    return;
                case 113 /* StaticKeyword */:
                    sb.appendLine("@static");
                    return;
            }
        });
    };
    Documenter.prototype.dispose = function () {
        if (this._outputChannel) {
            this._outputChannel.dispose();
        }
        this._services.dispose();
    };
    return Documenter;
})();
exports.Documenter = Documenter;
//# sourceMappingURL=documenter.js.map