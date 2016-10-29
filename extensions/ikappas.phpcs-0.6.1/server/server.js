/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var vscode_languageserver_1 = require("vscode-languageserver");
var url = require("url");
var proto = require("./protocol");
var documents_1 = require("./documents");
var linter_1 = require("./linter");
var PhpcsServer = (function () {
    /**
     * Class constructor.
     *
     * @return A new instance of the server.
     */
    function PhpcsServer() {
        var _this = this;
        this.ready = false;
        this._validating = Object.create(null);
        this.connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
        this.documents = new documents_1.PhpcsDocuments();
        this.documents.listen(this.connection);
        this.connection.onInitialize(function (params) {
            return _this.onInitialize(params);
        });
        this.connection.onDidChangeConfiguration(function (params) {
            _this.onDidChangeConfiguration(params);
        });
        this.connection.onDidChangeWatchedFiles(function (params) {
            _this.onDidChangeWatchedFiles(params);
        });
        this.documents.onDidOpenDocument(function (event) {
            _this.onDidOpenDocument(event);
        });
        this.documents.onDidSaveDocument(function (event) {
            _this.onDidSaveDocument(event);
        });
    }
    /**
     * Handles server initialization.
     *
     * @param params The initialization parameters.
     * @return A promise of initialization result or initialization error.
     */
    PhpcsServer.prototype.onInitialize = function (params) {
        var _this = this;
        this.rootPath = params.rootPath;
        return linter_1.PhpcsLinter.resolvePath(this.rootPath).then(function (linter) {
            _this.linter = linter;
            var result = { capabilities: { textDocumentSync: _this.documents.syncKind } };
            return result;
        }, function (error) {
            return Promise.reject(new vscode_languageserver_1.ResponseError(99, error, { retry: true }));
        });
    };
    /**
     * Handles configuration changes.
     *
     * @param params The changed configuration parameters.
     * @return void
     */
    PhpcsServer.prototype.onDidChangeConfiguration = function (params) {
        this.settings = params.settings.phpcs;
        this.ready = true;
        this.validateMany(this.documents.all());
    };
    /**
     * Handles watched files changes.
     *
     * @param params The changed watched files parameters.
     * @return void
     */
    PhpcsServer.prototype.onDidChangeWatchedFiles = function (params) {
        this.validateMany(this.documents.all());
    };
    /**
     * Handles opening of text documents.
     *
     * @param event The text document open event.
     * @return void
     */
    PhpcsServer.prototype.onDidOpenDocument = function (event) {
        this.validateSingle(event.document);
    };
    /**
     * Handles saving of text documents.
     *
     * @param event The text document save event.
     * @return void
     */
    PhpcsServer.prototype.onDidSaveDocument = function (event) {
        this.validateSingle(event.document);
    };
    /**
     * Start listening to requests.
     *
     * @return void
     */
    PhpcsServer.prototype.listen = function () {
        this.connection.listen();
    };
    /**
     * Validate a single text document.
     *
     * @param document The text document to validate.
     * @return void
     */
    PhpcsServer.prototype.validateSingle = function (document) {
        var _this = this;
        var docUrl = url.parse(document.uri);
        // Only process file documents.
        if (docUrl.protocol == "file:" && this._validating[document.uri] === undefined) {
            this._validating[document.uri] = document;
            this.sendStartValidationNotification(document);
            this.linter.lint(document, this.settings, this.rootPath).then(function (diagnostics) {
                delete _this._validating[document.uri];
                _this.sendEndValidationNotification(document);
                _this.connection.sendDiagnostics({ uri: document.uri, diagnostics: diagnostics });
            }, function (error) {
                delete _this._validating[document.uri];
                _this.sendEndValidationNotification(document);
                _this.connection.window.showErrorMessage(_this.getExceptionMessage(error, document));
            });
        }
    };
    PhpcsServer.prototype.sendStartValidationNotification = function (document) {
        this.connection.sendNotification(proto.DidStartValidateTextDocumentNotification.type, { textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(document.uri) });
    };
    PhpcsServer.prototype.sendEndValidationNotification = function (document) {
        this.connection.sendNotification(proto.DidEndValidateTextDocumentNotification.type, { textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(document.uri) });
    };
    /**
     * Validate a list of text documents.
     *
     * @param documents The list of textdocuments to validate.
     * @return void
     */
    PhpcsServer.prototype.validateMany = function (documents) {
        var _this = this;
        var tracker = new vscode_languageserver_1.ErrorMessageTracker();
        var promises = [];
        documents.forEach(function (document) {
            _this.sendStartValidationNotification(document);
            promises.push(_this.linter.lint(document, _this.settings, _this.rootPath).then(function (diagnostics) {
                _this.connection.console.log("processing: " + document.uri);
                _this.sendEndValidationNotification(document);
                var diagnostic = { uri: document.uri, diagnostics: diagnostics };
                _this.connection.sendDiagnostics(diagnostic);
                return diagnostic;
            }, function (error) {
                _this.sendEndValidationNotification(document);
                tracker.add(_this.getExceptionMessage(error, document));
            }));
        });
        Promise.all(promises).then(function (results) {
            tracker.sendErrors(_this.connection);
        });
    };
    /**
     * Get the exception message from an exception object.
     *
     * @param exeption The exception to parse.
     * @param document The document where the exception occured.
     * @return string The exception message.
     */
    PhpcsServer.prototype.getExceptionMessage = function (exception, document) {
        var msg = null;
        if (typeof exception.message === "string" || exception.message instanceof String) {
            msg = exception.message;
            msg = msg.replace(/\r?\n/g, " ");
            if (/^ERROR: /.test(msg)) {
                msg = msg.substr(5);
            }
        }
        else {
            msg = "An unknown error occured while validating file: " + vscode_languageserver_1.Files.uriToFilePath(document.uri);
        }
        return "phpcs: " + msg;
    };
    return PhpcsServer;
}());
var server = new PhpcsServer();
server.listen();
//# sourceMappingURL=server.js.map