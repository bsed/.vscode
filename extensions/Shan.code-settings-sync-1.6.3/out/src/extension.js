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
const pluginService = require('./pluginService');
const envir = require('./environmentPath');
const fileManager = require('./fileManager');
const fileManager_1 = require('./fileManager');
const commons = require('./commons');
const myGit = require('./githubService');
const enums_1 = require('./enums');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    var openurl = require('open');
    var fs = require('fs');
    var GitHubApi = require("github4");
    var github = new GitHubApi({
        version: "3.0.0"
    });
    var disposable = vscode.commands.registerCommand('extension.updateSettings', () => __awaiter(this, void 0, void 0, function* () {
        var en = new envir.Environment(context);
        var common = new commons.Commons(en);
        var myGi = null;
        function Init() {
            return __awaiter(this, void 0, void 0, function* () {
                vscode.window.setStatusBarMessage("Sync : Checking for Github Token and GIST.", 2000);
                var syncSetting = yield common.InitSettings();
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
                    myGi = new myGit.GithubService(syncSetting.Token);
                    vscode.window.setStatusBarMessage("Sync : Uploading / Updating Your Settings In Github.", 3000);
                    yield startGitProcess(syncSetting);
                    return;
                }
            });
        }
        function startGitProcess(sett) {
            return __awaiter(this, void 0, void 0, function* () {
                if (sett.Token != null) {
                    var allSettingFiles = new Array();
                    vscode.window.setStatusBarMessage("Sync : Reading Settings and Extensions.", 1000);
                    yield fileManager.FileManager.FileExists(en.FILE_SETTING).then(function (fileExists) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (fileExists) {
                                yield fileManager.FileManager.ReadFile(en.FILE_SETTING).then(function (settings) {
                                    if (settings) {
                                        var fileName = en.FILE_SETTING_NAME;
                                        var filePath = en.FILE_SETTING;
                                        var fileContent = settings;
                                        var file = new fileManager_1.File(fileName, fileContent, filePath);
                                        allSettingFiles.push(file);
                                    }
                                });
                            }
                        });
                    });
                    yield fileManager.FileManager.FileExists(en.FILE_LAUNCH).then(function (fileExists) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (fileExists) {
                                yield fileManager.FileManager.ReadFile(en.FILE_LAUNCH).then(function (launch) {
                                    if (launch) {
                                        var fileName = en.FILE_LAUNCH_NAME;
                                        var filePath = en.FILE_LAUNCH;
                                        var fileContent = launch;
                                        var file = new fileManager_1.File(fileName, fileContent, filePath);
                                        allSettingFiles.push(file);
                                    }
                                });
                            }
                        });
                    });
                    var destinationKeyBinding = "";
                    if (en.OsType == enums_1.OsType.Mac) {
                        destinationKeyBinding = en.FILE_KEYBINDING_MAC;
                    }
                    else {
                        destinationKeyBinding = en.FILE_KEYBINDING_DEFAULT;
                    }
                    yield fileManager.FileManager.FileExists(en.FILE_KEYBINDING).then(function (fileExists) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (fileExists) {
                                yield fileManager.FileManager.ReadFile(en.FILE_KEYBINDING).then(function (keybinding) {
                                    if (keybinding) {
                                        var fileName = destinationKeyBinding;
                                        var filePath = en.FILE_KEYBINDING;
                                        var fileContent = keybinding;
                                        var file = new fileManager_1.File(fileName, fileContent, filePath);
                                        allSettingFiles.push(file);
                                    }
                                });
                            }
                        });
                    });
                    yield fileManager.FileManager.FileExists(en.FILE_LOCALE).then(function (fileExists) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (fileExists) {
                                yield fileManager.FileManager.ReadFile(en.FILE_LOCALE).then(function (locale) {
                                    if (locale) {
                                        var fileName = en.FILE_LOCALE_NAME;
                                        var filePath = en.FILE_LOCALE;
                                        var fileContent = locale;
                                        var file = new fileManager_1.File(fileName, fileContent, filePath);
                                        allSettingFiles.push(file);
                                    }
                                });
                            }
                        });
                    });
                    var extensionlist = pluginService.PluginService.CreateExtensionList();
                    extensionlist.sort(function (a, b) {
                        return a.name.localeCompare(b.name);
                    });
                    var fileName = en.FILE_EXTENSION_NAME;
                    var filePath = en.FILE_EXTENSION;
                    var fileContent = JSON.stringify(extensionlist, undefined, 2);
                    ;
                    var file = new fileManager_1.File(fileName, fileContent, filePath);
                    allSettingFiles.push(file);
                    var snippetFiles = yield fileManager.FileManager.ListFiles(en.FOLDER_SNIPPETS);
                    snippetFiles.forEach(snippetFile => {
                        allSettingFiles.push(snippetFile);
                    });
                    if (sett.Gist == null || sett.Gist === "") {
                        yield myGi.CreateNewGist(allSettingFiles).then(function (gistID) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (gistID) {
                                    sett.Gist = gistID;
                                    yield common.SaveSettings(sett).then(function (added) {
                                        if (added) {
                                            vscode.window.showInformationMessage("Uploaded Successfully." + " GIST ID :  " + gistID + " . Please copy and use this ID in other machines to sync all settings.");
                                            vscode.window.setStatusBarMessage("Sync : Gist Saved.", 1000);
                                        }
                                    }, function (err) {
                                        console.error(err);
                                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                        return;
                                    });
                                }
                                else {
                                    vscode.window.showErrorMessage("GIST ID: undefined" + common.ERROR_MESSAGE);
                                    return;
                                }
                            });
                        }, function (error) {
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                    else {
                        yield myGi.ExistingGist(sett.Gist, allSettingFiles).then(function (added) {
                            vscode.window.showInformationMessage("Settings Updated Successfully");
                        }, function (error) {
                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                            return;
                        });
                    }
                }
                else {
                    vscode.window.showErrorMessage("ERROR ! Github Account Token Not Set");
                }
            });
        }
        yield Init();
    }));
    var disposable = vscode.commands.registerCommand('extension.downloadSettings', () => __awaiter(this, void 0, void 0, function* () {
        var en = new envir.Environment(context);
        var common = new commons.Commons(en);
        var myGi = null;
        function Init() {
            return __awaiter(this, void 0, void 0, function* () {
                vscode.window.setStatusBarMessage("Sync : Checking for Github Token and GIST.", 2000);
                var syncSetting = yield common.InitSettings();
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
                myGi = new myGit.GithubService(syncSetting.Token);
                if (syncSetting.Gist == null || syncSetting.Gist == "") {
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
                yield StartDownload(syncSetting.Gist);
            });
        }
        function StartDownload(gist) {
            return __awaiter(this, void 0, void 0, function* () {
                myGi.DownloadGist(gist).then(function (res) {
                    return __awaiter(this, void 0, void 0, function* () {
                        var keys = Object.keys(res.files);
                        for (var i = 0; i < keys.length; i++) {
                            switch (keys[i]) {
                                case "launch.json": {
                                    yield fileManager.FileManager.WriteFile(en.FILE_LAUNCH, res.files[en.FILE_LAUNCH_NAME].content).then(function (added) {
                                        vscode.window.showInformationMessage("Launch Settings downloaded Successfully");
                                    }, function (error) {
                                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                        return;
                                    });
                                    break;
                                }
                                case "settings.json": {
                                    yield fileManager.FileManager.WriteFile(en.FILE_SETTING, res.files[en.FILE_SETTING_NAME].content).then(function (added) {
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
                                    yield fileManager.FileManager.WriteFile(en.FILE_KEYBINDING, res.files[sourceKeyBinding].content).then(function (added) {
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
                                    yield fileManager.FileManager.WriteFile(en.FILE_LOCALE, res.files[en.FILE_LOCALE_NAME].content).then(function (added) {
                                        vscode.window.showInformationMessage("Locale Settings downloaded Successfully");
                                    }, function (error) {
                                        vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                        return;
                                    });
                                    break;
                                }
                                case "extensions.json": {
                                    var extensionlist = pluginService.PluginService.CreateExtensionList();
                                    extensionlist.sort(function (a, b) {
                                        return a.name.localeCompare(b.name);
                                    });
                                    var remoteList = pluginService.ExtensionInformation.fromJSONList(res.files[en.FILE_EXTENSION_NAME].content);
                                    var deletedList = pluginService.PluginService.GetDeletedExtensions(remoteList);
                                    for (var deletedItemIndex = 0; deletedItemIndex < deletedList.length; deletedItemIndex++) {
                                        var deletedExtension = deletedList[deletedItemIndex];
                                        yield pluginService.PluginService.DeleteExtension(deletedExtension, en.ExtensionFolder)
                                            .then((res) => {
                                            vscode.window.showInformationMessage(deletedExtension.name + '-' + deletedExtension.version + " is removed.");
                                        }, (rej) => {
                                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                        });
                                    }
                                    var missingList = pluginService.PluginService.GetMissingExtensions(remoteList);
                                    if (missingList.length == 0) {
                                        vscode.window.showInformationMessage("No extension need to be installed");
                                    }
                                    else {
                                        var actionList = new Array();
                                        vscode.window.setStatusBarMessage("Sync : Installing Extensions in background.");
                                        missingList.forEach(element => {
                                            actionList.push(pluginService.PluginService.InstallExtension(element, en.ExtensionFolder)
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
                                            console.log(e);
                                            vscode.window.setStatusBarMessage("Sync : Extensions Download Failed.", 3000);
                                            vscode.window.showErrorMessage("Extension download failed." + common.ERROR_MESSAGE);
                                        });
                                    }
                                    break;
                                }
                                default: {
                                    if (i < keys.length) {
                                        yield fileManager.FileManager.CreateDirectory(en.FOLDER_SNIPPETS);
                                        var file = en.FOLDER_SNIPPETS.concat(keys[i]); //.concat(".json");
                                        var fileName = keys[i]; //.concat(".json");
                                        yield fileManager.FileManager.WriteFile(file, res.files[keys[i]].content).then(function (added) {
                                            vscode.window.showInformationMessage(fileName + " snippet added successfully.");
                                        }, function (error) {
                                            vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                                            return;
                                        });
                                    }
                                    break;
                                }
                            }
                        }
                    });
                }, function (err) {
                    vscode.window.showErrorMessage(common.ERROR_MESSAGE);
                    return;
                });
            });
        }
        yield Init();
    }));
    var disposable = vscode.commands.registerCommand('extension.resetSettings', () => __awaiter(this, void 0, void 0, function* () {
        var en = new envir.Environment(context);
        var fManager;
        var common = new commons.Commons(en);
        var syncSetting = yield common.InitSettings();
        vscode.window.setStatusBarMessage("Sync : Resetting Your Settings.", 2000);
        try {
            syncSetting.Token = null;
            syncSetting.Gist = null;
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
            console.log(err);
            vscode.window.showErrorMessage("Unable to clear settings. Error Logged on console. Please open an issue.");
        }
    }));
    var disposable = vscode.commands.registerCommand('extension.releaseNotes', () => __awaiter(this, void 0, void 0, function* () {
        openurl("http://shanalikhan.github.io/2016/05/14/Visual-studio-code-sync-settings-release-notes.html");
    }));
    var disposable = vscode.commands.registerCommand('extension.openSettings', () => __awaiter(this, void 0, void 0, function* () {
        openurl("http://shanalikhan.github.io/2016/07/31/Visual-Studio-code-sync-setting-edit-manually.html");
        vscode.window.showInformationMessage("If the extension is not setup then use How To Configure command to setup this extension.");
        vscode.window.showInformationMessage("Read link is opened if you need help in editing the JSON File manually.");
        var en = new envir.Environment(context);
        var fManager;
        var common = new commons.Commons(en);
        var syncSetting = yield common.InitSettings();
        var setting = vscode.Uri.file(en.APP_SETTINGS);
        vscode.workspace.openTextDocument(setting).then((a) => {
            vscode.window.showTextDocument(a, 1, false);
        });
    }));
    var disposable = vscode.commands.registerCommand('extension.HowSettings', () => __awaiter(this, void 0, void 0, function* () {
        openurl("http://shanalikhan.github.io/2015/12/15/Visual-Studio-Code-Sync-Settings.html");
    }));
    var disposable = vscode.commands.registerCommand('extension.OpenIssue', () => __awaiter(this, void 0, void 0, function* () {
        openurl("https://github.com/shanalikhan/code-settings-sync/issues/new");
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map