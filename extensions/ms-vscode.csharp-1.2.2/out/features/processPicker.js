/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See LICENSE.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var os = require('os');
var vscode = require('vscode');
var child_process = require('child_process');
var AttachPicker = (function () {
    function AttachPicker(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    AttachPicker.prototype.ShowAttachEntries = function () {
        return this.attachItemsProvider.getAttachItems()
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
var Process = (function () {
    function Process(name, pid, commandLine) {
        this.name = name;
        this.pid = pid;
        this.commandLine = commandLine;
    }
    Process.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.pid,
            detail: this.commandLine,
            id: this.pid
        };
    };
    return Process;
}());
var DotNetAttachItemsProviderFactory = (function () {
    function DotNetAttachItemsProviderFactory() {
    }
    DotNetAttachItemsProviderFactory.Get = function () {
        if (os.platform() === 'win32') {
            return new WmicAttachItemsProvider();
        }
        else {
            return new PsAttachItemsProvider();
        }
    };
    return DotNetAttachItemsProviderFactory;
}());
exports.DotNetAttachItemsProviderFactory = DotNetAttachItemsProviderFactory;
var DotNetAttachItemsProvider = (function () {
    function DotNetAttachItemsProvider() {
    }
    DotNetAttachItemsProvider.prototype.getAttachItems = function () {
        return this.getInternalProcessEntries().then(function (processEntries) {
            // localeCompare is significantly slower than < and > (2000 ms vs 80 ms for 10,000 elements)
            // We can change to localeCompare if this becomes an issue
            var dotnetProcessName = (os.platform() === 'win32') ? 'dotnet.exe' : 'dotnet';
            processEntries = processEntries.sort(function (a, b) {
                if (a.name.toLowerCase() === dotnetProcessName && b.name.toLowerCase() === dotnetProcessName) {
                    return a.commandLine.toLowerCase() < b.commandLine.toLowerCase() ? -1 : 1;
                }
                else if (a.name.toLowerCase() === dotnetProcessName) {
                    return -1;
                }
                else if (b.name.toLowerCase() === dotnetProcessName) {
                    return 1;
                }
                else {
                    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
                }
            });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    return DotNetAttachItemsProvider;
}());
var PsAttachItemsProvider = (function (_super) {
    __extends(PsAttachItemsProvider, _super);
    function PsAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(PsAttachItemsProvider, "secondColumnCharacters", {
        // Perf numbers:
        // OS X 10.10
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            272 |        52 |
        // |            296 |        49 |
        // |            384 |        53 |
        // |            784 |       116 |
        //
        // Ubuntu 16.04
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            232 |        26 |
        // |            336 |        34 |
        // |            736 |        62 |
        // |           1039 |       115 |
        // |           1239 |       182 |
        // ps outputs as a table. With the option "ww", ps will use as much width as necessary.
        // However, that only applies to the right-most column. Here we use a hack of setting
        // the column header to 50 a's so that the second column will have at least that many
        // characters. 50 was chosen because that's the maximum length of a "label" in the
        // QuickPick UI in VSCode.
        get: function () { return 50; },
        enumerable: true,
        configurable: true
    });
    PsAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var commColumnTitle = Array(PsAttachItemsProvider.secondColumnCharacters).join("a");
        // the BSD version of ps uses '-c' to have 'comm' only output the executable name and not
        // the full path. The Linux version of ps has 'comm' to only display the name of the executable
        // Note that comm on Linux systems is truncated to 16 characters:
        // https://bugzilla.redhat.com/show_bug.cgi?id=429565
        // Since 'args' contains the full path to the executable, even if truncated, searching will work as desired.
        var psCommand = ("ps -axww -o pid=,comm=" + commColumnTitle + ",args=") + (os.platform() === 'darwin' ? ' -c' : '');
        return execChildProcess(psCommand, null).then(function (processes) {
            return _this.parseProcessFromPs(processes);
        });
    };
    // Only public for tests.
    PsAttachItemsProvider.prototype.parseProcessFromPs = function (processes) {
        var lines = processes.split(os.EOL);
        var processEntries = [];
        // lines[0] is the header of the table
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var process_1 = this.parseLineFromPs(line);
            processEntries.push(process_1);
        }
        return processEntries;
    };
    PsAttachItemsProvider.prototype.parseLineFromPs = function (line) {
        // Explanation of the regex:
        //   - any leading whitespace
        //   - PID
        //   - whitespace
        //   - executable name --> this is PsAttachItemsProvider.secondColumnCharacters - 1 because ps reserves one character
        //     for the whitespace separator
        //   - whitespace
        //   - args (might be empty)
        var psEntry = new RegExp("^\\s*([0-9]+)\\s+(.{" + (PsAttachItemsProvider.secondColumnCharacters - 1) + "})\\s+(.*)$");
        var matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            var pid = matches[1].trim();
            var executable = matches[2].trim();
            var cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    };
    return PsAttachItemsProvider;
}(DotNetAttachItemsProvider));
exports.PsAttachItemsProvider = PsAttachItemsProvider;
var WmicAttachItemsProvider = (function (_super) {
    __extends(WmicAttachItemsProvider, _super);
    function WmicAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(WmicAttachItemsProvider, "wmicNameTitle", {
        // Perf numbers on Win10:
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            309 |       413 |
        // |            407 |       463 |
        // |            887 |       746 |
        // |           1308 |      1132 |
        get: function () { return 'Name'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicAttachItemsProvider, "wmicCommandLineTitle", {
        get: function () { return 'CommandLine'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicAttachItemsProvider, "wmicPidTitle", {
        get: function () { return 'ProcessId'; },
        enumerable: true,
        configurable: true
    });
    WmicAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var _this = this;
        var wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return execChildProcess(wmicCommand, null).then(function (processes) {
            return _this.parseProcessFromWmic(processes);
        });
    };
    // Only public for tests.
    WmicAttachItemsProvider.prototype.parseProcessFromWmic = function (processes) {
        var lines = processes.split(os.EOL);
        var currentProcess = new Process(null, null, null);
        var processEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            this.parseLineFromWmic(line, currentProcess);
            // Each entry of processes has ProcessId as the last line
            if (line.startsWith(WmicAttachItemsProvider.wmicPidTitle)) {
                processEntries.push(currentProcess);
                currentProcess = new Process(null, null, null);
            }
        }
        return processEntries;
    };
    WmicAttachItemsProvider.prototype.parseLineFromWmic = function (line, process) {
        var splitter = line.indexOf('=');
        if (splitter >= 0) {
            var key = line.slice(0, line.indexOf('='));
            var value = line.slice(line.indexOf('=') + 1);
            if (key === WmicAttachItemsProvider.wmicNameTitle) {
                process.name = value.trim();
            }
            else if (key === WmicAttachItemsProvider.wmicPidTitle) {
                process.pid = value.trim();
            }
            else if (key === WmicAttachItemsProvider.wmicCommandLineTitle) {
                var extendedLengthPath = '\\??\\';
                if (value.startsWith(extendedLengthPath)) {
                    value = value.slice(extendedLengthPath.length).trim();
                }
                process.commandLine = value.trim();
            }
        }
    };
    return WmicAttachItemsProvider;
}(DotNetAttachItemsProvider));
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
function execChildProcess(process, workingDirectory) {
    return new Promise(function (resolve, reject) {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, function (error, stdout, stderr) {
            if (error) {
                reject(error);
                return;
            }
            if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}
//# sourceMappingURL=processPicker.js.map