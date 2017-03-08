'use strict';
// (c) 2016 Ecmel Ercan
const vsc = require("vscode");
const lst = require("vscode-languageserver-types");
const css = require("vscode-css-languageservice");
const fs = require("fs");
const path = require("path");
let service = css.getCSSLanguageService();
let map = {};
let regex = /[\.\#]([\w-]+)/g;
let dot = vsc.CompletionItemKind.Class;
let hash = vsc.CompletionItemKind.Reference;
class Snippet {
    constructor(content, character) {
        this._document = lst.TextDocument.create('', 'css', 1, content);
        this._stylesheet = service.parseStylesheet(this._document);
        this._position = new vsc.Position(this._document.lineCount - 1, character ? character : 0);
    }
    get document() {
        return this._document;
    }
    get stylesheet() {
        return this._stylesheet;
    }
    get position() {
        return this._position;
    }
}
class StyleServer {
    constructor() {
        this.regex = [
            /style=["|']([^"^']*$)/i //,
        ];
    }
    convertCompletionList(list) {
        let ci = [];
        for (let i = 0; i < list.items.length; i++) {
            ci[i] = new vsc.CompletionItem(list.items[i].label);
            ci[i].detail = list.items[i].detail;
            ci[i].documentation = list.items[i].documentation;
            ci[i].filterText = list.items[i].filterText;
            ci[i].insertText = list.items[i].insertText;
            ci[i].kind = list.items[i].kind;
            ci[i].sortText = list.items[i].sortText;
        }
        return new vsc.CompletionList(ci, list.isIncomplete);
    }
    createSnippet(document, position) {
        let start = new vsc.Position(0, 0);
        let range = new vsc.Range(start, position);
        let text = document.getText(range);
        let tag = this.regex[0].exec(text);
        if (tag) {
            return new Snippet('.c {\n' + tag[1], position.character);
        }
        //    tag = this.regex[1].exec(text);
        //    if (tag) {
        //      return new Snippet(tag[1], position.character);
        //    }
        return null;
    }
    provideCompletionItems(document, position, token) {
        let snippet = this.createSnippet(document, position);
        if (snippet) {
            let result = service.doComplete(snippet.document, snippet.position, snippet.stylesheet);
            return this.convertCompletionList(result);
        }
        return null;
    }
    resolveCompletionItem(item, token) {
        return item;
    }
    provideHover(document, position, token) {
        let snippet = this.createSnippet(document, position);
        if (snippet) {
            let result = service.doHover(snippet.document, snippet.position, snippet.stylesheet);
            return new vsc.Hover(result.contents);
        }
        return null;
    }
}
class ClassServer {
    constructor() {
        this.regex = [
            /(class|id)=["|']([^"^']*$)/i,
            /(\.|\#)[^\.^\#^\<^\>]*$/i,
            /<style[\s\S]*>([\s\S]*)<\/style>/ig
        ];
    }
    provideCompletionItems(document, position, token) {
        let start = new vsc.Position(0, 0);
        let range = new vsc.Range(start, position);
        let text = document.getText(range);
        let tag = this.regex[0].exec(text);
        if (!tag) {
            tag = this.regex[1].exec(text);
        }
        if (tag) {
            let internal = [];
            let style;
            while (style = this.regex[2].exec(document.getText())) {
                let snippet = new Snippet(style[1]);
                let symbols = service.findDocumentSymbols(snippet.document, snippet.stylesheet);
                for (let symbol of symbols) {
                    internal.push(symbol);
                }
            }
            pushSymbols('style', internal);
            let items = {};
            for (let key in map) {
                for (let item of map[key]) {
                    items[item.label] = item;
                }
            }
            let id = tag[0].startsWith('id') || tag[0].startsWith('#');
            let ci = [];
            for (let item in items) {
                if ((id && items[item].kind === hash) || !id && items[item].kind === dot) {
                    ci.push(items[item]);
                }
            }
            return new vsc.CompletionList(ci);
        }
        return null;
    }
    resolveCompletionItem(item, token) {
        return null;
    }
}
function pushSymbols(key, symbols) {
    let ci = [];
    for (let i = 0; i < symbols.length; i++) {
        if (symbols[i].kind !== 5) {
            continue;
        }
        let symbol;
        while (symbol = regex.exec(symbols[i].name)) {
            let item = new vsc.CompletionItem(symbol[1]);
            item.kind = symbol[0].startsWith('.') ? dot : hash;
            item.detail = path.basename(key);
            ci.push(item);
        }
    }
    map[key] = ci;
}
function parse(uri) {
    fs.readFile(uri.fsPath, 'utf8', function (err, data) {
        if (err) {
            delete map[uri.fsPath];
        }
        else {
            let doc = lst.TextDocument.create(uri.fsPath, 'css', 1, data);
            let symbols = service.findDocumentSymbols(doc, service.parseStylesheet(doc));
            pushSymbols(uri.fsPath, symbols);
        }
    });
}
function activate(context) {
    if (vsc.workspace.rootPath) {
        let resourceJson = path.resolve(vsc.workspace.rootPath, 'resource.json');
        let resourceJsonPaths = [];
        fs.readFile(resourceJson, 'utf8', function (err, data) {
            let glob = '**/*.css';
            if (err) {
                vsc.workspace.findFiles(glob, '').then(function (uris) {
                    for (let i = 0; i < uris.length; i++) {
                        parse(uris[i]);
                    }
                });
            }
            else {
                let resources = JSON.parse(data);
                for (let key in resources.css) {
                    for (let resource of resources.css[key]) {
                        let uri = vsc.Uri.file(path.resolve(vsc.workspace.rootPath, resource));
                        resourceJsonPaths.push(uri.fsPath);
                        parse(uri);
                    }
                }
            }
            let watcher = vsc.workspace.createFileSystemWatcher(glob);
            watcher.onDidCreate(function (uri) {
                if (resourceJsonPaths.length === 0 || resourceJsonPaths.indexOf(uri.fsPath) !== -1) {
                    parse(uri);
                }
            });
            watcher.onDidChange(function (uri) {
                if (resourceJsonPaths.length === 0 || resourceJsonPaths.indexOf(uri.fsPath) !== -1) {
                    parse(uri);
                }
            });
            watcher.onDidDelete(function (uri) {
                delete map[uri.fsPath];
            });
            context.subscriptions.push(watcher);
        });
    }
    // let styleServer = new StyleServer();
    //context.subscriptions.push(vsc.languages.registerCompletionItemProvider(
    //  ['html', 'laravel-blade', 'razor', 'vue', 'blade'], styleServer));
    //context.subscriptions.push(vsc.languages.registerHoverProvider(
    //  ['html', 'laravel-blade', 'razor', 'vue', 'blade'], styleServer));
    let classServer = new ClassServer();
    context.subscriptions.push(vsc.languages.registerCompletionItemProvider(['html', 'laravel-blade', 'razor', 'vue', 'blade'], classServer));
    //  https://github.com/Microsoft/vscode/issues/13675
    //  let wp = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\.\"\,\<\>\/\?\s]+)/g;
    //  context.subscriptions.push(vsc.languages.setLanguageConfiguration('html', {
    //    wordPattern: wp
    //  }));
    //  context.subscriptions.push(vsc.languages.setLanguageConfiguration('laravel-blade', {
    //    wordPattern: wp
    //  }));
    //  context.subscriptions.push(vsc.languages.setLanguageConfiguration('razor', {
    //    wordPattern: wp
    //  }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map