/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const vscode_languageserver_1 = require('vscode-languageserver');
let uriToFilePath = vscode_languageserver_1.Files.uriToFilePath;
const path_1 = require('path');
// Interface between VS Code extension and GHC-Mod api
const ghcModInterfaces_1 = require('./ghcModInterfaces');
const interactiveGhcMod_1 = require('./interactiveGhcMod');
const ghcModProvider_1 = require('./ghcModProvider');
let ghcMod;
let ghcModProvider;
// Use throttled delayers to control the rate of calls to ghc-mod
const async_1 = require('./utils/async');
let dirtyDocuments = new Set();
let documentChangedDelayers = Object.create(null);
let hoverDelayer = new async_1.ThrottledDelayer(100);
const remoteConnectionAdapter_1 = require('./utils/remoteConnectionAdapter');
let logger;
// Create a connection for the server. The connection uses
// stdin / stdout for message passing
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot;
connection.onInitialize((params) => {
    logger = new remoteConnectionAdapter_1.RemoteConnectionAdapter(connection);
    workspaceRoot = params.rootPath;
    // NOTE: onConfigurationChange gets called after onInitialize
    //       and the settings are needed to initialize ghcMod.
    //       Therefore, defer initialization to onConfigurationChange.
    // ghcMod = createGhcMod();
    // ghcModProvider = new GhcModProvider(ghcMod, logger);
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            hoverProvider: true,
            textDocumentSync: documents.syncKind,
            definitionProvider: true
        }
    };
});
let settings = Object.create({});
let mapFiles = false;
// The settings have changed. Is sent on server activation as well.
// It includes ALL settings. If the user has not set them, the
// default value will be sent.
connection.onDidChangeConfiguration((change) => {
    logger.log('haskell.ghcMod configuration changed');
    let oldSettings = settings;
    settings = change.settings.haskell.ghcMod;
    mapFiles = ghcModInterfaces_1.CheckTrigger[settings.check] == ghcModInterfaces_1.CheckTrigger.onChange;
    logger.setLogLevel(ghcModInterfaces_1.LogLevel[settings.logLevel]);
    if (oldSettings.executablePath !== settings.executablePath) {
        initialize();
    }
    else if (oldSettings.check !== settings.check ||
        oldSettings.maxNumberOfProblems !== settings.maxNumberOfProblems) {
        // Revalidate any open text documents
        documents.all().forEach(ghcCheck);
    }
});
function initialize() {
    // Shutdown existing provider if it exists
    if (ghcModProvider) {
        ghcModProvider.shutdown();
        ghcModProvider = null;
    }
    // Disable current listeners
    connection.onHover(null);
    connection.onRequest(InsertTypeRequest.type, null);
    documents.onDidChangeContent(null);
    documents.onDidSave(null);
    // Create new ghcMod and provider
    ghcMod = createGhcMod();
    if (ghcMod) {
        ghcModProvider = new ghcModProvider_1.GhcModProvider(ghcMod, workspaceRoot, logger);
    }
    // Initialize listeners if appropriate
    if (ghcMod && ghcModProvider) {
        initializeDocumentSync();
        initializeOnHover();
        initializeOnDefinition();
        initializeOnCommand();
    }
    else {
        connection.onDefinition(null);
    }
}
function initializeDocumentSync() {
    // The content of a text document has changed. This event is emitted
    // when the text document first opened or when its content has changed.
    // This event will fire for every key press, but the use of delayers
    // here means that ghcCheck will only be called ONCE for a file after
    // the delay period with the most recent set of information. It does
    // NOT serve as a queue.
    documents.onDidSave((change) => {
        dirtyDocuments.delete(change.document.uri);
        if (ghcModInterfaces_1.CheckTrigger[settings.check] == ghcModInterfaces_1.CheckTrigger.onSave || settings.check == "true") {
            handleChangeEvent(change);
        }
    });
    documents.onDidChangeContent((change) => {
        dirtyDocuments.add(change.document.uri);
        if (ghcModInterfaces_1.CheckTrigger[settings.check] == ghcModInterfaces_1.CheckTrigger.onChange) {
            handleChangeEvent(change);
        }
    });
}
function handleChangeEvent(change) {
    let key = uriToFilePath(change.document.uri);
    let delayer = documentChangedDelayers[key];
    if (!delayer) {
        // This is so check will work with auto-save
        delayer = new async_1.ThrottledDelayer(1000);
        // delayer = new ThrottledDelayer<void>(250);
        documentChangedDelayers[key] = delayer;
    }
    delayer.trigger(() => ghcCheck(change.document));
}
// onHover can sometimes be called once and sometimes be called
// multiple times in quick succession so a delayer is used here
// as well. Unlike above, it wouldn't make sense to use a unique
// delayer per file as only the most recent hover event matters.
function initializeOnHover() {
    connection.onHover((documentInfo) => {
        return hoverDelayer.trigger(() => {
            return getInfoOrTypeHover(documents.get(documentInfo.textDocument.uri), documentInfo.position);
        }).then((hover) => {
            return hover;
        });
    });
}
function initializeOnDefinition() {
    connection.onDefinition((documentInfo) => {
        let document = documents.get(documentInfo.textDocument.uri);
        return ghcModProvider.getDefinitionLocation(document.getText(), uriToFilePath(document.uri), documentInfo.position, workspaceRoot);
    });
}
var InsertTypeRequest;
(function (InsertTypeRequest) {
    InsertTypeRequest.type = { get method() { return 'insertType'; } };
})(InsertTypeRequest || (InsertTypeRequest = {}));
function initializeOnCommand() {
    connection.onRequest(InsertTypeRequest.type, (documentInfo) => {
        logger.log(`Received InsertType request for ${path_1.basename(documentInfo.textDocument.uri)} at ${documentInfo.position.line}:${documentInfo.position.character}`);
        let document = documents.get(documentInfo.textDocument.uri);
        var mapFile = mapFiles && dirtyDocuments.has(document.uri);
        return ghcModProvider.getInfo(document.getText(), uriToFilePath(document.uri), documentInfo.position, mapFile);
    });
}
connection.onShutdown(() => {
    if (ghcModProvider) {
        ghcModProvider.shutdown();
    }
});
function createGhcMod() {
    let options = {
        executable: settings.executablePath,
        rootPath: workspaceRoot
    };
    return interactiveGhcMod_1.InteractiveGhcModProcess.create(options, logger);
}
function getInfoOrTypeHover(document, position) {
    // return immediately if setting is 'none'
    if (settings.onHover === 'none' || !ghcMod || !ghcModProvider) {
        return null;
    }
    var mapFile = mapFiles && dirtyDocuments.has(document.uri);
    return Promise.resolve().then(() => {
        if (settings.onHover === 'info' || settings.onHover === 'fallback') {
            return ghcModProvider.getInfo(document.getText(), uriToFilePath(document.uri), position, mapFile);
        }
        else {
            return null;
        }
    }, (reason) => { logger.warn('ghcModProvider.getInfo rejected: ' + reason); })
        .then((info) => {
        if (settings.onHover === 'info' || info) {
            return info;
        }
        else {
            return ghcModProvider.getType(document.getText(), uriToFilePath(document.uri), position, mapFile);
        }
    }, (reason) => { logger.warn('ghcModProvider.getType rejected: ' + reason); })
        .then((type) => {
        return type ? {
            contents: { language: 'haskell', value: type }
        } : null; // https://github.com/Microsoft/vscode-languageserver-node/issues/18
    });
}
function ghcCheck(document) {
    var mapFile = mapFiles && dirtyDocuments.has(document.uri);
    return Promise.resolve().then(() => {
        if (!ghcMod || !ghcModProvider || ghcModInterfaces_1.CheckTrigger[settings.check] == ghcModInterfaces_1.CheckTrigger.off) {
            connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
        }
        else {
            ghcModProvider.doCheck(document.getText(), uriToFilePath(document.uri), mapFile).then((diagnostics) => {
                connection.sendDiagnostics({ uri: document.uri, diagnostics: diagnostics.slice(0, settings.maxNumberOfProblems) });
            });
        }
    });
}
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map