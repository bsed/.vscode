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
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        //migration code starts
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
                        if (mainSyncSetting.showSummary) {
                            newSetting.showSummary = mainSyncSetting.showSummary;
                        }
                        if (mainSyncSetting.lastDownload) {
                            newSetting.lastDownload = mainSyncSetting.lastDownload;
                        }
                        if (mainSyncSetting.lastUpload) {
                            newSetting.lastUpload = mainSyncSetting.lastUpload;
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
            common.LogException(reject, common.ERROR_MESSAGE);
        });
        //migration code ends
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
            var allSettingFiles = new Array();
            var uploadedExtensions = new Array();
            yield common.InitSettings().then((resolve) => __awaiter(this, void 0, void 0, function* () {
                syncSetting = resolve;
                yield Init();
            }), (reject) => {
                common.LogException(reject, common.ERROR_MESSAGE);
                return;
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
                            common.LogException(err, common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    else {
                        myGi = new githubService_1.GithubService(syncSetting.Token);
                        vscode.window.setStatusBarMessage("Sync : Uploading / Updating Your Settings In Github.");
                        yield startGitProcess();
                    }
                });
            }
            function startGitProcess() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (syncSetting.Token != null && syncSetting.Token != "") {
                        syncSetting.lastUpload = dateNow;
                        vscode.window.setStatusBarMessage("Sync : Reading Settings and Extensions.");
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
                        uploadedExtensions = pluginService_1.PluginService.CreateExtensionList();
                        uploadedExtensions.sort(function (a, b) {
                            return a.name.localeCompare(b.name);
                        });
                        var fileName = en.FILE_EXTENSION_NAME;
                        var filePath = en.FILE_EXTENSION;
                        var fileContent = JSON.stringify(uploadedExtensions, undefined, 2);
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
                                        vscode.window.setStatusBarMessage("Sync : Empty GIST ID: " + syncSetting.Gist + " Created To Insert Files, in Process...");
                                    }
                                    else {
                                        vscode.window.showInformationMessage("GIST UNABLE TO CREATE");
                                        return;
                                    }
                                });
                            }, function (error) {
                                common.LogException(error, common.ERROR_MESSAGE);
                                return;
                            });
                        }
                        yield myGi.ReadGist(syncSetting.Gist).then(function (gistObj) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (gistObj) {
                                    vscode.window.setStatusBarMessage("Sync : Uploading Files Data.");
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
                                                        if (syncSetting.showSummary) {
                                                            common.GenerateSummmaryFile(true, allSettingFiles, null, uploadedExtensions, syncSetting);
                                                        }
                                                        vscode.window.setStatusBarMessage("");
                                                    }
                                                }, function (err) {
                                                    common.LogException(err, common.ERROR_MESSAGE);
                                                    return;
                                                });
                                            }
                                            else {
                                                vscode.window.showErrorMessage("GIST NOT SAVED");
                                                return;
                                            }
                                        });
                                    }, function (error) {
                                        common.LogException(error, common.ERROR_MESSAGE);
                                        return;
                                    });
                                }
                                else {
                                    vscode.window.showErrorMessage("GIST ID: " + syncSetting.Gist + " UNABLE TO READ.");
                                    return;
                                }
                            });
                        }, function (gistReadError) {
                            common.LogException(gistReadError, common.ERROR_MESSAGE);
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
                common.LogException(reject, common.ERROR_MESSAGE);
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
                            common.LogException(err, common.ERROR_MESSAGE);
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
                            common.LogException(err, common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    yield StartDownload();
                });
            }
            function StartDownload() {
                return __awaiter(this, void 0, void 0, function* () {
                    vscode.window.setStatusBarMessage("Sync : Reading Settings Online.");
                    myGi.ReadGist(syncSetting.Gist).then(function (res) {
                        return __awaiter(this, void 0, void 0, function* () {
                            var addedExtensions = new Array();
                            var deletedExtensions = new Array();
                            var updatedFiles = new Array();
                            var actionList = new Array();
                            if (res) {
                                var keys = Object.keys(res.files);
                                if (keys.indexOf(en.FILE_CLOUDSETTINGS_NAME) > -1) {
                                    var cloudSett = JSON.parse(res.files[en.FILE_CLOUDSETTINGS_NAME].content);
                                    var stat = (syncSetting.lastUpload == cloudSett.lastUpload) || (syncSetting.lastDownload == cloudSett.lastUpload);
                                    if (stat) {
                                        vscode.window.showInformationMessage("Sync : You already have latest version of saved settings.");
                                        vscode.window.setStatusBarMessage("");
                                        return;
                                    }
                                    syncSetting.lastDownload = cloudSett.lastUpload;
                                }
                                keys.forEach(fileName => {
                                    if (fileName.indexOf(".") > -1) {
                                        var f = new fileManager_1.File(fileName, res.files[fileName].content, null);
                                        updatedFiles.push(f);
                                    }
                                });
                                for (var index = 0; index < updatedFiles.length; index++) {
                                    var file = updatedFiles[index];
                                    var path = null;
                                    var writeFile = false;
                                    var sourceKeyBinding = false;
                                    var keyBindingWritten = false;
                                    var content = null;
                                    switch (file.fileName) {
                                        case en.FILE_LAUNCH_NAME: {
                                            writeFile = true;
                                            path = en.FILE_LAUNCH;
                                            content = file.content;
                                            break;
                                        }
                                        case en.FILE_SETTING_NAME: {
                                            writeFile = true;
                                            path = en.FILE_SETTING;
                                            content = file.content;
                                            break;
                                        }
                                        case en.FILE_KEYBINDING_DEFAULT: {
                                            writeFile = true;
                                            path = en.FILE_KEYBINDING;
                                            if (!keyBindingWritten) {
                                                if (en.OsType == enums_1.OsType.Mac) {
                                                    var specifiedKeybindingIndex = updatedFiles.findIndex(a => a.fileName == en.FILE_KEYBINDING_MAC);
                                                    content = updatedFiles[specifiedKeybindingIndex].content;
                                                }
                                                else {
                                                    var specifiedKeybindingIndex = updatedFiles.findIndex(a => a.fileName == en.FILE_KEYBINDING_DEFAULT);
                                                    content = updatedFiles[specifiedKeybindingIndex].content;
                                                }
                                                sourceKeyBinding = true;
                                            }
                                            break;
                                        }
                                        case en.FILE_KEYBINDING_MAC: {
                                            writeFile = true;
                                            path = en.FILE_KEYBINDING;
                                            if (!keyBindingWritten) {
                                                if (en.OsType == enums_1.OsType.Mac) {
                                                    var specifiedKeybindingIndex = updatedFiles.findIndex(a => a.fileName == en.FILE_KEYBINDING_MAC);
                                                    content = updatedFiles[specifiedKeybindingIndex].content;
                                                }
                                                else {
                                                    var specifiedKeybindingIndex = updatedFiles.findIndex(a => a.fileName == en.FILE_KEYBINDING_DEFAULT);
                                                    content = updatedFiles[specifiedKeybindingIndex].content;
                                                }
                                                sourceKeyBinding = true;
                                            }
                                            break;
                                        }
                                        case en.FILE_LOCALE_NAME: {
                                            writeFile = true;
                                            path = en.FILE_LOCALE;
                                            content = file.content;
                                            break;
                                        }
                                        case en.FILE_EXTENSION_NAME: {
                                            writeFile = false;
                                            var extensionlist = pluginService_1.PluginService.CreateExtensionList();
                                            extensionlist.sort(function (a, b) {
                                                return a.name.localeCompare(b.name);
                                            });
                                            var remoteList = pluginService_1.ExtensionInformation.fromJSONList(file.content);
                                            var deletedList = pluginService_1.PluginService.GetDeletedExtensions(remoteList);
                                            for (var deletedItemIndex = 0; deletedItemIndex < deletedList.length; deletedItemIndex++) {
                                                var deletedExtension = deletedList[deletedItemIndex];
                                                (function (deletedExtension, ExtensionFolder) {
                                                    return __awaiter(this, void 0, void 0, function* () {
                                                        yield actionList.push(pluginService_1.PluginService.DeleteExtension(deletedExtension, en.ExtensionFolder)
                                                            .then((res) => {
                                                            //vscode.window.showInformationMessage(deletedExtension.name + '-' + deletedExtension.version + " is removed.");
                                                            deletedExtensions.push(deletedExtension);
                                                        }, (rej) => {
                                                            common.LogException(rej, common.ERROR_MESSAGE);
                                                        }));
                                                    });
                                                }(deletedExtension, en.ExtensionFolder));
                                            }
                                            var missingList = pluginService_1.PluginService.GetMissingExtensions(remoteList);
                                            if (missingList.length == 0) {
                                                vscode.window.showInformationMessage("No extension need to be installed");
                                            }
                                            else {
                                                vscode.window.setStatusBarMessage("Sync : Installing Extensions in background.");
                                                missingList.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                                                    yield actionList.push(pluginService_1.PluginService.InstallExtension(element, en.ExtensionFolder)
                                                        .then(function () {
                                                        addedExtensions.push(element);
                                                        //var name = element.publisher + '.' + element.name + '-' + element.version;
                                                        //vscode.window.showInformationMessage("Extension " + name + " installed Successfully");
                                                    }));
                                                }));
                                            }
                                            break;
                                        }
                                        default: {
                                            writeFile = true;
                                            if (file.fileName.indexOf("keybinding") == -1) {
                                                if (file.fileName.indexOf(".") > -1) {
                                                    yield fileManager_1.FileManager.CreateDirectory(en.FOLDER_SNIPPETS);
                                                    var snippetFile = en.FOLDER_SNIPPETS.concat(file.fileName); //.concat(".json");
                                                    path = snippetFile;
                                                    content = file.content;
                                                }
                                            }
                                            break;
                                        }
                                    }
                                    if (writeFile) {
                                        if (sourceKeyBinding) {
                                            keyBindingWritten = true;
                                        }
                                        writeFile = false;
                                        yield actionList.push(fileManager_1.FileManager.WriteFile(path, content).then(function (added) {
                                            //TODO : add Name attribute in File and show information message here with name , when required.
                                        }, function (error) {
                                            common.LogException(error, common.ERROR_MESSAGE);
                                            return;
                                        }));
                                    }
                                }
                            }
                            else {
                                console.log(res);
                                vscode.window.showErrorMessage("GIST UNABLE TO READ");
                            }
                            Promise.all(actionList)
                                .then(function () {
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (!syncSetting.showSummary) {
                                        if (missingList.length == 0) {
                                        }
                                        else {
                                            vscode.window.showInformationMessage("Sync : " + missingList.length + " extensions installed Successfully, Restart Required.");
                                        }
                                        if (deletedExtensions.length > 0) {
                                            vscode.window.showInformationMessage("Sync : " + deletedExtensions.length + " extensions deleted Successfully, Restart Required.");
                                        }
                                    }
                                    yield common.SaveSettings(syncSetting).then(function (added) {
                                        return __awaiter(this, void 0, void 0, function* () {
                                            if (added) {
                                                vscode.window.showInformationMessage("Sync : Download Complete.");
                                                if (syncSetting.showSummary) {
                                                    common.GenerateSummmaryFile(false, updatedFiles, deletedExtensions, addedExtensions, syncSetting);
                                                }
                                                vscode.window.setStatusBarMessage("");
                                            }
                                            else {
                                                vscode.window.showErrorMessage("Sync : Unable to save extension settings file.");
                                            }
                                        });
                                    }, function (errSave) {
                                        common.LogException(errSave, common.ERROR_MESSAGE);
                                        return;
                                    });
                                });
                            })
                                .catch(function (e) {
                                common.LogException(e, common.ERROR_MESSAGE);
                            });
                        });
                    }, function (err) {
                        common.LogException(err, common.ERROR_MESSAGE);
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
                common.LogException(reject, common.ERROR_MESSAGE);
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
                            common.LogException(err, common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    catch (err) {
                        common.LogException(err, "Unable to clear settings. Error Logged on console. Please open an issue.");
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
                    common.LogException(err, "Unable to toggle auto sync. Please open an issue.");
                });
            }), (reject) => {
                common.LogException(reject, common.ERROR_MESSAGE);
                return;
            });
        }));
        var summary = vscode.commands.registerCommand('extension.summary', () => __awaiter(this, void 0, void 0, function* () {
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
                if (setting.showSummary) {
                    setting.showSummary = false;
                }
                else {
                    setting.showSummary = true;
                }
                yield common.SaveSettings(setting).then(function (added) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (added) {
                            if (setting.showSummary) {
                                vscode.window.showInformationMessage("Sync : Summary Will be shown upon download / upload.");
                            }
                            else {
                                vscode.window.showInformationMessage("Sync : Summary Will be hidden upon download / upload.");
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("Unable to set the summary.");
                        }
                    });
                }, function (err) {
                    common.LogException(err, "Unable to toggle summary. Please open an issue.");
                });
            }), (reject) => {
                common.LogException(reject, common.ERROR_MESSAGE);
                return;
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
        context.subscriptions.push(summary);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map