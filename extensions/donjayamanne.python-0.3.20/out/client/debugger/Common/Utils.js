"use strict";
var path = require("path");
function CreatePythonThread(id, isWorker, process, name) {
    if (name === void 0) { name = ""; }
    return {
        IsWorkerThread: isWorker,
        Process: process,
        Name: name,
        Id: id,
        Frames: []
    };
}
exports.CreatePythonThread = CreatePythonThread;
function CreatePythonModule(id, fileName) {
    var name = fileName;
    if (typeof fileName === "string") {
        try {
            name = path.basename(fileName);
        }
        catch (ex) {
        }
    }
    else {
        name = "";
    }
    return {
        ModuleId: id,
        Name: name,
        Filename: fileName
    };
}
exports.CreatePythonModule = CreatePythonModule;
function FixupEscapedUnicodeChars(value) {
    return value;
}
exports.FixupEscapedUnicodeChars = FixupEscapedUnicodeChars;
var IdDispenser = (function () {
    function IdDispenser() {
        this._freedInts = [];
        this._curValue = 0;
    }
    IdDispenser.prototype.Allocate = function () {
        if (this._freedInts.length > 0) {
            var res = this._freedInts[this._freedInts.length - 1];
            this._freedInts.splice(this._freedInts.length - 1, 1);
            return res;
        }
        else {
            var res = this._curValue++;
            return res;
        }
    };
    IdDispenser.prototype.Free = function (id) {
        if (id + 1 === this._curValue) {
            this._curValue--;
        }
        else {
            this._freedInts.push(id);
        }
    };
    return IdDispenser;
}());
exports.IdDispenser = IdDispenser;
//# sourceMappingURL=Utils.js.map