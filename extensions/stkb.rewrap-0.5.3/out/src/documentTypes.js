"use strict";
var path_1 = require('path');
var BasicLanguage_1 = require('./BasicLanguage');
var Markdown_1 = require('./Markdown');
var Sgml_1 = require('./Sgml');
/** Gets a DocumentProcessor for a document, taken from its file type */
function wrappingHandler(doc) {
    var extPattern = path_1.extname(doc.fileName) ? path_1.extname(doc.fileName) + '.' : null, langIdPattern = '.' + doc.languageId + '.';
    for (var _i = 0, _a = Object.keys(languages); _i < _a.length; _i++) {
        var langs = _a[_i];
        if (langs.includes(extPattern) || langs.includes(langIdPattern)) {
            return languages[langs];
        }
    }
    return new Markdown_1.default();
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wrappingHandler;
/** Map of languages to comment start/end/line patterns. Mostly uses the file
 *  extension to get the language but in some cases (eg dockerfile) the
 *  languageId has to be used instead. */
var languages = { '.bat.': new BasicLanguage_1.default({ line: '(?:rem|::)' }),
    '.c.cpp.cs.css.go.groovy.hpp.h.java.js.jsx.less.m.sass.shader.swift.ts.tsx.': new BasicLanguage_1.default({ start: '\\/\\*\\*?', end: '\\*\\/', line: '\\/{2,3}' }),
    '.coffee.': new BasicLanguage_1.default({ start: '###\\*?', end: '###', line: '#' }),
    '.dockerfile.makefile.perl.r.shellscript.yaml.': 
    // These all seem not to have standard multi-line comments
    new BasicLanguage_1.default({ line: '#' }),
    '.elm.hs.purs.': new BasicLanguage_1.default({ start: '{-', end: '-}', line: '--' }),
    '.fs.': new BasicLanguage_1.default({ start: '\\(\\*', end: '\\*\\)', line: '\\/\\/' }),
    '.html.xml.xsl.': new Sgml_1.default(),
    '.ini.': new BasicLanguage_1.default({ line: ';' }),
    '.jade.': 
    // Jade block comments are a bit different and might need some more thought
    new BasicLanguage_1.default({ line: '\\/\\/' }),
    '.lua.': new BasicLanguage_1.default({ start: '--\\[\\[', end: '\\]\\]', line: '--' }),
    '.p6.perl6.rb.': new BasicLanguage_1.default({ start: '^=begin', end: '^=end', line: '#' }),
    '.php.': new BasicLanguage_1.default({ start: '\\/\\*', end: '\\*\\/', line: '(?:\\/\\/|#)' }),
    '.powershell.ps1.': new BasicLanguage_1.default({ start: '<#', end: '#>', line: '#' }),
    '.py.python.': new BasicLanguage_1.default({ start: "'''", end: "'''", line: '#' }),
    '.rust.': new BasicLanguage_1.default({ line: '\\/{2}(?:\\/|\\!)?' }),
    '.sql.': new BasicLanguage_1.default({ start: '\\/\\*', end: '\\*\\/', line: '--' }),
    '.vb.': new BasicLanguage_1.default({ line: "'" })
};
//# sourceMappingURL=documentTypes.js.map