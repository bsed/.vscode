"use strict";
const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const clangMode_1 = require('./clangMode');
const clangPath_1 = require('./clangPath');
const sax = require('sax');
class ClangDocumentFormattingEditProvider {
    constructor() {
        this.defaultConfigure = {
            executable: 'clang-format',
            style: 'file',
            fallbackStyle: 'none'
        };
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.doFormatDocument(document, null, options, token);
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        return this.doFormatDocument(document, range, options, token);
    }
    getEdits(document, xml, codeContent) {
        return new Promise((resolve, reject) => {
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
            parser.onerror = (err) => {
                reject(err.message);
            };
            parser.onopentag = (tag) => {
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
                        reject(`Unexpected tag ${tag.name}`);
                }
            };
            parser.ontext = (text) => {
                if (!currentEdit) {
                    return;
                }
                currentEdit.text = text;
            };
            parser.onclosetag = (tagName) => {
                if (!currentEdit) {
                    return;
                }
                var start = document.positionAt(currentEdit.offset);
                var end = document.positionAt(currentEdit.offset + currentEdit.length);
                var editRange = new vscode.Range(start, end);
                edits.push(new vscode.TextEdit(editRange, currentEdit.text));
                currentEdit = null;
            };
            parser.onend = () => {
                resolve(edits);
            };
            parser.write(xml);
            parser.end();
        });
    }
    /// Get execute name in clang-format.executable, if not found, use default value
    /// If configure has changed, it will get the new value
    getExecutableName() {
        let execPath = vscode.workspace.getConfiguration('clang-format').get('executable');
        if (execPath) {
            return execPath;
        }
        return this.defaultConfigure.executable;
    }
    getStyle(document) {
        let ret = vscode.workspace.getConfiguration('clang-format').get(`language.${document.languageId}.style`);
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
    }
    getFallbackStyle(document) {
        let strConf = vscode.workspace.getConfiguration('clang-format').get(`language.${document.languageId}.fallbackStyle`);
        if (strConf.trim()) {
            return strConf;
        }
        strConf = vscode.workspace.getConfiguration('clang-format').get('fallbackStyle');
        if (strConf.trim()) {
            return strConf;
        }
        return this.defaultConfigure.style;
    }
    doFormatDocument(document, range, options, token) {
        return new Promise((resolve, reject) => {
            var filename = document.fileName;
            var formatCommandBinPath = clangPath_1.getBinPath(this.getExecutableName());
            var codeContent = document.getText();
            var childCompleted = (err, stdout, stderr) => {
                try {
                    if (err && err.code == "ENOENT") {
                        vscode.window.showInformationMessage("The '" + formatCommandBinPath + "' command is not available.  Please check your clang-format.executable user setting and ensure it is installed.");
                        return resolve(null);
                    }
                    if (err) {
                        return reject("Cannot format due to syntax errors.");
                    }
                    var dummyProcessor = (value) => {
                        debugger;
                        return value;
                    };
                    return resolve(this.getEdits(document, stdout, codeContent));
                }
                catch (e) {
                    reject(e);
                }
            };
            var formatArgs = [
                '-output-replacements-xml',
                `-style=${this.getStyle(document)}`,
                `-fallback-style=${this.getFallbackStyle(document)}`,
                `-assume-filename=${document.fileName}`,
            ];
            if (range) {
                var offset = document.offsetAt(range.start);
                var length = document.offsetAt(range.end) - offset;
                // fix charater length to byte length
                length = Buffer.byteLength(codeContent.substr(offset, length), 'utf8');
                // fix charater offset to byte offset
                offset = Buffer.byteLength(codeContent.substr(0, offset), 'utf8');
                formatArgs.push(`-offset=${offset}`, `-length=${length}`);
            }
            var workingPath = vscode.workspace.rootPath;
            ;
            if (!document.isUntitled) {
                workingPath = path.dirname(document.fileName);
            }
            var child = cp.execFile(formatCommandBinPath, formatArgs, { cwd: workingPath }, childCompleted);
            child.stdin.end(codeContent);
            if (token) {
                token.onCancellationRequested(() => {
                    child.kill();
                    reject("Cancelation requested");
                });
            }
        });
    }
    formatDocument(document) {
        return this.doFormatDocument(document, null, null, null);
    }
}
exports.ClangDocumentFormattingEditProvider = ClangDocumentFormattingEditProvider;
let diagnosticCollection;
function activate(ctx) {
    var formatter = new ClangDocumentFormattingEditProvider();
    var availableLanguages = {};
    clangMode_1.MODES.forEach(mode => {
        ctx.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(mode, formatter));
        ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(mode, formatter));
        availableLanguages[mode.language] = true;
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map