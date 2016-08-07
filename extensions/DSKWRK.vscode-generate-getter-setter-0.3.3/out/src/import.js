"use strict";
var path = require('path');
var vscode = require('vscode');
var fs = require('fs');
(function (ExportType) {
    ExportType[ExportType["NODE"] = 0] = "NODE";
    ExportType[ExportType["TYPING"] = 1] = "TYPING";
    ExportType[ExportType["LOCAL"] = 2] = "LOCAL";
})(exports.ExportType || (exports.ExportType = {}));
var ExportType = exports.ExportType;
//
// the 'magic numbers' which make this extension possible :-)
//
// a quick list of keywords we probably want to skip asap.
var commonKeywordList = ['window', 'dom', 'array', 'from', 'null', 'return', 'get', 'set', 'boolean', 'string', 'if', 'var', 'let', 'const', 'for', 'public', 'class', 'interface', 'new', 'import', 'as', 'private', 'while', 'case', 'switch', 'this', 'function', 'enum'];
// start strings which can be ignored in ts files because they are most likely part of a function/class and will obfuscate the overview
var commonKeywordStartsWith = ['cancel', 'build', 'finish', 'merge', 'clamp', 'construct', 'native', 'clear', 'update', 'parse', 'sanitize', 'render', 'has', 'equal', 'dispose', 'create', 'as', 'is', 'init', 'process', 'get', 'set'];
// paths to ignore while looking through node_modules 
var commonIgnorePaths = ['esm', 'testing', 'test', 'facade', 'backends'];
// all regexp matchers we use to analyze typescript documents
var matchers = {
    explicitExport: /export(.*)(function|class|type|interface|var|let|const|enum)\s/,
    commonWords: /([.?_:\'\"a-zA-Z0-9]{2,})/g,
    exports: /export[\s]+[\s]?[\=]?[\s]?(function|class|type|interface|var|let|const|enum|[\s]+)*([a-zA-Z_$][0-9a-zA-Z_$]*)[\:|\(|\s|\;\<]/,
    imports: /import[\s]+[\*\{]*[\s]*([a-zA-Z\_\,\s]*)[\s]*[\}]*[\s]*from[\s]*[\'\"]([\S]*)[\'|\"]+/,
    node: /export[\s]+declare[\s]+[a-zA-Z]+[\s]+([a-zA-Z_$][0-9a-zA-Z_$]*)[\:]?[\s]?/,
    typings: /declare[\s]+module[\s]+[\"|\']+([\S]*)[\"|\']+/
};
// search for keywords in the active document and match them with all indexed exports
// filter the list till there are only 'imports' left which we need for this active doc
// optional: add a single non mentioned 'nontype' and it will be mixed with the optimize
function optimizeImports(exports, nonTypedEntry) {
    var filteredExports = filterExports(exports, nonTypedEntry);
    vscode.window.activeTextEditor.edit(function (builder) {
        var lineCount = vscode.window.activeTextEditor.document.lineCount;
        // search for import-lines we can replace instead of adding another bunch of the same lines
        for (var i = 0; i < lineCount; i++) {
            var line = vscode.window.activeTextEditor.document.lineAt(i);
            var matches = line.text.match(matchers.imports);
            if (matches) {
                var _export = containsLibraryName(filteredExports, matches[2]) || containsSanitizedPath(filteredExports, matches[2]);
                if (_export !== null) {
                    var range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i + 1, 0));
                    builder.replace(range, createImportLine(_export));
                    // remove the updated import line from the list ...
                    filteredExports.splice(filteredExports.indexOf(_export), 1);
                    // ... and search for seperate libraryNames with the same exports and remove them (ex. angular has deprecated doubles)
                    var exportedNameList = matches[1].split(',').map(function (item) { return item.trim(); });
                    exportedNameList.forEach(function (name) {
                        var _export = containsExportedName(filteredExports, name);
                        if (_export)
                            filteredExports.splice(filteredExports.indexOf(_export), 1);
                    });
                }
            }
        }
        // all filtered exportes left are added as new imports
        for (var i = 0; i < filteredExports.length; i++) {
            builder.replace(new vscode.Position(0, 0), createImportLine(filteredExports[i]));
        }
    });
}
exports.optimizeImports = optimizeImports;
// filter (ex. all exports found in the workspace) againt the active/open file in the editor
// create a list of imports needed based on words found in the open file
function filterExports(exports, _nonTypedEntry) {
    var currentDir = path.parse(vscode.window.activeTextEditor.document.fileName).dir;
    var filteredExports = [];
    // if nontyped is set add the entry on forehand
    // this entry is probably import only and not used yet within the document
    // (ex. aded with the add-import menu function)
    if (_nonTypedEntry) {
        var entry = containsExportedName(exports, _nonTypedEntry) || containsAsName(exports, _nonTypedEntry);
        if (entry) {
            var _export = cloneFromExport(currentDir, entry);
            _export.exported.push(_nonTypedEntry);
            if (_export)
                filteredExports.push(_export);
        }
    }
    var file = {
        currentPos: vscode.window.activeTextEditor.selection.active,
        fileName: vscode.window.activeTextEditor.document.fileName,
        libraryName: path.parse(vscode.window.activeTextEditor.document.fileName).name,
        lineCount: vscode.window.activeTextEditor.document.lineCount
    };
    for (var i = 0; i < file.lineCount; i++) {
        // quick filters to skip lines fast without analyzing
        // import lines, comment lines or continues comment lines (wildcards) can be quick skipped.
        // no need to spend our precious cpu cycles :-)
        if (vscode.window.activeTextEditor.document.lineAt(i).isEmptyOrWhitespace)
            continue;
        var line = vscode.window.activeTextEditor.document.lineAt(i).text.trim();
        if (line.startsWith('import') || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))
            continue;
        if (line.indexOf('//') !== -1)
            line = line.split('//')[0];
        var matches = line.match(matchers.commonWords);
        if (!matches)
            continue;
        // walk through each found common word on this line
        for (var j = 0; j < matches.length; j++) {
            // only process unquoted words which are not listed in the commonList
            if (matches[j].indexOf('\'') === -1 &&
                matches[j].indexOf('\"') === -1 &&
                checkIfValid(matches[j])) {
                // split method calls based on the dot, no need to sub-minimatch
                // we use intellisens for that :)
                var splitted = matches[j].split('.');
                var _word = splitted.length > 0 ? splitted[0] : matches[j];
                // now search the exports for this word
                for (var k = 0; k < exports.length; k++) {
                    // do not process exported items from this same file
                    if (exports[k].libraryName === file.libraryName)
                        continue;
                    if ((exports[k].type === ExportType.LOCAL && exports[k].exported.indexOf(_word) !== -1) ||
                        (exports[k].type === ExportType.TYPING && _word === exports[k].asName) ||
                        (exports[k].type === ExportType.NODE && exports[k].exported.indexOf(_word) !== -1)) {
                        // check if the import was already added and this is an extra import from
                        // the same library (add it to exported) else add a new import to the list
                        var _export = containsLibraryName(filteredExports, exports[k].libraryName);
                        if (_export === null) {
                            _export = cloneFromExport(currentDir, exports[k]);
                            if (_export)
                                filteredExports.push(_export);
                        }
                        // typing is a wildcard import, no need to add submodules
                        if (_export.type !== ExportType.TYPING) {
                            if (_export.exported.indexOf(_word) === -1)
                                _export.exported.push(_word);
                        }
                    }
                }
            }
        }
    }
    return filteredExports;
}
// analyze all typescript (.ts) files within the workspace including
// node_modules and typings, this is promised and runs in he background
function analyzeWorkspace() {
    return new Promise(function (resolve, reject) {
        var includeNode = vscode.workspace.getConfiguration('genGetSet').get('importNode');
        var includeTypings = vscode.workspace.getConfiguration('genGetSet').get('importTypings');
        vscode.workspace.findFiles('**/*.ts', '').then(function (files) {
            if (files === undefined)
                return reject();
            var exports = [];
            for (var i = 0; i < files.length; i++) {
                // globally analyze the found .ts file and load all data for
                // a line to line analyzes
                var file = {
                    path: path.parse(files[i].fsPath),
                    lines: fs.readFileSync(files[i].fsPath).toString().split(/(\r?\n)/g),
                    dts: files[i].fsPath.endsWith('.d.ts')
                };
                // analyze files based on their EType
                if (file.dts &&
                    file.path.dir.indexOf('typings' + path.sep) !== -1 &&
                    includeTypings) {
                    // Process d.ts files from the Typings directory
                    // they describe pure javascript node_modules with a 'module' tag
                    for (var k = 0; k < file.lines.length; k++) {
                        var line = file.lines[k];
                        var matches = line.match(matchers.typings);
                        if (matches && matches[1]) {
                            var asName = createAsName(matches[1].toString());
                            // don't add doubles (can happen) this is not yet supported
                            // TODO: make the system understand doubles (popup menu selection?)
                            if (containsAsName(exports, asName) === null) {
                                var _export = {
                                    libraryName: matches[1].toString(),
                                    path: file.path.dir,
                                    type: ExportType.TYPING,
                                    asName: asName
                                };
                                exports.push(_export);
                            }
                        }
                    }
                }
                else if (file.dts &&
                    file.path.dir.indexOf('node_modules' + path.sep) !== -1 &&
                    includeNode) {
                    // skip common directories where we do not need to look
                    var validPath = true;
                    for (var z = 0; z < commonIgnorePaths.length; z++) {
                        if (file.path.dir.indexOf(path.sep + commonIgnorePaths[z]) !== -1)
                            validPath = false;
                    }
                    // Process node_modules like Angular2 etc.
                    // these libraries contain their own d.ts files with 'export declares'
                    if (validPath) {
                        var _export = {
                            libraryName: constructNodeLibraryName(file.path),
                            path: file.path.dir,
                            type: ExportType.NODE,
                            exported: []
                        };
                        for (var k = 0; k < file.lines.length; k++) {
                            var line = file.lines[k];
                            var matches = line.match(matchers.node);
                            if (matches &&
                                checkIfValid(matches[1], line)) {
                                _export.exported.push(matches[1]);
                            }
                        }
                        exports.push(_export);
                    }
                }
                else if (!file.dts &&
                    file.path.dir.indexOf('node_modules/') === -1 &&
                    file.path.dir.indexOf('typings/') === -1) {
                    // Process local .ts files
                    // these are your own source files who import by path
                    var _export = {
                        libraryName: file.path.name,
                        path: file.path.dir,
                        type: ExportType.LOCAL,
                        exported: []
                    };
                    for (var k = 0; k < file.lines.length; k++) {
                        var line = file.lines[k];
                        var matches = line.match(matchers.exports);
                        if (matches &&
                            checkIfValid(matches[2], line)) {
                            _export.exported.push(matches[2]);
                        }
                    }
                    exports.push(_export);
                }
            }
            resolve(exports);
        }, function (err) {
            reject(err);
        });
    });
}
exports.analyzeWorkspace = analyzeWorkspace;
// instead of a very-deep-analyzing of all d.ts files within the node_module dir:
// a thoughtfull 'hack' to go down a path in the module
// when we hit a index.d.ts we know this is (probably) the import 'libraryName'
// ...this can't be true for all cases, but for ionic and angular it's ok for now :)
function constructNodeLibraryName(_path) {
    var tree = _path.dir.split(path.sep);
    var node = tree.indexOf('node_modules') + 1;
    for (var i = tree.length; i >= node; i--) {
        var constructedPath = '/';
        for (var j = 0; j < i; j++) {
            constructedPath = constructedPath + tree[j] + '/';
        }
        var files = fs.readdirSync(constructedPath);
        if (files.indexOf('index.d.ts') !== -1) {
            var returnPath = '';
            for (var j = node; j < i; j++) {
                returnPath = returnPath + (returnPath === '' ? '' : '/') + tree[j];
            }
            return returnPath;
        }
    }
    return null;
}
// build the import line based on the given IExport
// there is a custom setting for using ' or "
function createImportLine(_export) {
    var pathStringDelimiter = vscode.workspace.getConfiguration('genGetSet').get('pathStringDelimiter') || '\'';
    var txt = 'import ';
    if (_export.type === ExportType.LOCAL ||
        _export.type === ExportType.NODE) {
        txt += '{';
        for (var i = 0; i < _export.exported.length; i++) {
            if (i != 0)
                txt += ', ';
            txt += _export.exported[i];
        }
        txt += '} from ';
        var p = void 0;
        if (_export.type === ExportType.LOCAL)
            p = sanitizePath(_export.path, _export.libraryName);
        if (_export.type === ExportType.NODE)
            p = _export.libraryName;
        // sometimes exports are not correct due to the underlaying system
        // if 'p' is null this is a string indication :-)
        if (p) {
            txt += pathStringDelimiter + p + pathStringDelimiter;
        }
        else {
            return;
        }
    }
    else if (_export.type === ExportType.TYPING) {
        txt += '* as ' + _export.asName + ' from ';
        txt += pathStringDelimiter + _export.libraryName + pathStringDelimiter;
    }
    txt += ';\n';
    return txt;
}
// based on the location of the open file create a relative path
// to the imported file
function sanitizePath(p, n) {
    var prefix = !p.startsWith('.') ? '.' + path.sep : '';
    var pathComplete = prefix + path.join(p, n);
    // on windows* change the slashes to '/' for cross-platform compatibility
    if (path.sep === '\\') {
        pathComplete = pathComplete.replace(/\\/g, '/');
    }
    return pathComplete;
}
function createAsName(name) {
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
}
function checkIfValid(word, line) {
    var explicitMatch = line ? line.match(matchers.explicitExport) : null;
    if (commonKeywordList.indexOf(word) === -1) {
        for (var i = 0; i < commonKeywordStartsWith.length; i++) {
            if (word.startsWith(commonKeywordStartsWith[i]) && !explicitMatch) {
                return false;
            }
        }
        return true;
    }
    return false;
}
function cloneFromExport(_currentDir, _export) {
    var _path = path.relative(_currentDir, _export.path);
    if (_path !== null && _path !== 'null') {
        return {
            libraryName: _export.libraryName,
            type: _export.type,
            path: _path,
            asName: _export.asName,
            exported: []
        };
    }
    return null;
}
// A bunch of functions used to easily search through the IExport[] lists
// can probably be optimized for speed ;)
function containsAsName(exports, asName) {
    for (var i = 0; i < exports.length; i++) {
        if (exports[i].asName === asName)
            return exports[i];
    }
    return null;
}
function containsLibraryName(exports, libraryName) {
    for (var i = 0; i < exports.length; i++) {
        if (exports[i].libraryName === libraryName)
            return exports[i];
    }
    return null;
}
function containsSanitizedPath(exports, _path) {
    for (var i = 0; i < exports.length; i++) {
        if (sanitizePath(exports[i].path, exports[i].libraryName) === _path)
            return exports[i];
    }
    return null;
}
function containsExportedName(exports, _name) {
    for (var i = 0; i < exports.length; i++) {
        if (exports[i].exported) {
            if (exports[i].exported.indexOf(_name) !== -1)
                return exports[i];
        }
    }
    return null;
}
//# sourceMappingURL=import.js.map