/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const vscode_languageserver_1 = require('vscode-languageserver');
let uriToFilePath = vscode_languageserver_1.Files.uriToFilePath;
const path_1 = require('path');
// Interface between VS Code extension and GHC-Mod api
const interfaces_1 = require('./interfaces');
const interactiveGhcMod_1 = require('./ghcModProviders/interactiveGhcMod');
const ghcModProvider_1 = require('./ghcModProviders/ghcModProvider');
let ghcMod;
let ghcModProvider;
// Use throttled delayers to control the rate of calls to ghc-mod
const async_1 = require('./utils/async');
let dirtyDocuments = new Set();
let documentChangedDelayers = Object.create(null);
let hoverDelayer = new async_1.ThrottledDelayer(100);
const remoteConnectionAdapter_1 = require('./utils/remoteConnectionAdapter');
let logger;
const fastTagsSymbolProvider_1 = require('./symbolProviders/fastTagsSymbolProvider');
const haskTagsSymbolProvider_1 = require('./symbolProviders/haskTagsSymbolProvider');
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
            definitionProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true
        }
    };
});
let haskellConfig = Object.create({ ghcMod: {}, symbols: {} });
let mapFiles = false;
// The settings have changed. Is sent on server activation as well.
// It includes ALL settings. If the user has not set them, the
// default value will be sent.
connection.onDidChangeConfiguration((change) => {
    logger.log('haskell configuration changed');
    let oldSettings = haskellConfig;
    haskellConfig = change.settings.haskell;
    logger.setLogLevel(interfaces_1.LogLevel[haskellConfig.ghcMod.logLevel]);
    mapFiles = interfaces_1.CheckTrigger[haskellConfig.ghcMod.check] === interfaces_1.CheckTrigger.onChange;
    if (oldSettings.ghcMod.executablePath !== haskellConfig.ghcMod.executablePath) {
        initializeGhcMod();
    }
    else if (oldSettings.ghcMod.check !== haskellConfig.ghcMod.check ||
        oldSettings.ghcMod.maxNumberOfProblems !== haskellConfig.ghcMod.maxNumberOfProblems) {
        // Revalidate any open text documents
        documents.all().forEach(ghcCheck);
    }
    initializeSymbolProvider();
});
function initializeGhcMod() {
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
function initializeSymbolProvider() {
    let symbolProvider = null;
    switch (haskellConfig.symbols.provider) {
        case 'fast-tags':
            symbolProvider = new fastTagsSymbolProvider_1.FastTagsSymbolProvider(haskellConfig.symbols.executablePath, workspaceRoot, logger);
            break;
        case 'hasktags':
            symbolProvider = new haskTagsSymbolProvider_1.HaskTagsSymbolProvider(haskellConfig.symbols.executablePath, workspaceRoot, logger);
            break;
        default:
            break;
    }
    if (symbolProvider) {
        connection.onDocumentSymbol((uri) => symbolProvider.getSymbolsForFile(uri));
        connection.onWorkspaceSymbol((query, cancellationToken) => symbolProvider.getSymbolsForWorkspace(query, cancellationToken));
    }
    else {
        connection.onDocumentSymbol(null);
        connection.onWorkspaceSymbol(null);
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
        if (interfaces_1.CheckTrigger[haskellConfig.ghcMod.check] === interfaces_1.CheckTrigger.onSave || haskellConfig.ghcMod.check === 'true') {
            handleChangeEvent(change);
        }
    });
    documents.onDidChangeContent((change) => {
        dirtyDocuments.add(change.document.uri);
        if (interfaces_1.CheckTrigger[haskellConfig.ghcMod.check] === interfaces_1.CheckTrigger.onChange) {
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
    'use strict';
    InsertTypeRequest.type = { get method() { return 'insertType'; } };
})(InsertTypeRequest || (InsertTypeRequest = {}));
function initializeOnCommand() {
    connection.onRequest(InsertTypeRequest.type, (documentInfo) => {
        let filename = path_1.basename(documentInfo.textDocument.uri);
        let line = documentInfo.position.line;
        let character = documentInfo.position.character;
        logger.log(`Received InsertType request for ${filename} at ${line}:${character}`);
        let document = documents.get(documentInfo.textDocument.uri);
        let mapFile = mapFiles && dirtyDocuments.has(document.uri);
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
        executable: haskellConfig.ghcMod.executablePath,
        rootPath: workspaceRoot
    };
    return interactiveGhcMod_1.InteractiveGhcModProcess.create(options, logger);
}
function getInfoOrTypeHover(document, position) {
    // return immediately if setting is 'none'
    if (haskellConfig.ghcMod.onHover === 'none' || !ghcMod || !ghcModProvider) {
        return null;
    }
    let mapFile = mapFiles && dirtyDocuments.has(document.uri);
    return Promise.resolve().then(() => {
        if (haskellConfig.ghcMod.onHover === 'info' || haskellConfig.ghcMod.onHover === 'fallback') {
            return ghcModProvider.getInfo(document.getText(), uriToFilePath(document.uri), position, mapFile);
        }
        else {
            return null;
        }
    }, (reason) => { logger.warn('ghcModProvider.getInfo rejected: ' + reason); })
        .then((info) => {
        if (haskellConfig.ghcMod.onHover === 'info' || info) {
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
    let mapFile = mapFiles && dirtyDocuments.has(document.uri);
    return Promise.resolve().then(() => {
        if (!ghcMod || !ghcModProvider || interfaces_1.CheckTrigger[haskellConfig.ghcMod.check] === interfaces_1.CheckTrigger.off) {
            connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
        }
        else {
            ghcModProvider.doCheck(document.getText(), uriToFilePath(document.uri), mapFile).then((diagnostics) => {
                connection.sendDiagnostics({
                    uri: document.uri,
                    diagnostics: diagnostics.slice(0, haskellConfig.ghcMod.maxNumberOfProblems)
                });
            });
        }
    });
}
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map