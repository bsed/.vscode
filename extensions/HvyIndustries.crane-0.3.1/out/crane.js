/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const async_1 = require("./utils/async");
const Cranefs_1 = require("./utils/Cranefs");
const Debug_1 = require("./utils/Debug");
const Config_1 = require("./utils/Config");
const exec = require('child_process').exec;
const util = require('util');
let craneSettings = vscode_1.workspace.getConfiguration("crane");
const cranefs = new Cranefs_1.Cranefs();
console.log(process.platform);
class Crane {
    constructor(languageClient) {
        Crane.langClient = languageClient;
        this.delayers = Object.create(null);
        let subscriptions = [];
        vscode_1.workspace.onDidChangeTextDocument((e) => this.onChangeTextHandler(e.document), null, subscriptions);
        vscode_1.workspace.onDidCloseTextDocument((textDocument) => { delete this.delayers[textDocument.uri.toString()]; }, null, subscriptions);
        vscode_1.workspace.onDidSaveTextDocument((document) => this.handleFileSave());
        this.disposable = vscode_1.Disposable.from(...subscriptions);
        if (!Crane.statusBarItem) {
            Crane.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
            Crane.statusBarItem.hide();
        }
        this.checkVersion().then(indexTriggered => {
            this.doInit(indexTriggered);
        });
    }
    checkVersion() {
        var self = this;
        Debug_1.Debug.info('Checking the current version of Crane');
        return new Promise((resolve, reject) => {
            cranefs.getVersionFile().then(result => {
                if (result.err && result.err.code == "ENOENT") {
                    // New install
                    vscode_1.window.showInformationMessage(`Welcome to Crane v${Config_1.Config.version}.`, "Getting Started Guide").then(data => {
                        if (data != null) {
                            Crane.openLinkInBrowser("https://github.com/HvyIndustries/crane/wiki/end-user-guide#getting-started");
                        }
                    });
                    cranefs.createOrUpdateVersionFile(false);
                    cranefs.deleteAllCaches().then(item => {
                        self.processAllFilesInWorkspace();
                        resolve(true);
                    });
                }
                else {
                    // Strip newlines from data
                    result.data = result.data.replace("\n", "");
                    result.data = result.data.replace("\r", "");
                    if (result.data && result.data != Config_1.Config.version) {
                        // Updated install
                        vscode_1.window.showInformationMessage(`You're been upgraded to Crane v${Config_1.Config.version}.`, "View Release Notes").then(data => {
                            if (data == "View Release Notes") {
                                Crane.openLinkInBrowser("https://github.com/HvyIndustries/crane/releases");
                            }
                        });
                        cranefs.createOrUpdateVersionFile(true);
                        cranefs.deleteAllCaches().then(item => {
                            self.processAllFilesInWorkspace();
                            resolve(true);
                        });
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        });
    }
    doInit(indexInProgress) {
        console.log("Crane Initialised...");
        this.showIndexingStatusBarMessage();
        // Disable the crane version display in the bottom right sidebar
        // var statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
        // statusBarItem.text = Config.version;
        // statusBarItem.tooltip = 'Crane (PHP Code-completion) version ' + Config.version;
        // statusBarItem.show();
        var serverDebugMessage = { method: "serverDebugMessage" };
        Crane.langClient.onNotification(serverDebugMessage, message => {
            switch (message.type) {
                case 'info':
                    Debug_1.Debug.info(message.message);
                    break;
                case 'error':
                    Debug_1.Debug.error(message.message);
                    break;
                case 'warning':
                    Debug_1.Debug.warning(message.message);
                    break;
                default:
                    Debug_1.Debug.info(message.message);
                    break;
            }
        });
        var requestType = { method: "workDone" };
        Crane.langClient.onRequest(requestType, (tree) => {
            // this.projectBuilding = false;
            Crane.statusBarItem.text = '$(check) PHP File Indexing Complete!';
            // Load settings
            let craneSettings = vscode_1.workspace.getConfiguration("crane");
            Debug_1.Debug.info("Processing complete!");
            if (Config_1.Config.showBugReport) {
                setTimeout(() => {
                    Crane.statusBarItem.tooltip = "Found a problem with the PHP Intellisense provided by Crane? Click here to file a bug report on Github";
                    Crane.statusBarItem.text = "$(bug) Found a PHP Intellisense Bug?";
                    Crane.statusBarItem.command = "crane.reportBug";
                    Crane.statusBarItem.show();
                }, 5000);
            }
            else {
                Crane.statusBarItem.hide();
            }
        });
        var types = Config_1.Config.phpFileTypes;
        Debug_1.Debug.info(`Watching these files: {${types.include.join(',')}}`);
        var fsw = vscode_1.workspace.createFileSystemWatcher(`{${types.include.join(',')}}`);
        fsw.onDidChange(e => {
            vscode_1.workspace.openTextDocument(e).then(document => {
                if (document.languageId != 'php')
                    return;
                Debug_1.Debug.info('File Changed: ' + e.fsPath);
                Crane.langClient.sendRequest({ method: 'buildObjectTreeForDocument' }, {
                    path: e.fsPath,
                    text: document.getText()
                });
            });
        });
        fsw.onDidCreate(e => {
            vscode_1.workspace.openTextDocument(e).then(document => {
                if (document.languageId != 'php')
                    return;
                Debug_1.Debug.info('File Created: ' + e.fsPath);
                Crane.langClient.sendRequest({ method: 'buildObjectTreeForDocument' }, {
                    path: e.fsPath,
                    text: document.getText()
                });
            });
        });
        fsw.onDidDelete(e => {
            Debug_1.Debug.info('File Deleted: ' + e.fsPath);
            Crane.langClient.sendRequest({ method: 'deleteFile' }, {
                path: e.fsPath
            });
        });
        if (!indexInProgress) {
            // Send request to server to build object tree for all workspace files
            this.processAllFilesInWorkspace();
        }
    }
    showIndexingStatusBarMessage() {
        Crane.statusBarItem.text = "$(zap) Indexing PHP source files...";
        Crane.statusBarItem.tooltip = "Crane is processing the PHP source files in the workspace to build code completion suggestions";
        Crane.statusBarItem.show();
    }
    reportBug() {
        Crane.openLinkInBrowser("https://github.com/HvyIndustries/crane/issues");
    }
    static openLinkInBrowser(link) {
        var openCommand = "";
        switch (process.platform) {
            case 'darwin':
            case 'linux':
                openCommand = 'open ';
                break;
            case 'win32':
                openCommand = 'start ';
                break;
            default:
                return;
        }
        exec(openCommand + link);
    }
    handleFileSave() {
        var editor = vscode_1.window.activeTextEditor;
        if (editor == null)
            return;
        var document = editor.document;
        this.buildObjectTreeForDocument(document).then(() => {
            Crane.langClient.sendRequest({ method: 'saveTreeCache' }, { projectDir: cranefs.getProjectDir(), projectTree: cranefs.getTreePath() });
        }).catch(error => {
            Debug_1.Debug.error(util.inspect(error, false, null));
        });
    }
    processAllFilesInWorkspace() {
        cranefs.createProjectDir().then(data => {
            var createTreeFile = false;
            // Folder was created so there is no tree cache
            if (data.folderCreated) {
                this.processWorkspaceFiles();
            }
            else {
                // Check for a tree file, if it exists load it;
                // otherwise we need to process the files in the workspace
                cranefs.doesProjectTreeExist().then(tree => {
                    if (!tree.exists) {
                        this.processWorkspaceFiles();
                    }
                    else {
                        this.processProject();
                    }
                });
            }
        }).catch(error => {
            Debug_1.Debug.error(util.inspect(error, false, null));
        });
    }
    deleteCaches() {
        var self = this;
        cranefs.deleteAllCaches().then(success => {
            vscode_1.window.showInformationMessage('All PHP file caches were successfully deleted');
            self.processAllFilesInWorkspace();
        });
    }
    rebuildProject() {
        cranefs.rebuildProject();
    }
    downloadPHPLibraries() {
        cranefs.downloadPHPLibraries();
    }
    processWorkspaceFiles() {
        cranefs.processWorkspaceFiles();
    }
    processProject() {
        cranefs.processProject();
    }
    onChangeTextHandler(textDocument) {
        // Only parse PHP files
        if (textDocument.languageId != "php")
            return;
        let key = textDocument.uri.toString();
        let delayer = this.delayers[key];
        if (!delayer) {
            delayer = new async_1.ThrottledDelayer(500);
            this.delayers[key] = delayer;
        }
        delayer.trigger(() => this.buildObjectTreeForDocument(textDocument));
    }
    buildObjectTreeForDocument(document) {
        return new Promise((resolve, reject) => {
            var path = document.fileName;
            var text = document.getText();
            var projectDir = cranefs.getProjectDir();
            var projectTree = cranefs.getTreePath();
            var requestType = { method: "buildObjectTreeForDocument" };
            Crane.langClient.sendRequest(requestType, { path, text, projectDir, projectTree }).then(() => resolve());
        });
    }
    dispose() {
        this.disposable.dispose();
        Crane.statusBarItem.dispose();
    }
}
exports.default = Crane;
//# sourceMappingURL=crane.js.map