"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var fs = require('fs');
class File {
    constructor(file, content, filePath) {
        this.file = file;
        this.content = content;
        this.filePath = filePath;
        this.fileName = null;
        // this.fileName = file.split('.')[0];
        this.fileName = file;
    }
}
exports.File = File;
class FileManager {
    static FileExists(filePath) {
        return new Promise((resolve, reject) => {
            var stat = fs.existsSync(filePath);
            if (stat) {
                resolve(stat);
            }
            else
                resolve(stat);
        });
    }
    static ReadFile(filePath) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    resolve(data);
                });
            }));
        });
    }
    static WriteFile(filePath, data) {
        return new Promise((resolve, reject) => {
            if (data) {
                fs.writeFile(filePath, data, function (err, data) {
                    if (err) {
                        console.error(err);
                        reject(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                console.error("DATA is EMPTY for " + filePath);
                reject(false);
            }
        });
    }
    static ListFiles(directory) {
        return __awaiter(this, void 0, Promise, function* () {
            var me = this;
            return new Promise((resolve, reject) => {
                fs.readdir(directory, function (err, data) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            console.error(err);
                            reject(null);
                        }
                        var files = new Array();
                        for (var i = 0; i < data.length; i++) {
                            var fileName = data[i];
                            var filePath = directory.concat(fileName);
                            var fileContent = yield me.ReadFile(filePath);
                            var file = new File(fileName, fileContent, filePath);
                            files.push(file);
                        }
                        resolve(files);
                    });
                });
            });
        });
    }
    static DeleteFile(filePath) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                if (filePath) {
                    this.FileExists(filePath).then(function (fileExists) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (fileExists) {
                                yield fs.unlinkSync(filePath);
                            }
                            resolve(true);
                        });
                    });
                }
                else {
                    console.error("DATA is EMPTY for " + filePath);
                    reject(false);
                }
            });
        });
    }
    static CreateDirectory(name) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                if (name) {
                    this.FileExists(name).then(function (dirExist) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!dirExist) {
                                yield fs.mkdirSync(name);
                            }
                            resolve(true);
                        });
                    });
                }
                else {
                    console.error("DATA is EMPTY for " + name);
                    reject(false);
                }
            });
        });
    }
}
exports.FileManager = FileManager;
//# sourceMappingURL=fileManager.js.map