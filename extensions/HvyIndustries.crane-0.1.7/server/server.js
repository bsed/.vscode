/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_languageserver_1 = require('vscode-languageserver');
var treeBuilder_1 = require("./hvy/treeBuilder");
var glob = require("glob");
var fs = require("fs");
var connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
var documents = new vscode_languageserver_1.TextDocuments();
documents.listen(connection);
var treeBuilder = new treeBuilder_1.TreeBuilder();
var workspaceTree = [];
var workspaceRoot;
connection.onInitialize(function (params) {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', ':', '$', '>']
            }
        }
    };
});
// hold the maxNumberOfProblems setting
var maxNumberOfProblems;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(function (change) {
    var settings = change.settings;
    maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
    // Revalidate any open text documents
    //documents.all().forEach(validateTextDocument);
});
// Use this to send a request to the client
// https://github.com/Microsoft/vscode/blob/80bd73b5132268f68f624a86a7c3e56d2bbac662/extensions/json/client/src/jsonMain.ts
// https://github.com/Microsoft/vscode/blob/580d19ab2e1fd6488c3e515e27fe03dceaefb819/extensions/json/server/src/server.ts
//connection.sendRequest()
connection.onDidChangeWatchedFiles(function (change) {
    // Monitored files have change in VSCode
    connection.console.log('We recevied an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion(function (textDocumentPosition) {
    if (textDocumentPosition.languageId != "php")
        return;
    var line = textDocumentPosition.position.line;
    var char = textDocumentPosition.position.character;
    // Lookup what the last char typed was
    var doc = documents.get(textDocumentPosition.uri);
    var text = doc.getText();
    var lines = text.split(/\r\n|\r|\n/gm);
    var currentLine = lines[line];
    var lastChar = currentLine[char - 1];
    var filePath = buildDocumentPath(textDocumentPosition.uri);
    var toReturn = [];
    workspaceTree.forEach(function (item) {
        // Only add these top level when last char != ">"
        if (lastChar != ">") {
            // TODO -- Find last occurance of "->" and load suggestions (this will match cases of half entered props and methods)
            if (lastChar == "$") {
                // Only load these if they're in the same file
                if (item.path == filePath) {
                    // TODO -- Only show these if we're either not in a function/class
                    //         or if we're calling "global" to import them (or they've already been imported)
                    item.topLevelVariables.forEach(function (node) {
                        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Variable, detail: "global variable" });
                    });
                }
            }
            else if (lastChar == ":") {
                // Get static methods, properties, consts declared in scope
                if (currentLine.substr(char - 6, char - 1) === "self::") {
                    if (item.path == filePath) {
                        item.classes.forEach(function (node) { return addStaticClassMembers(toReturn, node); });
                    }
                    addStaticGlobalVariables(toReturn, item);
                }
                else {
                    if (currentLine.substr(char - 6, char - 1) !== " self:") {
                        // We're calling via ClassName::
                        lookupClassAndAddStaticMembers(toReturn, currentLine);
                    }
                }
            }
            else {
                addClassTraitInterfaceNames(toReturn, item);
            }
            // Only load these if they're in the same file
            if (item.path == filePath) {
                addFileLevelFuncsAndConsts(toReturn, item);
            }
            // Add parameters for functions and class methods
            item.functions.forEach(function (func) {
                if (func.startPos.line <= line && func.endPos.line >= line) {
                    func.params.forEach(function (param) {
                        toReturn.push({ label: param.name, kind: vscode_languageserver_1.CompletionItemKind.Property, detail: "parameter" });
                    });
                    func.globalVariables.forEach(function (globalVar) {
                        toReturn.push({ label: globalVar, kind: vscode_languageserver_1.CompletionItemKind.Variable, detail: "global variable" });
                    });
                }
            });
            item.classes.forEach(function (classNode) {
                if (classNode.startPos.line <= line && classNode.endPos.line >= line) {
                    classNode.methods.forEach(function (method) {
                        if (method.startPos.line <= line && method.endPos.line >= line) {
                            method.params.forEach(function (param) {
                                toReturn.push({ label: param.name, kind: vscode_languageserver_1.CompletionItemKind.Property, detail: "parameter" });
                            });
                            method.globalVariables.forEach(function (globalVar) {
                                toReturn.push({ label: globalVar, kind: vscode_languageserver_1.CompletionItemKind.Variable, detail: "global variable" });
                            });
                        }
                    });
                    if (classNode.construct != null) {
                        if (classNode.construct.startPos.line <= line && classNode.construct.endPos.line >= line) {
                            classNode.construct.params.forEach(function (param) {
                                toReturn.push({ label: param.name, kind: vscode_languageserver_1.CompletionItemKind.Property, detail: "parameter" });
                            });
                            classNode.construct.globalVariables.forEach(function (globalVar) {
                                toReturn.push({ label: globalVar, kind: vscode_languageserver_1.CompletionItemKind.Variable, detail: "global variable" });
                            });
                        }
                    }
                }
            });
        }
        else {
            recurseMethodCalls(toReturn, item, currentLine, line, lines, filePath);
        }
    });
    return toReturn;
});
function lookupClassAndAddStaticMembers(toReturn, currentLine) {
    // Get the class name to lookup
    var words = currentLine.split("::");
    // Break out if we're not in a valid call
    if (words.length == 1 && words[0].indexOf("::") === -1)
        return;
    var name = words[words.length - 2];
    var className = name.trim();
    var classNode = getClassNodeFromTree(className);
    if (classNode != null) {
        addStaticClassMembers(toReturn, classNode);
    }
}
function addStaticClassMembers(toReturn, item) {
    item.constants.forEach(function (subNode) {
        // if (subNode.isStatic) {
        // }
    });
    item.properties.forEach(function (subNode) {
        if (subNode.isStatic) {
            var found = false;
            toReturn.forEach(function (returnItem) {
                if (returnItem.label == subNode.name) {
                    found = true;
                }
            });
            // Strip the leading $
            var insertText = subNode.name.substr(1, subNode.name.length - 1);
            if (!found) {
                toReturn.push({ label: subNode.name, kind: vscode_languageserver_1.CompletionItemKind.Property, detail: "property (static)", insertText: insertText });
            }
        }
    });
    item.methods.forEach(function (subNode) {
        if (subNode.isStatic) {
            var found = false;
            toReturn.forEach(function (returnItem) {
                if (returnItem.label == subNode.name) {
                    found = true;
                }
            });
            if (!found) {
                toReturn.push({ label: subNode.name, kind: vscode_languageserver_1.CompletionItemKind.Method, detail: "method (static)", insertText: subNode.name + "()" });
            }
        }
    });
}
function addStaticGlobalVariables(toReturn, item) {
}
function recurseMethodCalls(toReturn, item, currentLine, line, lines, filePath) {
    var wordsWithoutTabs = currentLine.replace(/\t/gm, " ");
    var words = wordsWithoutTabs.split(" ");
    var expression = words[words.length - 1];
    if (expression.lastIndexOf("$this", 0) === 0 ||
        expression.lastIndexOf("($this", 0) === 0 ||
        expression.lastIndexOf("if($this", 0) === 0 ||
        expression.lastIndexOf("elseif($this", 0) === 0 ||
        expression.lastIndexOf("!$this", 0) === 0) {
        // We're referencing the current class
        item.classes.forEach(function (classNode) {
            // NOTE -- This filepath checking works for $this, but won't for class instance variables
            if (item.path == filePath && classNode.startPos.line <= line && classNode.endPos.line >= line) {
                addClassPropertiesMethodsParentClassesAndTraits(toReturn, classNode, false);
            }
        });
    }
    else {
        // TODO -- Handle class instance variables and properties
        if (expression.indexOf("->") === 0) {
            // Track back and check we're accessing $this at some point
            var prevLine = lines[line - 1];
            var prevWords = prevLine.split(" ");
            var prevexpression = prevWords[prevWords.length - 1];
            // Recurse
            recurseMethodCalls(toReturn, item, prevLine, line - 1, lines, filePath);
        }
    }
}
function addClassTraitInterfaceNames(toReturn, item) {
    item.classes.forEach(function (node) {
        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Class, detail: "class" });
    });
    item.traits.forEach(function (node) {
        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Module, detail: "trait" });
    });
    item.interfaces.forEach(function (node) {
        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Interface, detail: "interface" });
    });
}
function addFileLevelFuncsAndConsts(toReturn, item) {
    item.constants.forEach(function (node) {
        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Value, detail: "constant" });
    });
    item.functions.forEach(function (node) {
        toReturn.push({ label: node.name, kind: vscode_languageserver_1.CompletionItemKind.Function, detail: "function", insertText: node.name + "()" });
    });
}
function addClassPropertiesMethodsParentClassesAndTraits(toReturn, classNode, isParentClass) {
    classNode.constants.forEach(function (subNode) {
        toReturn.push({ label: subNode.name, kind: vscode_languageserver_1.CompletionItemKind.Value, detail: "constant" });
    });
    classNode.methods.forEach(function (subNode) {
        var accessModifier = "method " + buildAccessModifier(subNode.accessModifier);
        var insertText = subNode.name + "()";
        if (!isParentClass || (isParentClass && subNode.accessModifier != 1)) {
            toReturn.push({ label: subNode.name, kind: vscode_languageserver_1.CompletionItemKind.Method, detail: accessModifier, insertText: insertText });
        }
    });
    classNode.properties.forEach(function (subNode) {
        var accessModifier = "property " + buildAccessModifier(subNode.accessModifier);
        // Strip the leading $
        var insertText = subNode.name.substr(1, subNode.name.length - 1);
        if (!isParentClass || (isParentClass && subNode.accessModifier != 1)) {
            toReturn.push({ label: subNode.name, kind: vscode_languageserver_1.CompletionItemKind.Property, detail: accessModifier, insertText: insertText });
        }
    });
    classNode.traits.forEach(function (traitName) {
        // Look up the trait node in the tree
        var traitNode = getTraitNodeFromTree(traitName);
        if (traitNode != null) {
            addClassPropertiesMethodsParentClassesAndTraits(toReturn, traitNode, false);
        }
    });
    if (classNode.extends != null && classNode.extends != "") {
        // Look up the class node in the tree
        var extendedClassNode = getClassNodeFromTree(classNode.extends);
        if (extendedClassNode != null) {
            addClassPropertiesMethodsParentClassesAndTraits(toReturn, extendedClassNode, true);
        }
    }
}
function buildAccessModifier(modifier) {
    switch (modifier) {
        case 0:
            return "(public)";
        case 1:
            return "(private)";
        case 2:
            return "(protected)";
    }
    return "";
}
function buildDocumentPath(uri) {
    var path = uri;
    path = path.replace("file:///", "");
    path = path.replace("%3A", ":");
    // Handle Windows and Unix paths
    switch (process.platform) {
        case 'darwin':
            path = "/" + path;
            break;
        case 'win32':
            path = path.replace(/\//g, "\\");
            break;
    }
    return path;
}
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(function (item) {
    // TODO
    // if (item.data === 1) {
    //     item.detail = 'TypeScript details',
    //     item.documentation = 'TypeScript documentation'
    // } else if (item.data === 2) {
    //     item.detail = 'JavaScript details',
    //     item.documentation = 'JavaScript documentation'
    // }
    return item;
});
var requestType = { method: "buildObjectTreeForDocument" };
connection.onRequest(requestType, function (requestObj) {
    var fileUri = requestObj.path;
    var text = requestObj.text;
    treeBuilder.Parse(text, fileUri).then(function (result) {
        addToWorkspaceTree(result.tree);
        notifyClientOfWorkComplete();
        return true;
    })
        .catch(function (error) {
        console.log(error);
        notifyClientOfWorkComplete();
        return false;
    });
});
var requestType = { method: "buildObjectTreeForWorkspace" };
connection.onRequest(requestType, function (data) {
    // Load all PHP files in workspace
    glob("/**/*.php", { cwd: workspaceRoot, root: workspaceRoot }, function (err, fileNames) {
        var docsToDo = fileNames;
        var docsDoneCount = 0;
        docsToDo.forEach(function (docPath) {
            fs.readFile(docPath, { encoding: "utf8" }, function (err, data) {
                treeBuilder.Parse(data, docPath).then(function (result) {
                    addToWorkspaceTree(result.tree);
                    docsDoneCount++;
                    if (docsToDo.length == docsDoneCount) {
                        notifyClientOfWorkComplete();
                    }
                })
                    .catch(function (error) {
                    connection.console.log(error);
                    notifyClientOfWorkComplete();
                });
            });
        });
    });
});
function addToWorkspaceTree(tree) {
    // Loop through existing filenodes and replace if exists, otherwise add
    var fileNode = workspaceTree.filter(function (fileNode) {
        return fileNode.path == tree.path;
    })[0];
    var index = workspaceTree.indexOf(fileNode);
    if (index !== -1) {
        workspaceTree[index] = tree;
    }
    else {
        workspaceTree.push(tree);
    }
    // Debug
    connection.console.log("Parsed file: " + tree.path);
}
function getClassNodeFromTree(className) {
    var toReturn = null;
    var fileNode = workspaceTree.forEach(function (fileNode) {
        fileNode.classes.forEach(function (classNode) {
            if (classNode.name.toLowerCase() == className.toLowerCase()) {
                toReturn = classNode;
            }
        });
    });
    return toReturn;
}
function getTraitNodeFromTree(traitName) {
    var toReturn = null;
    var fileNode = workspaceTree.forEach(function (fileNode) {
        fileNode.traits.forEach(function (traitNode) {
            if (traitNode.name.toLowerCase() == traitName.toLowerCase()) {
                toReturn = traitNode;
            }
        });
    });
    return toReturn;
}
function notifyClientOfWorkComplete() {
    var requestType = { method: "workDone" };
    connection.sendRequest(requestType);
}
connection.listen();
//# sourceMappingURL=server.js.map