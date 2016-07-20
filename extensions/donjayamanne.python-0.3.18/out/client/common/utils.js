"use strict";
var path = require("path");
var fs = require("fs");
var child_process = require("child_process");
var settings = require("./configSettings");
var IS_WINDOWS = /^win/.test(process.platform);
var PATH_VARIABLE_NAME = IS_WINDOWS ? "Path" : "PATH";
var PathValidity = new Map();
function validatePath(filePath) {
    if (filePath.length === 0) {
        return Promise.resolve("");
    }
    if (PathValidity.has(filePath)) {
        return Promise.resolve(PathValidity.get(filePath) ? filePath : "");
    }
    return new Promise(function (resolve) {
        fs.exists(filePath, function (exists) {
            PathValidity.set(filePath, exists);
            return resolve(exists ? filePath : "");
        });
    });
}
exports.validatePath = validatePath;
var pythonInterpretterDirectory = null;
var previouslyIdentifiedPythonPath = null;
var customEnvVariables = null;
function getPythonInterpreterDirectory() {
    // If we already have it and the python path hasn't changed, yay
    if (pythonInterpretterDirectory && previouslyIdentifiedPythonPath === settings.PythonSettings.getInstance().pythonPath) {
        return Promise.resolve(pythonInterpretterDirectory);
    }
    return new Promise(function (resolve) {
        var pythonFileName = settings.PythonSettings.getInstance().pythonPath;
        // Check if we have the path
        if (path.basename(pythonFileName) === pythonFileName) {
            // No path provided
            return resolve("");
        }
        // If we can execute the python, then get the path from the fullyqualitified name
        child_process.execFile(pythonFileName, ["-c", "print(1234)"], function (error, stdout, stderr) {
            // Yes this is a valid python path
            if (stdout.startsWith("1234")) {
                return resolve(path.dirname(pythonFileName));
            }
            // No idea, didn't work, hence don't reject, but return empty path
            resolve("");
        });
    }).then(function (value) {
        // Cache and return
        previouslyIdentifiedPythonPath = settings.PythonSettings.getInstance().pythonPath;
        return pythonInterpretterDirectory = value;
    }).catch(function () {
        // Don't care what the error is, all we know is that this doesn't work
        return pythonInterpretterDirectory = "";
    });
}
exports.getPythonInterpreterDirectory = getPythonInterpreterDirectory;
function execPythonFile(file, args, cwd, includeErrorAsResponse) {
    if (includeErrorAsResponse === void 0) { includeErrorAsResponse = false; }
    // If running the python file, then always revert to execFileInternal
    // Cuz python interpreter is always a file and we can and will always run it using child_process.execFile()
    if (file === settings.PythonSettings.getInstance().pythonPath) {
        return execFileInternal(file, args, { cwd: cwd }, includeErrorAsResponse);
    }
    return getPythonInterpreterDirectory().then(function (pyPath) {
        // We don't have a path
        if (pyPath.length === 0) {
            return execFileInternal(file, args, { cwd: cwd }, includeErrorAsResponse);
        }
        if (customEnvVariables === null) {
            var pathValue = process.env[PATH_VARIABLE_NAME];
            // Ensure to include the path of the current python 
            var newPath = "";
            if (IS_WINDOWS) {
                newPath = pyPath + "\\" + path.delimiter + path.join(pyPath, "Scripts\\") + path.delimiter + process.env[PATH_VARIABLE_NAME];
                // This needs to be done for windows
                process.env[PATH_VARIABLE_NAME] = newPath;
            }
            else {
                newPath = pyPath + path.delimiter + process.env[PATH_VARIABLE_NAME];
            }
            var customSettings = {};
            customSettings[PATH_VARIABLE_NAME] = newPath;
            customEnvVariables = mergeEnvVariables(customSettings);
        }
        return execFileInternal(file, args, { cwd: cwd, env: customEnvVariables }, includeErrorAsResponse);
    });
}
exports.execPythonFile = execPythonFile;
function handleResponse(file, includeErrorAsResponse, error, stdout, stderr) {
    return new Promise(function (resolve, reject) {
        if (typeof (error) === "object" && error !== null && (error.code === "ENOENT" || error.code === 127)) {
            return reject(error);
        }
        // pylint:
        //      In the case of pylint we have some messages (such as config file not found and using default etc...) being returned in stderr
        //      These error messages are useless when using pylint   
        if (includeErrorAsResponse && (stdout.length > 0 || stderr.length > 0)) {
            return resolve(stdout + "\n" + stderr);
        }
        var hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
        if (hasErrors && (typeof stdout !== "string" || stdout.length === 0)) {
            var errorMsg = (error && error.message) ? error.message : (stderr && stderr.length > 0 ? stderr + "" : "");
            return reject(errorMsg);
        }
        resolve(stdout + "");
    });
}
function execFileInternal(file, args, options, includeErrorAsResponse) {
    return new Promise(function (resolve, reject) {
        child_process.execFile(file, args, options, function (error, stdout, stderr) {
            handleResponse(file, includeErrorAsResponse, error, stdout, stderr).then(resolve, reject);
        });
    });
}
function execInternal(command, args, options, includeErrorAsResponse) {
    return new Promise(function (resolve, reject) {
        child_process.exec([command].concat(args).join(" "), options, function (error, stdout, stderr) {
            handleResponse(command, includeErrorAsResponse, error, stdout, stderr).then(resolve, reject);
        });
    });
}
function mergeEnvVariables(newVariables) {
    for (var setting in process.env) {
        if (!newVariables[setting]) {
            newVariables[setting] = process.env[setting];
        }
    }
    return newVariables;
}
exports.mergeEnvVariables = mergeEnvVariables;
//# sourceMappingURL=utils.js.map