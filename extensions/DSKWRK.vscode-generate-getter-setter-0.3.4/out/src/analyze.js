"use strict";
var vscode = require('vscode');
var matchers_1 = require('./matchers');
(function (EAction) {
    EAction[EAction["GETTER"] = 0] = "GETTER";
    EAction[EAction["SETTER"] = 1] = "SETTER";
    EAction[EAction["BOTH"] = 2] = "BOTH";
    EAction[EAction["NONE"] = 3] = "NONE";
})(exports.EAction || (exports.EAction = {}));
var EAction = exports.EAction;
function getKlass(items, name) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].name === name) {
            return items[i];
        }
    }
    return null;
}
function toItemList(items) {
    var s = [];
    for (var i = 0; i < items.length; i++) {
        for (var j = 0; j < items[i].items.length; j++) {
            s.push({
                label: items[i].items[j].name,
                description: items[i].name,
                detail: items[i].items[j].typeName
            });
        }
    }
    return s;
}
exports.toItemList = toItemList;
function processItemsConstructor(items) {
    var matcher = matchers_1.createMatcher(vscode.window.activeTextEditor.document.languageId);
    vscode.window.activeTextEditor.edit(function (editBuiler) {
        var pos = new vscode.Position(vscode.window.activeTextEditor.selection.active.line, 0);
        for (var i = 0; i < items.length; i++) {
            if (pos.isAfterOrEqual(items[i].start) || pos.isBeforeOrEqual(items[i].end)) {
                editBuiler.insert(pos, matcher.gen_constructor(items[i].items));
                return;
            }
        }
    });
}
exports.processItemsConstructor = processItemsConstructor;
function processItemResult(items, result, action) {
    var matcher = matchers_1.createMatcher(vscode.window.activeTextEditor.document.languageId);
    if (result && result.description) {
        var klass = getKlass(items, result.description);
        if (klass) {
            for (var i = 0; i < klass.items.length; i++) {
                var item = klass.items[i];
                if (item && result.label === item.name) {
                    vscode.window.activeTextEditor.edit(function (editBuilder) {
                        // add template code blocks before the cursor position's line number
                        var pos = new vscode.Position(vscode.window.activeTextEditor.selection.active.line, 0);
                        if (action == EAction.GETTER || action == EAction.BOTH)
                            editBuilder.insert(pos, matcher.gen_getter(item));
                        if (action == EAction.SETTER || action == EAction.BOTH)
                            editBuilder.insert(pos, matcher.gen_setter(item));
                    });
                }
            }
        }
    }
}
exports.processItemResult = processItemResult;
function scanFile(action) {
    var items = [];
    var matcher = matchers_1.createMatcher(vscode.window.activeTextEditor.document.languageId);
    if (matcher == null) {
        vscode.window.showWarningMessage('Sorry, this extension does not support current language.');
        return;
    }
    var pos = vscode.window.activeTextEditor.selection.active;
    var lineCount = vscode.window.activeTextEditor.document.lineCount;
    var classStart = false;
    var className;
    var bracketCount = { open: 0, closed: 0 };
    // search each line of the active editor for an index of 'class'
    // when found start counting brackets, when they match up and aren't 0
    // we looped through a class
    for (var i = 0; i < lineCount; i++) {
        var line = vscode.window.activeTextEditor.document.lineAt(i);
        if (!classStart && line.text.indexOf('class') != -1) {
            var matches_1 = line.text.match(matcher.klass);
            if (matches_1)
                className = matches_1[1];
            classStart = true;
            bracketCount.open = 0;
            bracketCount.closed = 0;
            items.push({ name: className, start: new vscode.Position(i, 0), items: [], getters: [], setters: [] });
        }
        // within a class regex match for 'private' mentions
        // collect them and add them to the parent 'klass'
        var matches = void 0;
        var klass = getKlass(items, className);
        if (classStart) {
            matches = line.text.match(matcher.private_def);
            if (matches) {
                if (klass)
                    klass.items.push({ name: matches[1], figure: matcher.figure(matches[1]), typeName: matches[2] });
            }
            matches = line.text.match(matcher.get_method);
            if (matches) {
                if (klass)
                    klass.getters.push(matches[1]);
            }
            matches = line.text.match(matcher.set_method);
            if (matches) {
                if (klass)
                    klass.setters.push(matches[1]);
            }
            if (line.text.indexOf('{') != -1)
                bracketCount.open++;
            if (line.text.indexOf('}') != -1)
                bracketCount.closed++;
            if (bracketCount.closed != 0 && bracketCount.open != 0 && bracketCount.closed == bracketCount.open) {
                classStart = false;
                if (klass) {
                    klass.end = new vscode.Position(i, 0);
                    // it's scoped and cursor position is out of range
                    // remove items because we are not positioned within the class
                    if (pos.isBefore(klass.start) || pos.isAfter(klass.end)) {
                        var scoped = vscode.workspace.getConfiguration('genGetSet').get('scoped');
                        if (scoped) {
                            klass.items = [];
                        }
                    }
                    // if hide already added getters setters
                    // remove all already added get/set names
                    var filter = vscode.workspace.getConfiguration('genGetSet').get('filter');
                    if (filter) {
                        for (var i_1 = klass.items.length - 1; i_1 >= 0; i_1--) {
                            if (action == EAction.GETTER || action == EAction.BOTH) {
                                for (var j = 0; j < klass.getters.length; j++) {
                                    if (klass.items[i_1].figure == klass.getters[j]) {
                                        klass.items.splice(i_1, 1);
                                        break;
                                    }
                                }
                            }
                            else if (action == EAction.SETTER || action == EAction.BOTH) {
                                for (var j = 0; j < klass.setters.length; j++) {
                                    if (klass.items[i_1].figure === klass.setters[j]) {
                                        klass.items.splice(i_1, 1);
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
    return items;
}
exports.scanFile = scanFile;
//# sourceMappingURL=analyze.js.map