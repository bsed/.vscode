"use strict";
var vscode = require('vscode');
var tsregex = {
    klass: /class\s([a-zA-Z]+)/,
    private_def: /[\s]*private[\s]*([a-zA-Z_$][0-9a-zA-Z_$]*)[\s]?\:[\s]?([\.\<\>\{\}\[\]a-zA-Z_$\s<>,]+)[\=|\;]/,
    get_method: /public[\s]get[\s]([a-zA-Z_$][0-9a-zA-Z_$]*)[\(\)]+/,
    set_method: /public[\s]set[\s]([a-zA-Z_$][0-9a-zA-Z_$]*)[\(]+[a-zA-Z_$][0-9a-zA-Z_$]*[\s\:]+/,
    expose_def: /export[\s]+[\=]?[\s]?[a-zA-Z]*[\s]+([a-zA-Z_$][0-9a-zA-Z_$]*)[\(|\s|\;]/
};
function createMatcher(language) {
    var classic = vscode.workspace.getConfiguration('genGetSet').get('classic');
    var qmatch = language.toLowerCase() + (classic ? '-classic' : '');
    console.log(qmatch);
    switch (qmatch) {
        case 'typescript':
            // these are the default for typescript
            return {
                klass: tsregex.klass,
                private_def: tsregex.private_def,
                get_method: tsregex.get_method,
                set_method: tsregex.set_method,
                expose_def: tsregex.expose_def,
                gen_constructor: function (items) {
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
                },
                gen_getter: function (item) {
                    return '\n\tpublic get ' + item.figure + '(): ' + item.typeName + ' {\n' +
                        '\t\treturn this.' + item.name + ';\n' +
                        '\t}\n';
                },
                gen_setter: function (item) {
                    return '\n\tpublic set ' + item.figure + '(value: ' + item.typeName + ') {\n' +
                        '\t\tthis.' + item.name + ' = value;\n' +
                        '\t}\n';
                },
                figure: function (fname) {
                    if (fname.startsWith('_'))
                        return fname.substring(1);
                    return '$' + fname;
                }
            };
        case 'typescript-classic':
            // these are the default for typescript
            return {
                klass: tsregex.klass,
                private_def: tsregex.private_def,
                get_method: tsregex.get_method,
                set_method: tsregex.set_method,
                expose_def: tsregex.expose_def,
                gen_constructor: function (items) {
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
                },
                gen_getter: function (item) {
                    return '\n\tpublic get' + item.name.charAt(0).toUpperCase() + item.name.substring(1) + '(): ' + item.typeName + ' {\n' +
                        '\t\treturn this.' + item.name + ';\n' +
                        '\t}\n';
                },
                gen_setter: function (item) {
                    return '\n\tpublic set' + item.name.charAt(0).toUpperCase() + item.name.substring(1) + '(value: ' + item.typeName + ') {\n' +
                        '\t\tthis.' + item.name + ' = value;\n' +
                        '\t}\n';
                },
                figure: function (fname) {
                    return fname;
                }
            };
        // add your own list of regex / building blocks for other languages
        default:
            return null;
    }
}
exports.createMatcher = createMatcher;
//# sourceMappingURL=matchers.js.map