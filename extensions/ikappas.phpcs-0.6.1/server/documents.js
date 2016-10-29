/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var vscode_languageserver_1 = require("vscode-languageserver");
var protocol_1 = require("./protocol");
var events_1 = require("./utils/events");
var FullTextDocument = (function () {
    function FullTextDocument(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = null;
    }
    Object.defineProperty(FullTextDocument.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "languageId", {
        get: function () {
            return this._languageId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "version", {
        get: function () {
            return this._version;
        },
        enumerable: true,
        configurable: true
    });
    FullTextDocument.prototype.getText = function () {
        return this._content;
    };
    FullTextDocument.prototype.update = function (event, version) {
        this._content = event.text;
        this._version = version;
        this._lineOffsets = null;
    };
    FullTextDocument.prototype.getLineOffsets = function () {
        if (this._lineOffsets === null) {
            var lineOffsets = [];
            var text = this._content;
            var isLineStart = true;
            for (var i = 0; i < text.length; i++) {
                if (isLineStart) {
                    lineOffsets.push(i);
                    isLineStart = false;
                }
                var ch = text.charAt(i);
                isLineStart = (ch === "\r" || ch === "\n");
                if (ch === "\r" && i + 1 < text.length && text.charAt(i + 1) === "\n") {
                    i++;
                }
            }
            if (isLineStart && text.length > 0) {
                lineOffsets.push(text.length);
            }
            this._lineOffsets = lineOffsets;
        }
        return this._lineOffsets;
    };
    FullTextDocument.prototype.positionAt = function (offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        var lineOffsets = this.getLineOffsets();
        var low = 0, high = lineOffsets.length;
        if (high === 0) {
            return vscode_languageserver_1.Position.create(0, offset);
        }
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
                high = mid;
            }
            else {
                low = mid + 1;
            }
        }
        // low is the least x for which the line offset is larger than the current offset
        // or array.length if no line offset is larger than the current offset
        var line = low - 1;
        return vscode_languageserver_1.Position.create(line, offset - lineOffsets[line]);
    };
    FullTextDocument.prototype.offsetAt = function (position) {
        var lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
            return this._content.length;
        }
        else if (position.line < 0) {
            return 0;
        }
        var lineOffset = lineOffsets[position.line];
        var nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    };
    Object.defineProperty(FullTextDocument.prototype, "lineCount", {
        get: function () {
            return this.getLineOffsets().length;
        },
        enumerable: true,
        configurable: true
    });
    return FullTextDocument;
}());
/**
 * A manager for simple text documents
 */
var PhpcsDocuments = (function () {
    /**
     * Create a new text document manager.
     */
    function PhpcsDocuments() {
        this._documents = Object.create(null);
        this._onDidOpenDocument = new events_1.Emitter();
        this._onDidChangeContent = new events_1.Emitter();
        this._onDidSaveDocument = new events_1.Emitter();
        this._onDidCloseDocument = new events_1.Emitter();
    }
    Object.defineProperty(PhpcsDocuments.prototype, "syncKind", {
        /**
         * Returns the [TextDocumentSyncKind](#TextDocumentSyncKind) used by
         * this text document manager.
         */
        get: function () {
            return vscode_languageserver_1.TextDocumentSyncKind.Full;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PhpcsDocuments.prototype, "onDidOpenDocument", {
        /**
         * An event that fires when a text document managed by this manager
         * is opened.
         */
        get: function () {
            return this._onDidOpenDocument.event;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PhpcsDocuments.prototype, "onDidChangeContent", {
        /**
         * An event that fires when a text document managed by this manager
         * changes.
         */
        get: function () {
            return this._onDidChangeContent.event;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PhpcsDocuments.prototype, "onDidSaveDocument", {
        /**
         * An event that fires when a text document managed by this manager
         * is saved.
         */
        get: function () {
            return this._onDidSaveDocument.event;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PhpcsDocuments.prototype, "onDidCloseDocument", {
        /**
         * An event that fires when a text document managed by this manager
         * is closed.
         */
        get: function () {
            return this._onDidCloseDocument.event;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the document for the given URI. Returns undefined if
     * the document is not mananged by this instance.
     *
     * @param uri The text document's URI to retrieve.
     * @return the text document or `undefined`.
     */
    PhpcsDocuments.prototype.get = function (uri) {
        return this._documents[uri];
    };
    /**
     * Returns all text documents managed by this instance.
     *
     * @return all text documents.
     */
    PhpcsDocuments.prototype.all = function () {
        var _this = this;
        return Object.keys(this._documents).map(function (key) { return _this._documents[key]; });
    };
    /**
     * Returns the URIs of all text documents managed by this instance.
     *
     * @return the URI's of all text documents.
     */
    PhpcsDocuments.prototype.keys = function () {
        return Object.keys(this._documents);
    };
    /**
     * Listens for `low level` notification on the given connection to
     * update the text documents managed by this instance.
     *
     * @param connection The connection to listen on.
     */
    PhpcsDocuments.prototype.listen = function (connection) {
        var _this = this;
        connection.__textDocumentSync = vscode_languageserver_1.TextDocumentSyncKind.Full;
        connection.onDidOpenTextDocument(function (event) {
            var document = new FullTextDocument(event.uri, event.languageId, -1, event.text);
            _this._documents[event.uri] = document;
            _this._onDidOpenDocument.fire({ document: document });
            _this._onDidChangeContent.fire({ document: document });
        });
        connection.onDidChangeTextDocument(function (event) {
            var changes = event.contentChanges;
            var last = changes.length > 0 ? changes[changes.length - 1] : null;
            if (last) {
                var document_1 = _this._documents[event.uri];
                document_1.update(last, -1);
                _this._onDidChangeContent.fire({ document: document_1 });
            }
        });
        connection.onNotification(protocol_1.DidSaveTextDocumentNotification.type, function (event) {
            var document = _this._documents[event.textDocument.uri];
            _this._onDidSaveDocument.fire({ document: document });
        });
        connection.onDidCloseTextDocument(function (event) {
            var document = _this._documents[event.uri];
            delete _this._documents[event.uri];
            _this._onDidCloseDocument.fire({ document: document });
        });
    };
    return PhpcsDocuments;
}());
exports.PhpcsDocuments = PhpcsDocuments;
//# sourceMappingURL=documents.js.map