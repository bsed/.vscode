"use strict";
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
exports.modeId = 'typescript';
var SuggestImport = (function () {
    function SuggestImport() {
        var _this = this;
        this.exclude_libs = ['node'];
        this.commonList = ['from', 'return', 'get', 'set', 'boolean', 'string', 'if', 'var', 'let', 'for', 'public', 'class', 'new', 'import', 'as', 'private', 'while', 'case', 'switch', 'this'];
        this.exposeCache = null;
        this.ready = false;
        this.regex_words = /([.?_:\'\"a-zA-Z]{2,})/g;
        this.regex_export = /export[\s]+[\s]?[\=]?[\s]?[a-zA-Z]*[\s]*(enum|)[\s]*([a-zA-Z_$][0-9a-zA-Z_$]*)[\:|\(|\s|\;]/;
        this.regex_import = /import[\s]+[\*\{]*[\s]*[a-zA-Z\,\s]*[\s]*[\}]*[\s]*from[\s]*[\'\"]([\S]*)[\'|\"]+/;
        this.regex_module = /declare[\s]+module[\s]+[\"|\']+([\S]*)[\"|\']+/;
        this.scanFiles().then(function (exposes) {
            console.log('found ' + exposes.length + ' exposes');
            _this.exposeCache = exposes;
            _this.ready = true;
        });
    }
    SuggestImport.prototype.refreshCache = function () {
        var _this = this;
        this.scanFiles().then(function (exposes) {
            _this.exposeCache = exposes;
        });
    };
    SuggestImport.prototype.resolveCompletionItem = function (item, token) {
        return item;
    };
    SuggestImport.prototype.provideCompletionItems = function (document, position, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var provideCompletion = vscode.workspace.getConfiguration('genGetSet').get('provideCompletion');
            if (provideCompletion) {
                while (!_this.ready) { } // ugh, should change...
                if (_this.ready)
                    resolve(_this.toItemArray());
            }
            else {
                resolve([]);
            }
        });
    };
    SuggestImport.prototype.importAssist = function () {
        var _this = this;
        var languageId = vscode.window.activeTextEditor.document.languageId;
        if (languageId !== 'typescript') {
            vscode.window.showWarningMessage('Sorry, this extension does not support current language.');
            return;
        }
        vscode.window.activeTextEditor.edit(function (editBuilder) {
            // loop through all import lines and replace them if needed
            var list = _this.createList();
            var lineCount = vscode.window.activeTextEditor.document.lineCount;
            for (var i = 0; i < lineCount; i++) {
                var line = vscode.window.activeTextEditor.document.lineAt(i);
                var matcher = line.text.match(_this.regex_import);
                // replace matched lines with new imports
                if (matcher) {
                    for (var j = list.length - 1; j >= 0; j--) {
                        if ((!list[j].dict && matcher[1] === _this.sanitizePath(list[j].path, list[j].name)) ||
                            (list[j].dict && matcher[1] === list[j].name)) {
                            var range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i + 1, 0));
                            editBuilder.replace(range, _this.createLine(list.splice(j, 1)[0]));
                            break;
                        }
                    }
                }
            }
            // add rest of (new) import lines to the list
            var wildcard = vscode.workspace.getConfiguration('genGetSet').get('importTypings');
            for (var j = 0; j < list.length; j++) {
                // don't parse excluded libs (like internal node)
                if (_this.exclude_libs.indexOf(list[j].name) == -1) {
                    // only parse wildcard dict lines when the setting is enabled
                    if (!list[j].dict || (list[j].dict && wildcard)) {
                        var pos = new vscode.Position(0, 0);
                        editBuilder.insert(pos, _this.createLine(list[j]));
                    }
                }
            }
        });
    };
    /**
     * Create the import line based on the IExpose
     */
    SuggestImport.prototype.createLine = function (expose) {
        var pathStringDelimiter = vscode.workspace.getConfiguration('genGetSet').get('pathStringDelimiter') || '\'';
        var txt = 'import ';
        if (!expose.dict) {
            // normal import from personal exports
            txt += '{';
            for (var i = 0; i < expose.exported.length; i++) {
                if (i != 0)
                    txt += ', ';
                txt += expose.exported[i];
            }
            txt += '} from ';
            txt += pathStringDelimiter + this.sanitizePath(expose.path, expose.name) + pathStringDelimiter;
        }
        else {
            txt += '* as ' + expose.dict_name + ' from ';
            txt += pathStringDelimiter + expose.name + pathStringDelimiter;
        }
        txt += ';\n';
        return txt;
    };
    /**
     * Calculate the correct path to the file based on the file open in the editor
     * And also think about the platform (*nix, windows..)
     */
    SuggestImport.prototype.sanitizePath = function (p, n) {
        var prefix = !p.startsWith('.') ? '.' + path.sep : '';
        var pathComplete = prefix + path.join(p, n);
        // TODO have to review this setting..
        if (vscode.workspace.getConfiguration('genGetSet').get('useSlashForImportPath')) {
            pathComplete = pathComplete.replace(/\\/g, '/');
        }
        return pathComplete;
    };
    /**
     * Analyze the current opened file
     * get all keywords to match with exported IExpose-cached items
     * and return a list of actual imports
     */
    SuggestImport.prototype.createList = function () {
        var list = [];
        var pos = vscode.window.activeTextEditor.selection.active;
        var fname = vscode.window.activeTextEditor.document.fileName;
        var cname = path.parse(fname).name;
        var lineCount = vscode.window.activeTextEditor.document.lineCount;
        // loop through all keywords within the document
        for (var i = 0; i < lineCount; i++) {
            if (vscode.window.activeTextEditor.document.lineAt(i).isEmptyOrWhitespace)
                continue;
            var line = vscode.window.activeTextEditor.document.lineAt(i).text.trim();
            // some fast common checks (whitespace, comment) cleanup
            if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))
                continue;
            if (line.indexOf('//') !== -1)
                line = line.split('//')[0];
            // do not try to match with common keywords (for speed)
            var matches = line.match(this.regex_words);
            if (!matches)
                continue;
            for (var j = 0; j < matches.length; j++) {
                if (matches[j].indexOf('\'') == -1 && matches[j].indexOf('\"') == -1 && this.commonList.indexOf(matches[j]) == -1) {
                    // filter away the long concatinated '.' function calls
                    var splitted = matches[j].split('.');
                    var cword = splitted.length > 0 ? splitted[0] : matches[j];
                    for (var k = 0; k < this.exposeCache.length; k++) {
                        // do not process when the import is within the open file
                        if (this.exposeCache[k].name !== cname) {
                            // check if the keyword is in the exported list of the processItemResult
                            // or if it matches a dict typing name
                            if ((!this.exposeCache[k].dict && this.exposeCache[k].exported.indexOf(cword) !== -1) ||
                                (this.exposeCache[k].dict && cword === this.exposeCache[k].dict_name)) {
                                var found = false;
                                // search through the defined list if we already added an export for this keyword
                                // instead of directly add another import (to prevent doubles)
                                for (var l = 0; l < list.length; l++) {
                                    if (list[l].name === this.exposeCache[k].name) {
                                        if (list[l].exported.indexOf(cword) == -1)
                                            list[l].exported.push(cword);
                                        found = true;
                                        break;
                                    }
                                }
                                // expose wasn't in the list yet - create a new entry and push the new keyword into the list
                                if (!found) {
                                    var dir = path.parse(vscode.window.activeTextEditor.document.fileName).dir;
                                    list.push({
                                        name: this.exposeCache[k].name,
                                        path: this.exposeCache[k].dict ? null : path.relative(dir, this.exposeCache[k].path),
                                        exported: [cword],
                                        dict: this.exposeCache[k].dict,
                                        dict_name: this.exposeCache[k].dict_name
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        return list;
    };
    SuggestImport.prototype.scanFiles = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // scan all .ts files in the workspace and skip some common directories
            //var excluded: string[] = ['/typings/'];
            vscode.workspace.findFiles('**/*.ts', '').then(function (files) {
                var exposes = [];
                for (var i = 0; i < files.length; i++) {
                    var parsedPath = path.parse(files[i].fsPath);
                    var data = fs.readFileSync(files[i].fsPath);
                    var lines = data.toString().split(/(\r?\n)/g);
                    var dict = files[i].fsPath.endsWith('.d.ts');
                    if (!dict) {
                        // parse a normal file use the filename when imported
                        var expose = {
                            name: parsedPath.name,
                            path: parsedPath.dir,
                            exported: [],
                            dict: dict
                        };
                        // walk through all lines of code and search for 'export' statements with the regex
                        for (var k = 0; k < lines.length; k++) {
                            var line = lines[k];
                            var matches = line.match(_this.regex_export);
                            if (matches) {
                                expose.exported.push(matches[2]);
                            }
                        }
                        exposes.push(expose);
                    }
                    else {
                        // parse a "d.ts" file search for module declarations"
                        var sub = void 0;
                        for (var k = 0; k < lines.length; k++) {
                            var line = lines[k];
                            var mmatches = line.match(_this.regex_module);
                            if (mmatches) {
                                if (sub) {
                                    sub.end = k;
                                    var asname = _this.asName(sub.name);
                                    if (!_this.contains(exposes, asname))
                                        exposes.push(_this.subMatchModule(sub.name, asname, sub.start, sub.end, lines));
                                }
                                sub = { name: mmatches[1].toString(), start: k, end: lines.length };
                            }
                        }
                        // only add a dict entry if it is non-existing in the list
                        // there are most of the time multiple 'd.ts' files in the filesystem because of npm/typings
                        if (sub) {
                            var asname = _this.asName(sub.name);
                            if (!_this.contains(exposes, asname))
                                exposes.push(_this.subMatchModule(sub.name, asname, sub.start, sub.end, lines));
                        }
                    }
                }
                resolve(exposes);
            }, function (err) {
                reject(err);
            });
        });
    };
    SuggestImport.prototype.contains = function (list, asname) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].dict_name === asname)
                return true;
        }
        return false;
    };
    // create the 'as' name for the import based on the dashes used by npm
    // instead of a dash make one upperase letter like 'body-parser' becomes 'bodyParser'
    SuggestImport.prototype.asName = function (name) {
        var asname = '';
        for (var i = 0; i < name.length; i++) {
            if (name.charAt(i) == '-') {
                i++;
                asname += name.charAt(i).toUpperCase();
            }
            else {
                asname += name.charAt(i).toLowerCase();
            }
        }
        return asname;
    };
    SuggestImport.prototype.subMatchModule = function (name, asname, start, end, lines) {
        var expose = {
            name: name,
            exported: [],
            dict: true,
            dict_name: asname
        };
        for (var k = start; k < end; k++) {
            var line = lines[k];
            var matches = line.match(this.regex_export);
            if (matches) {
                var n = asname + '.' + matches[1];
                if (expose.exported.indexOf(n) == -1)
                    expose.exported.push(n);
            }
        }
        return expose;
    };
    SuggestImport.prototype.toItemArray = function () {
        var items = [];
        for (var i = 0; i < this.exposeCache.length; i++) {
            for (var j = 0; j < this.exposeCache[i].exported.length; j++) {
                var item = new vscode.CompletionItem(this.exposeCache[i].exported[j]);
                item.detail =
                    this.exposeCache[i].path ? this.exposeCache[i].path.substring(vscode.workspace.rootPath.length) + this.exposeCache[i].name : this.exposeCache[i].dict_name;
                item.kind = vscode.CompletionItemKind.Reference;
                items.push(item);
            }
        }
        return items;
    };
    return SuggestImport;
}());
exports.SuggestImport = SuggestImport;
//# sourceMappingURL=suggest.js.map