"use strict";
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var clangMode_1 = require('./clangMode');
var clangPath_1 = require('./clangPath');
var sax = require('sax');
var ClangDocumentFormattingEditProvider = (function () {
    function ClangDocumentFormattingEditProvider() {
        this.defaultConfigure = {
            executable: 'clang-format',
            style: 'file',
            fallbackStyle: 'none'
        };
    }
    ClangDocumentFormattingEditProvider.prototype.provideDocumentFormattingEdits = function (document, options, token) {
        return this.doFormatDocument(document, null, options, token);
    };
    ClangDocumentFormattingEditProvider.prototype.provideDocumentRangeFormattingEdits = function (document, range, options, token) {
        return this.doFormatDocument(document, range, options, token);
    };
    ClangDocumentFormattingEditProvider.prototype.getEdits = function (document, xml, codeContent) {
        return new Promise(function (resolve, reject) {
            var options = { trim: false, normalize: false, loose: true };
            var parser = sax.parser(true, options);
            var edits = [];
            var currentEdit;
            var codeBuffer = new Buffer(codeContent);
            // encoding position cache
            var codeByteOffsetCache = {
                byte: 0,
                offset: 0
            };
            var byteToOffset = function (editInfo) {
                var offset = editInfo.offset;
                var length = editInfo.length;
                if (offset >= codeByteOffsetCache.byte) {
                    editInfo.offset = codeByteOffsetCache.offset + codeBuffer.slice(codeByteOffsetCache.byte, offset).toString('utf8').length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                }
                else {
                    editInfo.offset = codeBuffer.slice(0, offset).toString('utf8').length;
                    codeByteOffsetCache.byte = offset;
                    codeByteOffsetCache.offset = editInfo.offset;
                }
                editInfo.length = codeBuffer.slice(offset, offset + length).toString('utf8').length;
                return editInfo;
            };
            parser.onerror = function (err) {
                reject(err.message);
            };
            parser.onopentag = function (tag) {
                if (currentEdit) {
                    reject("Malformed output");
                }
                switch (tag.name) {
                    case "replacements":
                        return;
                    case "replacement":
                        currentEdit = {
                            length: parseInt(tag.attributes['length'].toString()),
                            offset: parseInt(tag.attributes['offset'].toString()),
                            text: ''
                        };
                        byteToOffset(currentEdit);
                        break;
                    default:
                        reject("Unexpected tag " + tag.name);
                }
            };
            parser.ontext = function (text) {
                if (!currentEdit) {
                    return;
                }
                currentEdit.text = text;
            };
            parser.onclosetag = function (tagName) {
                if (!currentEdit) {
                    return;
                }
                var start = document.positionAt(currentEdit.offset);
                var end = document.positionAt(currentEdit.offset + currentEdit.length);
                var editRange = new vscode.Range(start, end);
                edits.push(new vscode.TextEdit(editRange, currentEdit.text));
                currentEdit = null;
            };
            parser.onend = function () {
                resolve(edits);
            };
            parser.write(xml);
            parser.end();
        });
    };
    /// Get execute name in clang-format.executable, if not found, use default value
    /// If configure has changed, it will get the new value
    ClangDocumentFormattingEditProvider.prototype.getExecutableName = function () {
        var execPath = vscode.workspace.getConfiguration('clang-format').get('executable');
        if (execPath) {
            return execPath;
        }
        return this.defaultConfigure.executable;
    };
    ClangDocumentFormattingEditProvider.prototype.getStyle = function (document) {
        var ret = vscode.workspace.getConfiguration('clang-format').get("language." + document.languageId + ".style");
        if (ret.trim()) {
            return ret.trim();
        }
        ret = vscode.workspace.getConfiguration('clang-format').get('style');
        if (ret && ret.trim()) {
            return ret.trim();
        }
        else {
            return this.defaultConfigure.style;
        }
    };
    ClangDocumentFormattingEditProvider.prototype.getFallbackStyle = function (document) {
        var strConf = vscode.workspace.getConfiguration('clang-format').get("language." + document.languageId + ".fallbackStyle");
        if (strConf.trim()) {
            return strConf;
        }
        strConf = vscode.workspace.getConfiguration('clang-format').get('fallbackStyle');
        if (strConf.trim()) {
            return strConf;
        }
        return this.defaultConfigure.style;
    };
    ClangDocumentFormattingEditProvider.prototype.doFormatDocument = function (document, range, options, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var filename = document.fileName;
            var formatCommandBinPath = clangPath_1.getBinPath(_this.getExecutableName());
            var codeContent = document.getText();
            var childCompleted = function (err, stdout, stderr) {
                try {
                    if (err && err.code == "ENOENT") {
                        vscode.window.showInformationMessage("The '" + formatCommandBinPath + "' command is not available.  Please check your clang.formatTool user setting and ensure it is installed.");
                        return resolve(null);
                    }
                    if (err) {
                        return reject("Cannot format due to syntax errors.");
                    }
                    var dummyProcessor = function (value) {
                        debugger;
                        return value;
                    };
                    return resolve(_this.getEdits(document, stdout, codeContent));
                }
                catch (e) {
                    reject(e);
                }
            };
            var formatArgs = [
                '-output-replacements-xml',
                ("-style=" + _this.getStyle(document)),
                ("-fallback-style=" + _this.getFallbackStyle(document)),
                ("-assume-filename=" + document.fileName),
            ];
            if (range) {
                var offset = document.offsetAt(range.start);
                var length = document.offsetAt(range.end) - offset;
                // fix charater length to byte length
                length = Buffer.byteLength(codeContent.substr(offset, length), 'utf8');
                // fix charater offset to byte offset
                offset = Buffer.byteLength(codeContent.substr(0, offset), 'utf8');
                formatArgs.push("-offset=" + offset, "-length=" + length);
            }
            var workingPath = vscode.workspace.rootPath;
            ;
            if (!document.isUntitled) {
                workingPath = path.dirname(document.fileName);
            }
            var child = cp.execFile(formatCommandBinPath, formatArgs, { cwd: workingPath }, childCompleted);
            child.stdin.end(codeContent);
            if (token) {
                token.onCancellationRequested(function () {
                    child.kill();
                    reject("Cancelation requested");
                });
            }
        });
    };
    ClangDocumentFormattingEditProvider.prototype.formatDocument = function (document) {
        return this.doFormatDocument(document, null, null, null);
    };
    return ClangDocumentFormattingEditProvider;
}());
exports.ClangDocumentFormattingEditProvider = ClangDocumentFormattingEditProvider;
var diagnosticCollection;
function activate(ctx) {
    var formatter = new ClangDocumentFormattingEditProvider();
    var availableLanguages = {};
    clangMode_1.MODES.forEach(function (mode) {
        ctx.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(mode, formatter));
        ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(mode, formatter));
        availableLanguages[mode.language] = true;
    });
    // TODO: This is really ugly.  I'm not sure we can do better until
    // Code supports a pre-save event where we can do the formatting before
    // the file is written to disk.	
    // @see https://github.com/Microsoft/vscode-go/blob/master/src/goMain.ts
    var ignoreNextSave = new WeakSet();
    vscode.workspace.onDidSaveTextDocument(function (document) {
        try {
            var formatOnSave = vscode.workspace.getConfiguration('clang-format').get('formatOnSave');
            if (!formatOnSave) {
                return;
            }
            if (!availableLanguages[document.languageId] || ignoreNextSave.has(document)) {
                return;
            }
            var textEditor_1 = vscode.window.activeTextEditor;
            formatter.formatDocument(document).then(function (edits) {
                return textEditor_1.edit(function (editBuilder) {
                    edits.forEach(function (edit) { return editBuilder.replace(edit.range, edit.newText); });
                });
            }).then(function (applied) {
                ignoreNextSave.add(document);
                return document.save();
            }).then(function () {
                ignoreNextSave.delete(document);
            }, function () {
                // Catch any errors and ignore so that we still trigger 
                // the file save.
            });
        }
        catch (e) {
            console.error('formate when save file failed.' + e.toString());
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map