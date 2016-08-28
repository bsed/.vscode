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
const fManager = require('./fileManager');
class Commons {
    constructor(en) {
        this.en = en;
        this.ERROR_MESSAGE = "ERROR ! Logged In Console (Help menu > Toggle Developer Tools). Please open an issue in Github Repo using 'Sync : Open Issue' command.";
    }
    //TODO : change any to LocalSetting after max users migrate to new settings.
    InitSettings() {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            //var localSetting: LocalSetting = new LocalSetting();
            var localSetting;
            vscode.window.setStatusBarMessage("Sync : Checking for Github Token and GIST.");
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fManager.FileManager.FileExists(me.en.APP_SETTINGS).then(function (fileExist) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (fileExist) {
                            yield fManager.FileManager.ReadFile(me.en.APP_SETTINGS).then(function (settin) {
                                var set;
                                set = JSON.parse(settin);
                                vscode.window.setStatusBarMessage("");
                                resolve(set);
                                vscode.window.setStatusBarMessage("");
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
                yield fManager.FileManager.WriteFile(me.en.APP_SETTINGS, JSON.stringify(setting)).then(function (added) {
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
                yield fManager.FileManager.FileExists(me.en.APP_SETTINGS).then(function (fileExist) {
                    return __awaiter(this, void 0, void 0, function* () {
                        //resolve(fileExist);
                        if (fileExist) {
                            yield fManager.FileManager.ReadFile(me.en.APP_SETTINGS).then(function (settingsData) {
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
}
exports.Commons = Commons;
//# sourceMappingURL=commons.js.map