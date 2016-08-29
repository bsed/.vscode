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
const fileManager_1 = require('./fileManager');
class Commons {
    constructor(en) {
        this.en = en;
        this.ERROR_MESSAGE = "Error Logged In Console (Help menu > Toggle Developer Tools). You may open an issue using 'Sync : Open Issue' command.";
    }
    LogException(error, message) {
        console.error(error);
        vscode.window.showErrorMessage(message);
        vscode.window.setStatusBarMessage("");
    }
    //TODO : change any to LocalSetting after max users migrate to new settings.
    InitSettings() {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            //var localSetting: LocalSetting = new LocalSetting();
            var localSetting;
            vscode.window.setStatusBarMessage("Sync : Checking for Github Token and GIST.");
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fileManager_1.FileManager.FileExists(me.en.APP_SETTINGS).then(function (fileExist) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (fileExist) {
                            yield fileManager_1.FileManager.ReadFile(me.en.APP_SETTINGS).then(function (settin) {
                                vscode.window.setStatusBarMessage("");
                                if (settin) {
                                    var set;
                                    set = JSON.parse(settin);
                                    vscode.window.setStatusBarMessage("");
                                    resolve(set);
                                }
                                resolve("");
                            }, function (settingError) {
                                reject(settingError);
                                vscode.window.setStatusBarMessage("");
                            });
                        }
                        else {
                            //var set: LocalSetting = new LocalSetting();
                            var set = null;
                            resolve(set);
                            vscode.window.setStatusBarMessage("");
                        }
                    });
                }, function (err) {
                    reject(err);
                    vscode.window.setStatusBarMessage("");
                });
            }));
        });
    }
    SaveSettings(setting) {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fileManager_1.FileManager.WriteFile(me.en.APP_SETTINGS, JSON.stringify(setting)).then(function (added) {
                    resolve(added);
                }, function (err) {
                    reject(err);
                });
            }));
        });
    }
    GetSettings() {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fileManager_1.FileManager.FileExists(me.en.APP_SETTINGS).then(function (fileExist) {
                    return __awaiter(this, void 0, void 0, function* () {
                        //resolve(fileExist);
                        if (fileExist) {
                            yield fileManager_1.FileManager.ReadFile(me.en.APP_SETTINGS).then(function (settingsData) {
                                if (settingsData) {
                                    resolve(JSON.parse(settingsData));
                                }
                                else {
                                    console.error(me.en.APP_SETTINGS + " not Found.");
                                    resolve(null);
                                }
                            });
                        }
                        else {
                            resolve(null);
                        }
                    });
                }, function (err) {
                    reject(err);
                });
            }));
        });
    }
    GetTokenAndSave(sett) {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            var opt = Commons.GetInputBox(true);
            return new Promise((resolve, reject) => {
                (function getToken() {
                    vscode.window.showInputBox(opt).then((token) => __awaiter(this, void 0, void 0, function* () {
                        if (token && token.trim()) {
                            token = token.trim();
                            if (token != 'esc') {
                                sett.Token = token;
                                yield me.SaveSettings(sett).then(function (saved) {
                                    if (saved) {
                                        vscode.window.setStatusBarMessage("Sync : Token Saved", 1000);
                                    }
                                    resolve(saved);
                                }, function (err) {
                                    reject(err);
                                });
                            }
                        }
                        else {
                            if (token !== 'esc') {
                                getToken();
                            }
                        }
                    }));
                }());
            });
        });
    }
    GetGistAndSave(sett) {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            var opt = Commons.GetInputBox(false);
            return new Promise((resolve, reject) => {
                (function getGist() {
                    vscode.window.showInputBox(opt).then((gist) => __awaiter(this, void 0, void 0, function* () {
                        if (gist && gist.trim()) {
                            gist = gist.trim();
                            if (gist != 'esc') {
                                sett.Gist = gist.trim();
                                yield me.SaveSettings(sett).then(function (saved) {
                                    if (saved) {
                                        vscode.window.setStatusBarMessage("Sync : Gist Saved", 1000);
                                    }
                                    resolve(saved);
                                }, function (err) {
                                    reject(err);
                                });
                            }
                        }
                        else {
                            if (gist !== 'esc') {
                                getGist();
                            }
                        }
                    }));
                })();
            });
        });
    }
    static GetInputBox(token) {
        if (token) {
            let options = {
                placeHolder: "Enter Github Personal Access Token",
                password: false,
                prompt: "Link is opened to get the github token. Enter token and press [Enter] or type 'esc' to cancel."
            };
            return options;
        }
        else {
            let options = {
                placeHolder: "Enter GIST ID",
                password: false,
                prompt: "Enter GIST ID from previously uploaded settings and press [Enter] or type 'esc' to cancel."
            };
            return options;
        }
    }
    ;
    GenerateSummmaryFile(upload, files, removedExtensions, addedExtensions, syncSettings) {
        var header = null;
        var downloaded = "Download";
        var updated = "Upload";
        var status = null;
        if (upload) {
            status = updated;
        }
        else {
            status = downloaded;
        }
        header = "\r\nFiles " + status + ". \r\n";
        var deletedExtension = "\r\nEXTENSIONS REMOVED \r\n";
        var addedExtension = "\r\nEXTENSIONS ADDED \r\n";
        var tempURI = this.en.APP_SUMMARY;
        while (tempURI.indexOf("/") > -1) {
            tempURI = tempURI.replace("/", "\\");
        }
        var setting = vscode.Uri.parse("untitled:" + tempURI);
        vscode.workspace.openTextDocument(setting).then((a) => {
            vscode.window.showTextDocument(a, 1, false).then(e => {
                e.edit(edit => {
                    edit.insert(new vscode.Position(0, 0), "VISUAL STUDIO CODE SETTINGS SYNC \r\n\r\n" + status + " SUMMARY \r\n\r\n");
                    edit.insert(new vscode.Position(1, 0), "-------------------- \r\n");
                    edit.insert(new vscode.Position(3, 0), "GITHUB TOKEN: " + syncSettings.Token + " \r\n");
                    edit.insert(new vscode.Position(4, 0), "GITHUB GIST: " + syncSettings.Gist + " \r\n");
                    edit.insert(new vscode.Position(1, 0), "-------------------- \r\n  \r\n");
                    edit.insert(new vscode.Position(2, 0), header + " \r\n");
                    var row = 5;
                    for (var i = 0; i < files.length; i++) {
                        var element = files[i];
                        if (element.fileName.indexOf(".") > 0) {
                            edit.insert(new vscode.Position(row, 0), element.fileName + " \r\n");
                            row += 1;
                        }
                    }
                    if (removedExtensions) {
                        if (removedExtensions.length > 0) {
                            edit.insert(new vscode.Position(row, 0), deletedExtension + " \r\n");
                            row += 1;
                            removedExtensions.forEach(ext => {
                                edit.insert(new vscode.Position(row, 0), ext.name + " - Version :" + ext.version + " \r\n");
                                row += 1;
                            });
                        }
                    }
                    if (addedExtensions) {
                        row += 1;
                        if (addedExtensions.length > 0) {
                            edit.insert(new vscode.Position(row, 0), " \r\n" + addedExtension + " \r\n");
                            row += 1;
                            addedExtensions.forEach(ext => {
                                edit.insert(new vscode.Position(row, 0), ext.name + " - Version :" + ext.version + " \r\n");
                                row += 1;
                            });
                        }
                    }
                });
            });
        }, (error) => {
            console.error(error);
            return;
        });
    }
    ;
}
exports.Commons = Commons;
//# sourceMappingURL=commons.js.map