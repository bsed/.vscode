"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var parse = require("markdown-to-ast").parse;
var DocumentProcessor_1 = require('./DocumentProcessor');
var vscode_1 = require('vscode');
var Section_1 = require('./Section');
var Markdown = (function (_super) {
    __extends(Markdown, _super);
    function Markdown() {
        _super.apply(this, arguments);
    }
    Markdown.prototype.findSections = function (doc) {
        var text = doc.getText(), ast = parse(text);
        var sections = ast.children
            .flatMap(function (c) { return processNode(doc, c); });
        return {
            primary: sections.filter(function (s) { return !(s instanceof SecondarySection); }),
            secondary: sections.filter(function (s) { return s instanceof SecondarySection; }),
        };
    };
    return Markdown;
}(DocumentProcessor_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Markdown;
function processNode(doc, node) {
    switch (node.type) {
        case 'BlockQuote':
        case 'List':
        case 'ListItem':
            return node.children.flatMap(function (c) { return processNode(doc, c); });
        case 'CodeBlock':
            return [codeBlock(doc, node)];
        case 'Paragraph':
            return [paragraph(doc, node)];
        default:
            return [];
    }
}
var SecondarySection = (function (_super) {
    __extends(SecondarySection, _super);
    function SecondarySection() {
        _super.apply(this, arguments);
    }
    return SecondarySection;
}(Section_1.default));
function codeBlock(doc, node) {
    return new SecondarySection(doc, node.loc.start.line - 1, node.loc.end.line - 1);
}
function paragraph(doc, node) {
    return new Section_1.default(doc, node.loc.start.line - 1, node.loc.end.line - 1, /^[\t ]*(([-*+]|\d+[.)]|>)[\t ]+)*/, function (flp) { return flp.replace(/[^\t >]/g, " "); });
}
function range(node) {
    var _a = node.loc, start = _a.start, end = _a.end;
    return new vscode_1.Range(start.line - 1, start.column, end.line - 1, end.column);
}
//# sourceMappingURL=Markdown.js.map