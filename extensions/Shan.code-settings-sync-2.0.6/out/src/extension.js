// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
const pluginService_1 = require('./pluginService');
const environmentPath_1 = require('./environmentPath');
const fileManager_1 = require('./fileManager');
const commons = require('./commons');
const githubService_1 = require('./githubService');
const setting_1 = require('./setting');
const enums_1 = require('./enums');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        //migration code
        var en = new environmentPath_1.Environment(context);
        var common = new commons.Commons(en);
        var mainSyncSetting = null;
        var newSetting = new setting_1.LocalSetting();
        var settingChanged = false;
        var emptySetting = false;
        yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (resolve) {
                mainSyncSetting = resolve;
                if (!mainSyncSetting.Version || mainSyncSetting.Version < environmentPath_1.Environment.CURRENT_VERSION) {
                    settingChanged = true;
                    newSetting.Version = environmentPath_1.Environment.CURRENT_VERSION;
                    if (mainSyncSetting.Token) {
                        newSetting.Token = mainSyncSetting.Token;
                        if (mainSyncSetting.Gist) {
                            newSetting.Gist = mainSyncSetting.Gist;
                        }
                    }
                }
                else {
                    newSetting = mainSyncSetting;
                    var tokenAvailable = newSetting.Token != null || newSetting.Token != "";
                    var gistAvailable = newSetting.Gist != null || newSetting.Gist != "";
                    if (tokenAvailable && gistAvailable && newSetting.autoSync) {
                        vscode.commands.executeCommand('extension.downloadSettings');
                    }
                }
            }
            else {
                settingChanged = true;
                emptySetting = true;
            }
            if (settingChanged) {
                yield common.SaveSettings(newSetting).then(function (added) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (added) {
                            if (!emptySetting) {
                                vscode.window.showInformationMessage("Sync : Migration to new version complete. Read Release Notes for details.");
                            }
                            else {
                                vscode.window.showInformationMessage("Sync : Settings Created.");
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("GIST and Token couldn't be migrated to new version. You need to add them again.");
                        }
                    });
                });
            }
        }), (reject) => {
            console.error(reject);
            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
        });
        var openurl = require('open');
        var fs = require('fs');
        var GitHubApi = require("github4");
        var github = new GitHubApi({
            version: "3.0.0"
        });
        var updateSettings = vscode.commands.registerCommand('extension.updateSettings', () => __awaiter(this, void 0, void 0, function* () {
            var en = new environmentPath_1.Environment(context);
            var common = new commons.Commons(en);
            var myGi = null;
            var dateNow = new Date();
            var syncSetting = new setting_1.LocalSetting();
            yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
                syncSetting = resolve;
                yield Init();
            }), (reject) => {
                console.error(reject);
                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
            });
            function Init() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (syncSetting.Token == null || syncSetting.Token == "") {
                        openurl("https://github.com/settings/tokens");
                        yield common.GetTokenAndSave(syncSetting).then(function (saved) {
                            if (saved) {
                                Init();
                                return;
                            }
                            else {
                                vscode.window.showErrorMessage("TOKEN NOT SAVED");
                                return;
                            }
                        }, function (err) {
                            console.error(err);
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    else {
                        myGi = new githubService_1.GithubService(syncSetting.Token);
                        vscode.window.setStatusBarMessage("Sync : Uploading / Updating Your Settings In Github.", 3000);
                        yield startGitProcess();
                    }
                });
            }
            function startGitProcess() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (syncSetting.Token != null && syncSetting.Token != "") {
                        syncSetting.lastUpload = dateNow;
                        var allSettingFiles = new Array();
                        vscode.window.setStatusBarMessage("Sync : Reading Settings and Extensions.", 1000);
                        var settingFile = yield fileManager_1.FileManager.GetFile(en.FILE_SETTING, en.FILE_SETTING_NAME);
                        var launchFile = yield fileManager_1.FileManager.GetFile(en.FILE_LAUNCH, en.FILE_LAUNCH_NAME);
                        var destinationKeyBinding = "";
                        if (en.OsType == enums_1.OsType.Mac) {
                            destinationKeyBinding = en.FILE_KEYBINDING_MAC;
                        }
                        else {
                            destinationKeyBinding = en.FILE_KEYBINDING_DEFAULT;
                        }
                        var keybindingFile = yield fileManager_1.FileManager.GetFile(en.FILE_KEYBINDING, destinationKeyBinding);
                        var localeFile = yield fileManager_1.FileManager.GetFile(en.FILE_LOCALE, en.FILE_LOCALE_NAME);
                        if (settingFile) {
                            allSettingFiles.push(settingFile);
                        }
                        if (launchFile) {
                            allSettingFiles.push(launchFile);
                        }
                        if (keybindingFile) {
                            allSettingFiles.push(keybindingFile);
                        }
                        if (localeFile) {
                            allSettingFiles.push(localeFile);
                        }
                        var extensionlist = pluginService_1.PluginService.CreateExtensionList();
                        extensionlist.sort(function (a, b) {
                            return a.name.localeCompare(b.name);
                        });
                        var fileName = en.FILE_EXTENSION_NAME;
                        var filePath = en.FILE_EXTENSION;
                        var fileContent = JSON.stringify(extensionlist, undefined, 2);
                        ;
                        var file = new fileManager_1.File(fileName, fileContent, filePath);
                        allSettingFiles.push(file);
                        var snippetFiles = yield fileManager_1.FileManager.ListFiles(en.FOLDER_SNIPPETS);
                        snippetFiles.forEach(snippetFile => {
                            allSettingFiles.push(snippetFile);
                        });
                        var extProp = new setting_1.CloudSetting();
                        extProp.lastUpload = dateNow;
                        fileName = en.FILE_CLOUDSETTINGS_NAME;
                        fileContent = JSON.stringify(extProp);
                        file = new fileManager_1.File(fileName, fileContent, "");
                        allSettingFiles.push(file);
                        var newGIST = false;
                        if (syncSetting.Gist == null || syncSetting.Gist === "") {
                            newGIST = true;
                            yield myGi.CreateEmptyGIST().then(function (gistID) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (gistID) {
                                        syncSetting.Gist = gistID;
                                        vscode.window.setStatusBarMessage("Sync : Empty GIST ID: " + syncSetting.Gist + "Created To Insert Files");
                                    }
                                    else {
                                        vscode.window.showInformationMessage("GIST UNABLE TO CREATE");
                                        return;
                                    }
                                });
                            }, function (error) {
                                console.error(error);
                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                return;
                            });
                        }
                        yield myGi.ReadGist(syncSetting.Gist).then(function (gistObj) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (gistObj) {
                                    vscode.window.setStatusBarMessage("Sync : Inserting Files Data.");
                                    gistObj = myGi.UpdateGIST(gistObj, allSettingFiles);
                                    yield myGi.SaveGIST(gistObj).then(function (saved) {
                                        return __awaiter(this, void 0, void 0, function* () {
                                            if (saved) {
                                                yield common.SaveSettings(syncSetting).then(function (added) {
                                                    if (added) {
                                                        if (newGIST) {
                                                            vscode.window.showInformationMessage("Uploaded Successfully." + " GIST ID :  " + syncSetting.Gist + " . Please copy and use this ID in other machines to sync all settings.");
                                                        }
                                                        else {
                                                            vscode.window.showInformationMessage("Uploaded Successfully.");
                                                        }
                                                        vscode.window.setStatusBarMessage("");
                                                    }
                                                }, function (err) {
                                                    console.error(err);
                                                    vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                    return;
                                                });
                                            }
                                            else {
                                                vscode.window.showErrorMessage("GIST NOT SAVED");
                                                return;
                                            }
                                        });
                                    }, function (error) {
                                        console.error(error);
                                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                        return;
                                    });
                                }
                                else {
                                    vscode.window.showErrorMessage("GIST ID: " + syncSetting.Gist + " UNABLE TO READ.");
                                    return;
                                }
                            });
                        }, function (gistReadError) {
                            console.error(gistReadError);
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    else {
                        vscode.window.showErrorMessage("ERROR ! Github Account Token Not Set");
                    }
                });
            }
        }));
        var downloadSettings = vscode.commands.registerCommand('extension.downloadSettings', () => __awaiter(this, void 0, void 0, function* () {
            var en = new environmentPath_1.Environment(context);
            var common = new commons.Commons(en);
            var myGi = null;
            var syncSetting = new setting_1.LocalSetting();
            yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
                syncSetting = resolve;
                yield Init();
            }), (reject) => {
                console.error(reject);
                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
            });
            function Init() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (syncSetting.Token == null || syncSetting.Token == "") {
                        openurl("https://github.com/settings/tokens");
                        yield common.GetTokenAndSave(syncSetting).then(function (saved) {
                            if (saved) {
                                Init();
                                return;
                            }
                            else {
                                vscode.window.showErrorMessage("TOKEN NOT SAVED");
                                return;
                            }
                        }, function (err) {
                            console.error(err);
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    myGi = new githubService_1.GithubService(syncSetting.Token);
                    if (syncSetting.Gist == null || syncSetting.Gist === "") {
                        yield common.GetGistAndSave(syncSetting).then(function (saved) {
                            if (saved) {
                                Init();
                                return;
                            }
                            else {
                                vscode.window.showErrorMessage("GIST NOT SAVED");
                                return;
                            }
                        }, function (err) {
                            console.error(err);
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    yield StartDownload();
                });
            }
            function StartDownload() {
                return __awaiter(this, void 0, void 0, function* () {
                    myGi.ReadGist(syncSetting.Gist).then(function (res) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (res) {
                                var keys = Object.keys(res.files);
                                if (keys.indexOf(en.FILE_CLOUDSETTINGS_NAME) > -1) {
                                    var cloudSett = JSON.parse(res.files[en.FILE_CLOUDSETTINGS_NAME].content);
                                    var stat = (syncSetting.lastUpload == cloudSett.lastUpload) || (syncSetting.lastDownload == cloudSett.lastUpload);
                                    if (stat) {
                                        vscode.window.showInformationMessage("Sync : You already have latest version of saved settings.");
                                        return;
                                    }
                                    syncSetting.lastDownload = cloudSett.lastUpload;
                                }
                                for (var i = 0; i < keys.length; i++) {
                                    switch (keys[i]) {
                                        case "launch.json": {
                                            yield fileManager_1.FileManager.WriteFile(en.FILE_LAUNCH, res.files[en.FILE_LAUNCH_NAME].content).then(function (added) {
                                                vscode.window.showInformationMessage("Launch Settings downloaded Successfully");
                                            }, function (error) {
                                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                return;
                                            });
                                            break;
                                        }
                                        case "settings.json": {
                                            yield fileManager_1.FileManager.WriteFile(en.FILE_SETTING, res.files[en.FILE_SETTING_NAME].content).then(function (added) {
                                                vscode.window.showInformationMessage("Editor Settings downloaded Successfully");
                                            }, function (error) {
                                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                return;
                                            });
                                            break;
                                        }
                                        case en.FILE_KEYBINDING_DEFAULT:
                                        case en.FILE_KEYBINDING_MAC: {
                                            var sourceKeyBinding = "";
                                            if (en.OsType == enums_1.OsType.Mac) {
                                                sourceKeyBinding = en.FILE_KEYBINDING_MAC;
                                            }
                                            else {
                                                sourceKeyBinding = en.FILE_KEYBINDING_DEFAULT;
                                            }
                                            yield fileManager_1.FileManager.WriteFile(en.FILE_KEYBINDING, res.files[sourceKeyBinding].content).then(function (added) {
                                                if (en.OsType == enums_1.OsType.Mac) {
                                                    vscode.window.showInformationMessage("Keybinding Settings for Mac downloaded Successfully");
                                                }
                                                else {
                                                    vscode.window.showInformationMessage("Keybinding Settings downloaded Successfully");
                                                }
                                            }, function (error) {
                                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                return;
                                            });
                                            break;
                                        }
                                        case "locale.json": {
                                            yield fileManager_1.FileManager.WriteFile(en.FILE_LOCALE, res.files[en.FILE_LOCALE_NAME].content).then(function (added) {
                                                vscode.window.showInformationMessage("Locale Settings downloaded Successfully");
                                            }, function (error) {
                                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                return;
                                            });
                                            break;
                                        }
                                        case "extensions.json": {
                                            var extensionlist = pluginService_1.PluginService.CreateExtensionList();
                                            extensionlist.sort(function (a, b) {
                                                return a.name.localeCompare(b.name);
                                            });
                                            var remoteList = pluginService_1.ExtensionInformation.fromJSONList(res.files[en.FILE_EXTENSION_NAME].content);
                                            var deletedList = pluginService_1.PluginService.GetDeletedExtensions(remoteList);
                                            for (var deletedItemIndex = 0; deletedItemIndex < deletedList.length; deletedItemIndex++) {
                                                var deletedExtension = deletedList[deletedItemIndex];
                                                yield pluginService_1.PluginService.DeleteExtension(deletedExtension, en.ExtensionFolder)
                                                    .then((res) => {
                                                    vscode.window.showInformationMessage(deletedExtension.name + '-' + deletedExtension.version + " is removed.");
                                                }, (rej) => {
                                                    vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                });
                                            }
                                            var missingList = pluginService_1.PluginService.GetMissingExtensions(remoteList);
                                            if (missingList.length == 0) {
                                                vscode.window.showInformationMessage("No extension need to be installed");
                                            }
                                            else {
                                                var actionList = new Array();
                                                vscode.window.setStatusBarMessage("Sync : Installing Extensions in background.");
                                                missingList.forEach(element => {
                                                    actionList.push(pluginService_1.PluginService.InstallExtension(element, en.ExtensionFolder)
                                                        .then(function () {
                                                        var name = element.publisher + '.' + element.name + '-' + element.version;
                                                        vscode.window.showInformationMessage("Extension " + name + " installed Successfully");
                                                    }));
                                                });
                                                Promise.all(actionList)
                                                    .then(function () {
                                                    vscode.window.setStatusBarMessage("Sync : Restart Required to use installed extensions.");
                                                    vscode.window.showInformationMessage("Extension installed Successfully, please restart");
                                                })
                                                    .catch(function (e) {
                                                    console.error(e);
                                                    vscode.window.setStatusBarMessage("Sync : Extensions Download Failed.", 3000);
                                                    vscode.window.showErrorMessage("Extension download failed." + common.ERROR_MESSAGE);
                                                });
                                            }
                                            break;
                                        }
                                        default: {
                                            if (i < keys.length && keys[i].indexOf("keybinding") == -1) {
                                                if (keys[i].indexOf(".") > -1) {
                                                    yield fileManager_1.FileManager.CreateDirectory(en.FOLDER_SNIPPETS);
                                                    var file = en.FOLDER_SNIPPETS.concat(keys[i]); //.concat(".json");
                                                    var fileName = keys[i]; //.concat(".json");
                                                    yield fileManager_1.FileManager.WriteFile(file, res.files[keys[i]].content).then(function (added) {
                                                        vscode.window.showInformationMessage(fileName + " snippet added successfully.");
                                                    }, function (error) {
                                                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                                        return;
                                                    });
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                console.log(res);
                                vscode.window.showErrorMessage("GIST UNABLE TO READ");
                            }
                            yield common.SaveSettings(syncSetting).then(function (added) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (added) {
                                        vscode.window.showInformationMessage("Sync : Download Complete.");
                                    }
                                    else {
                                        vscode.window.showErrorMessage("Sync : Unable to save extension setting file.");
                                    }
                                });
                            }, function (errSave) {
                                console.error(errSave);
                                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                return;
                            });
                        });
                    }, function (err) {
                        console.error(err);
                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                        return;
                    });
                });
            }
        }));
        var resetSettings = vscode.commands.registerCommand('extension.resetSettings', () => __awaiter(this, void 0, void 0, function* () {
            var en = new environmentPath_1.Environment(context);
            var fManager;
            var common = new commons.Commons(en);
            var syncSetting = new setting_1.LocalSetting();
            yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
                syncSetting = resolve;
                yield Init();
            }), (reject) => {
                console.error(reject);
                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
            });
            function Init() {
                return __awaiter(this, void 0, void 0, function* () {
                    vscode.window.setStatusBarMessage("Sync : Resetting Your Settings.", 2000);
                    try {
                        syncSetting.Token = null;
                        syncSetting.Gist = null;
                        syncSetting.lastDownload = null;
                        syncSetting.lastUpload = null;
                        yield common.SaveSettings(syncSetting).then(function (added) {
                            if (added) {
                                vscode.window.showInformationMessage("GIST ID and Github Token Cleared.");
                            }
                        }, function (err) {
                            console.error(err);
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    catch (err) {
                        console.error(err);
                        vscode.window.showErrorMessage("Unable to clear settings. Error Logged on console. Please open an issue.");
                    }
                });
            }
        }));
        var releaseNotes = vscode.commands.registerCommand('extension.releaseNotes', () => __awaiter(this, void 0, void 0, function* () {
            openurl("http://shanalikhan.github.io/2016/05/14/Visual-studio-code-sync-settings-release-notes.html");
        }));
        var openSettings = vscode.commands.registerCommand('extension.openSettings', () => __awaiter(this, void 0, void 0, function* () {
            openurl("http://shanalikhan.github.io/2016/07/31/Visual-Studio-code-sync-setting-edit-manually.html");
            vscode.window.showInformationMessage("Use 'How To Configure' command to setup for first time. Link is opened in case you need help to edit JSON manually.");
            var en = new environmentPath_1.Environment(context);
            var fManager;
            var common = new commons.Commons(en);
            var syncSetting = yield common.InitSettings();
            var setting = vscode.Uri.file(en.APP_SETTINGS);
            vscode.workspace.openTextDocument(setting).then((a) => {
                vscode.window.showTextDocument(a, 1, false);
            });
        }));
        var howSettings = vscode.commands.registerCommand('extension.HowSettings', () => __awaiter(this, void 0, void 0, function* () {
            openurl("http://shanalikhan.github.io/2015/12/15/Visual-Studio-Code-Sync-Settings.html");
        }));
        var openIssue = vscode.commands.registerCommand('extension.OpenIssue', () => __awaiter(this, void 0, void 0, function* () {
            openurl("https://github.com/shanalikhan/code-settings-sync/issues/new");
        }));
        var autoSync = vscode.commands.registerCommand('extension.autoSync', () => __awaiter(this, void 0, void 0, function* () {
            var en = new environmentPath_1.Environment(context);
            var common = new commons.Commons(en);
            var setting = new setting_1.LocalSetting();
            yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!resolve) {
                    vscode.commands.executeCommand('extension.HowSettings');
                    return;
                }
                setting = resolve;
                var tokenAvailable = setting.Token != null || setting.Token != "";
                var gistAvailable = setting.Gist != null || setting.Gist != "";
                if (!tokenAvailable || !gistAvailable) {
                    vscode.commands.executeCommand('extension.HowSettings');
                    return;
                }
                if (setting.autoSync) {
                    setting.autoSync = false;
                }
                else {
                    setting.autoSync = true;
                }
                yield common.SaveSettings(setting).then(function (added) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (added) {
                            if (setting.autoSync) {
                                vscode.window.showInformationMessage("Sync : Auto Download turned ON upon VSCode Startup.");
                            }
                            else {
                                vscode.window.showInformationMessage("Sync : Auto Download turned OFF upon VSCode Startup.");
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("Unable to set the autosync.");
                        }
                    });
                }, function (err) {
                    console.error(err);
                    vscode.window.showErrorMessage("Unable to toggle auto sync. Please open an issue.");
                });
            }), (reject) => {
                console.error(reject);
                vscode.window.showErrorMessage(common.ERROR_MESSAGE);
            });
        }));
        context.subscriptions.push(updateSettings);
        context.subscriptions.push(downloadSettings);
        context.subscriptions.push(resetSettings);
        context.subscriptions.push(releaseNotes);
        context.subscriptions.push(openSettings);
        context.subscriptions.push(howSettings);
        context.subscriptions.push(openIssue);
        context.subscriptions.push(autoSync);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map