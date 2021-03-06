"use strict";
var vscode = require('vscode');
(function (EType) {
    EType[EType["GETTER"] = 0] = "GETTER";
    EType[EType["SETTER"] = 1] = "SETTER";
    EType[EType["BOTH"] = 2] = "BOTH";
    EType[EType["CONSTRUCTOR"] = 3] = "CONSTRUCTOR";
})(exports.EType || (exports.EType = {}));
var EType = exports.EType;
var matchers = {
    className: /class\s([a-zA-Z]+)/,
    privateDef: /[\s]*private[\s]*([a-zA-Z_$][0-9a-zA-Z_$]*)[\s]?\:[\s]?([\.\<\>\{\}\[\]a-zA-Z_$\s<>,]+)[\=|\;]/,
    getMethod: /public[\s]get[\s]?([a-zA-Z_$][0-9a-zA-Z_$]*)[\(\)]+/,
    setMethod: /public[\s]set[\s]?([a-zA-Z_$][0-9a-zA-Z_$]*)[\(]+[a-zA-Z_$][0-9a-zA-Z_$]*[\s\:]+/
};
// generate code lines into the current active window based on EType
function generateCode(classes, type, pickedItem) {
    var currentPos = new vscode.Position(vscode.window.activeTextEditor.selection.active.line, 0);
    if (type !== EType.CONSTRUCTOR && pickedItem) {
        var _class = getClass(classes, pickedItem.description);
        if (_class) {
            for (var i = 0; i < _class.vars.length; i++) {
                var item = _class.vars[i];
                if (item && pickedItem.label === item.name) {
                    vscode.window.activeTextEditor.edit(function (builder) {
                        // add template code blocks before the cursor position's line number
                        if (type == EType.GETTER || type == EType.BOTH)
                            builder.insert(currentPos, createGetter(item));
                        if (type == EType.SETTER || type == EType.BOTH)
                            builder.insert(currentPos, createSetter(item));
                    });
                }
            }
        }
    }
    else if (type === EType.CONSTRUCTOR) {
        vscode.window.activeTextEditor.edit(function (builder) {
            for (var i = 0; i < classes.length; i++) {
                if (currentPos.isAfterOrEqual(classes[i].startPos) || currentPos.isBeforeOrEqual(classes[i].endPos)) {
                    builder.insert(currentPos, createConstructor(classes[i].vars));
                    return;
                }
            }
        });
    }
}
exports.generateCode = generateCode;
// generate a list of pickable items based on EType
function quickPickItemListFrom(classes, type) {
    var quickPickItemList = [];
    for (var i = 0; i < classes.length; i++) {
        for (var j = 0; j < classes[i].vars.length; j++) {
            quickPickItemList.push({
                label: classes[i].vars[j].name,
                description: classes[i].name,
                detail: classes[i].vars[j].typeName
            });
        }
    }
    return quickPickItemList;
}
exports.quickPickItemListFrom = quickPickItemListFrom;
// scan the current active text window and construct an IClass array
function generateClassesList(type) {
    var classes = [];
    var brackets = {
        name: null,
        within: false,
        open: 0,
        closed: 0
    };
    var currentPos = vscode.window.activeTextEditor.selection.active;
    var lineCount = vscode.window.activeTextEditor.document.lineCount;
    // these are settings which can be adjusted for personal taste
    var scoped = vscode.workspace.getConfiguration('genGetSet').get('scoped');
    var filter = vscode.workspace.getConfiguration('genGetSet').get('filter');
    for (var i = 0; i < lineCount; i++) {
        var line = vscode.window.activeTextEditor.document.lineAt(i);
        // check if we are outside a class (brackets) and a new class definition pops-up
        // when it does we are now within a class def and we can start checking for private variables
        if (!brackets.within && line.text.indexOf('class') != -1) {
            brackets.within = true;
            var matches = line.text.match(matchers.className);
            if (matches)
                brackets.name = matches[1];
            brackets.open = 0;
            brackets.closed = 0;
            classes.push({
                name: brackets.name,
                startPos: new vscode.Position(i, 0),
                vars: [],
                getters: [],
                setters: []
            });
        }
        // within brackets start matching each line for a private variable
        // and add them to the corresponding IClass
        if (brackets.within) {
            var _class = getClass(classes, brackets.name);
            var matches = {
                privateDef: line.text.match(matchers.privateDef),
                getMethod: line.text.match(matchers.getMethod),
                setMethod: line.text.match(matchers.setMethod)
            };
            if (_class &&
                (matches.getMethod || matches.privateDef || matches.setMethod)) {
                // push the found items into the approriate containers
                if (matches.privateDef) {
                    _class.vars.push({
                        name: matches.privateDef[1],
                        figure: publicName(matches.privateDef[1]),
                        typeName: matches.privateDef[2]
                    });
                }
                if (matches.getMethod)
                    _class.getters.push(matches.getMethod[1]);
                if (matches.setMethod)
                    _class.setters.push(matches.setMethod[1]);
            }
            if (line.text.indexOf('{') != -1)
                brackets.open++;
            if (line.text.indexOf('}') != -1)
                brackets.closed++;
            // if the brackets match up we are (maybe) leaving a class definition
            if (brackets.closed != 0 && brackets.open != 0 && brackets.closed == brackets.open) {
                brackets.within = false;
                // no maybe - we were actually within a class
                // check scoped setting: remove all found items if they are not 
                // found within the class where the cursor is positioned
                if (_class) {
                    _class.endPos = new vscode.Position(i, 0);
                    if (scoped &&
                        (currentPos.isBefore(_class.startPos) || currentPos.isAfter(_class.endPos))) {
                        _class.vars = [];
                    }
                    // if filter is enabled: there is also no need to show already added 
                    // getters and setters methods in the list
                    if (filter) {
                        for (var i_1 = _class.vars.length - 1; i_1 >= 0; i_1--) {
                            if (type == EType.GETTER || type == EType.BOTH) {
                                for (var j = 0; j < _class.getters.length; j++) {
                                    console.log(_class.vars[i_1].figure, _class.getters[j]);
                                    if (_class.vars[i_1].figure.toLowerCase() == _class.getters[j].toLowerCase()) {
                                        _class.vars.splice(i_1, 1);
                                        break;
                                    }
                                }
                            }
                            else if (type == EType.SETTER || type == EType.BOTH) {
                                for (var j = 0; j < _class.setters.length; j++) {
                                    if (_class.vars[i_1].figure.toLowerCase() === _class.setters[j].toLowerCase()) {
                                        _class.vars.splice(i_1, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return classes;
}
exports.generateClassesList = generateClassesList;
// convert the private name to a public name
// based on the 'classic' setting, see README.md
function publicName(fname) {
    var classic = vscode.workspace.getConfiguration('genGetSet').get('classic');
    if (classic)
        return fname;
    if (fname.startsWith('_'))
        return fname.substring(1);
    return '$' + fname;
}
function createGetter(item) {
    var classic = vscode.workspace.getConfiguration('genGetSet').get('classic');
    if (classic) {
        return '\n\tpublic get' + item.name.charAt(0).toUpperCase() + item.name.substring(1) + '(): ' + item.typeName + ' {\n' +
            '\t\treturn this.' + item.name + ';\n' +
            '\t}\n';
    }
    else {
        return '\n\tpublic get ' + item.figure + '(): ' + item.typeName + ' {\n' +
            '\t\treturn this.' + item.name + ';\n' +
            '\t}\n';
    }
}
function createSetter(item) {
    var classic = vscode.workspace.getConfiguration('genGetSet').get('classic');
    if (classic) {
        return '\n\tpublic set' + item.name.charAt(0).toUpperCase() + item.name.substring(1) + '(value: ' + item.typeName + ') {\n' +
            '\t\tthis.' + item.name + ' = value;\n' +
            '\t}\n';
    }
    else {
        return '\n\tpublic set ' + item.figure + '(value: ' + item.typeName + ') {\n' +
            '\t\tthis.' + item.name + ' = value;\n' +
            '\t}\n';
    }
}
function createConstructor(items) {
    var c = '\n\tconstructor(';
    var b = false;
    for (var i = 0; i < items.length; i++) {
        if (b)
            c += ', ';
        c += items[i].figure + ': ' + items[i].typeName;
        if (!b)
            b = true;
    }
    c += ') {';
    b = false;
    for (var i = 0; i < items.length; i++) {
        c += '\n\t\tthis.' + items[i].name + ' = ' + items[i].figure + ';';
    }
    c += '\n\t}\n';
    return c;
}
function getClass(items, name) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].name === name) {
            return items[i];
        }
    }
    return null;
}
//# sourceMappingURL=getset.js.map