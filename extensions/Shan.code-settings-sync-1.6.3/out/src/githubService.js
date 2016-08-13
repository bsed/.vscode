"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var GitHubApi = require("github4");
var github = new GitHubApi({
    version: "3.0.0"
});
class GithubService {
    constructor(TOKEN) {
        this.TOKEN = TOKEN;
        this.GIST_JSON_EMPTY = {
            "description": "Visual Studio code settings",
            "public": false,
            "files": {
                "settings.json": {
                    "content": "// Empty"
                },
                "launch.json": {
                    "content": "// Empty"
                },
                "keybindings.json": {
                    "content": "// Empty"
                },
                "extensions.json": {
                    "content": "// Empty"
                },
                "locale.json": {
                    "content": "// Empty"
                },
                "keybindingsMac.json": {
                    "content": "// Empty"
                }
            }
        };
        this.GIST_JSON = null;
        github.authenticate({
            type: "oauth",
            token: TOKEN
        });
    }
    AddFile(list, GIST_JSON_b) {
        for (var i = 0; i < list.length; i++) {
            var file = list[i];
            GIST_JSON_b.files[file.fileName] = {};
            GIST_JSON_b.files[file.fileName].content = file.content;
        }
        return GIST_JSON_b;
    }
    CreateNewGist(files) {
        var me = this;
        return new Promise((resolve, reject) => {
            me.GIST_JSON_EMPTY = me.AddFile(files, me.GIST_JSON_EMPTY);
            github.getGistsApi().create(me.GIST_JSON_EMPTY, function (err, res) {
                if (err != null) {
                    console.error(err);
                    reject(false);
                }
                resolve(res.id);
            });
        });
    }
    ExistingGist(GIST, files) {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield github.getGistsApi().get({ id: GIST }, function (er, res) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (er) {
                            console.error(er);
                            reject(false);
                        }
                        else {
                            var allFiles = Object.keys(res.files);
                            for (var fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
                                var fileName = allFiles[fileIndex];
                                if (fileName.indexOf(".") < 0) {
                                    res.files[fileName] = null;
                                }
                                var exists = false;
                                files.forEach((settingFile) => {
                                    if (settingFile.fileName == fileName) {
                                        exists = true;
                                    }
                                });
                                if (!exists && !fileName.startsWith("keybindings")) {
                                    res.files[fileName] = null;
                                }
                            }
                            res = me.AddFile(files, res);
                            yield github.getGistsApi().edit(res, function (ere, ress) {
                                if (ere) {
                                    console.error(er);
                                    reject(false);
                                }
                                resolve(true);
                            });
                        }
                    });
                });
            }));
        });
    }
    DownloadGist(gistID) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield github.getGistsApi().get({ id: gistID }, function (er, res) {
                    if (er) {
                        console.log(er);
                        reject(er);
                    }
                    resolve(res);
                });
            }));
        });
    }
}
exports.GithubService = GithubService;
//# sourceMappingURL=githubService.js.map