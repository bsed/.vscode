"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "markdown-toc" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.markdownToc', function () { new TocGenerator().process(); });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
var TocGenerator = (function () {
    function TocGenerator() {
        this.minLevel = 2;
        this.maxLevel = 4;
        this.addNumbering = true;
        this.addAnchor = true;
        this._toc = "";
        this._tocStartLine = "<!-- vscode-markdown-toc -->";
        this._tocEndLine = "<!-- /vscode-markdown-toc -->";
    }
    TocGenerator.prototype.process = function () {
        var _this = this;
        var headers = new Array();
        var tocStartLineNumber = 0;
        var tocEndLineNumber = 0;
        var editor = vscode.window.activeTextEditor;
        var doc = editor.document;
        var numLines = doc.lineCount;
        var levels = new Array();
        for (var index = this.minLevel; index <= this.maxLevel; index++) {
            levels.push(0);
        }
        var insideTripleBacktickCodeBlock = false;
        for (var lineNumber = 0; lineNumber < numLines; lineNumber++) {
            var aLine = doc.lineAt(lineNumber);
            //Ignore empty lines
            if (aLine.isEmptyOrWhitespace)
                continue;
            //Ignore pre-formatted code blocks in the markdown
            if (aLine.firstNonWhitespaceCharacterIndex > 3)
                continue;
            var lineText = aLine.text.trim();
            // Locate if toc was already generated
            if (lineText.startsWith(this._tocStartLine)) {
                tocStartLineNumber = lineNumber;
                continue;
            }
            else if (lineText.startsWith(this._tocEndLine)) {
                tocEndLineNumber = lineNumber;
                continue;
            }
            //If we are within a triple-backtick code blocks, then ignore
            if (lineText.startsWith("```")) {
                if (insideTripleBacktickCodeBlock)
                    continue;
                insideTripleBacktickCodeBlock = !insideTripleBacktickCodeBlock;
            }
            if (lineText.startsWith("#")) {
                var headerLevel = lineText.indexOf(" ");
                if (headerLevel >= this.minLevel && headerLevel <= this.maxLevel) {
                    var level = headerLevel - (this.maxLevel - this.minLevel);
                    var previousLevel = headers.length > 3 ? headers[headers.length - 2].level : this.maxLevel;
                    var title = lineText.substring(headerLevel + 1);
                    var endAnchor = "</a>";
                    // Remove anchor in the title
                    if (title.indexOf(endAnchor) > 0) {
                        title = title.substring(title.indexOf(endAnchor) + endAnchor.length);
                    }
                    // Have to reset the sublevels
                    if (level < previousLevel) {
                        for (var index = level; index < previousLevel; index++) {
                            levels[index + 1] = 0;
                        }
                    }
                    // increment current level
                    levels[level]++;
                    headers.push(new Header(level, title, copyObject(levels), lineNumber, lineText.length, headers.length));
                }
            }
        }
        var tocSummary = "";
        tocSummary = tocSummary.concat(this._tocStartLine + "\r\n");
        headers.forEach(function (header) {
            var tocLine = "";
            for (var i = 0; i < header.level; i++) {
                tocLine = tocLine.concat("\t");
            }
            tocLine = tocLine.concat("*");
            if (_this.addNumbering) {
                var numbering = _this.buildNumbering(header.numbering);
                if (numbering != "") {
                    tocLine = tocLine.concat(numbering);
                }
            }
            if (_this.addAnchor) {
                tocLine = tocLine.concat(" [" + header.title + "](#" + header.anchor + ")");
            }
            else {
                tocLine = tocLine.concat(" " + header.title);
            }
            if (tocLine != null && tocLine != "") {
                tocSummary = tocSummary.concat(tocLine + "\n");
            }
        });
        tocSummary = tocSummary.concat("\n" + this._tocEndLine);
        console.log(tocSummary);
        editor.edit(function (editBuilder) {
            headers.forEach(function (header) {
                var lineText = "";
                for (var index = 0; index < (header.level + _this.maxLevel - _this.minLevel); index++) {
                    lineText = lineText.concat('#');
                }
                if (_this.addNumbering) {
                    lineText = lineText.concat(" " + _this.buildNumbering(header.numbering));
                }
                lineText = lineText.concat(" ");
                if (_this.addAnchor) {
                    lineText = lineText.concat("<a name='" + header.anchor + "'></a>");
                }
                lineText = lineText.concat(header.title);
                editBuilder.replace(new vscode.Range(header.lineNumber, 0, header.lineNumber, header.lineLength), lineText);
            });
            if (tocStartLineNumber + tocEndLineNumber == 0) {
                editBuilder.insert(new vscode.Position(0, 0), tocSummary);
            }
            else {
                editBuilder.replace(new vscode.Range(tocStartLineNumber, 0, tocEndLineNumber, _this._tocEndLine.length), tocSummary);
            }
            return Promise.resolve();
        });
        doc.save();
    };
    TocGenerator.prototype.buildNumbering = function (numberings) {
        var numbering = " ";
        var lastLevel = (this.maxLevel - this.minLevel);
        for (var i = 0; i <= lastLevel; i++) {
            if (numberings[i] > 0) {
                numbering = numbering.concat(numberings[i] + ".");
            }
        }
        return numbering;
    };
    return TocGenerator;
}());
exports.TocGenerator = TocGenerator;
function copyObject(object) {
    var objectCopy = {};
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            objectCopy[key] = object[key];
        }
    }
    return objectCopy;
}
/**
 * Header
 */
var Header = (function () {
    function Header(headerLevel, title, levels, lineNumber, lineLength, index) {
        this.level = headerLevel;
        this.title = title;
        this.numbering = levels;
        this.lineNumber = lineNumber;
        this.lineLength = lineLength;
        this.anchor = title.replace(/[^a-z0-9\-_:\.]|^[^a-z]+/gi, "") + "-" + index;
    }
    return Header;
}());
//# sourceMappingURL=extension.js.map