/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require('events');
var child_process_1 = require('child_process');
var path_1 = require('path');
var readline_1 = require('readline');
var launcher_1 = require('./launcher');
var omnisharp = require('./omnisharp');
var download = require('./download');
var launcher_2 = require('./launcher');
var platform_1 = require('../platform');
var vscode = require('vscode');
var ServerState;
(function (ServerState) {
    ServerState[ServerState["Starting"] = 0] = "Starting";
    ServerState[ServerState["Started"] = 1] = "Started";
    ServerState[ServerState["Stopped"] = 2] = "Stopped";
})(ServerState || (ServerState = {}));
var Events;
(function (Events) {
    Events.StateChanged = 'stateChanged';
    Events.StdOut = 'stdout';
    Events.StdErr = 'stderr';
    Events.Error = 'Error';
    Events.ServerError = 'ServerError';
    Events.UnresolvedDependencies = 'UnresolvedDependencies';
    Events.PackageRestoreStarted = 'PackageRestoreStarted';
    Events.PackageRestoreFinished = 'PackageRestoreFinished';
    Events.ProjectChanged = 'ProjectChanged';
    Events.ProjectAdded = 'ProjectAdded';
    Events.ProjectRemoved = 'ProjectRemoved';
    Events.MsBuildProjectDiagnostics = 'MsBuildProjectDiagnostics';
    Events.BeforeServerInstall = 'BeforeServerInstall';
    Events.BeforeServerStart = 'BeforeServerStart';
    Events.ServerStart = 'ServerStart';
    Events.ServerStop = 'ServerStop';
    Events.MultipleLaunchTargets = 'server:MultipleLaunchTargets';
    Events.Started = 'started';
})(Events || (Events = {}));
var Delays = (function () {
    function Delays() {
        this.immediateDelays = 0; // 0-25 milliseconds
        this.nearImmediateDelays = 0; // 26-50 milliseconds
        this.shortDelays = 0; // 51-250 milliseconds
        this.mediumDelays = 0; // 251-500 milliseconds
        this.idleDelays = 0; // 501-1500 milliseconds
        this.nonFocusDelays = 0; // 1501-3000 milliseconds
        this.bigDelays = 0; // 3000+ milliseconds
    }
    Delays.prototype.report = function (elapsedTime) {
        if (elapsedTime <= 25) {
            this.immediateDelays += 1;
        }
        else if (elapsedTime <= 50) {
            this.nearImmediateDelays += 1;
        }
        else if (elapsedTime <= 250) {
            this.shortDelays += 1;
        }
        else if (elapsedTime <= 500) {
            this.mediumDelays += 1;
        }
        else if (elapsedTime <= 1500) {
            this.idleDelays += 1;
        }
        else if (elapsedTime <= 3000) {
            this.nonFocusDelays += 1;
        }
        else {
            this.bigDelays += 1;
        }
    };
    Delays.prototype.toMeasures = function () {
        return {
            immedateDelays: this.immediateDelays,
            nearImmediateDelays: this.nearImmediateDelays,
            shortDelays: this.shortDelays,
            mediumDelays: this.mediumDelays,
            idleDelays: this.idleDelays,
            nonFocusDelays: this.nonFocusDelays
        };
    };
    return Delays;
}());
var OmnisharpServer = (function () {
    function OmnisharpServer(reporter) {
        this._eventBus = new events_1.EventEmitter();
        this._state = ServerState.Stopped;
        this._queue = [];
        this._isProcessingQueue = false;
        this._isDebugEnable = false;
        this._extraArgs = [];
        this._channel = vscode.window.createOutputChannel('OmniSharp Log');
        this._reporter = reporter;
    }
    OmnisharpServer.prototype.isRunning = function () {
        return this._state === ServerState.Started;
    };
    OmnisharpServer.prototype._getState = function () {
        return this._state;
    };
    OmnisharpServer.prototype._setState = function (value) {
        if (typeof value !== 'undefined' && value !== this._state) {
            this._state = value;
            this._fireEvent(Events.StateChanged, this._state);
        }
    };
    OmnisharpServer.prototype._readOptions = function () {
        var config = vscode.workspace.getConfiguration('csharp');
        return {
            path: config.get('omnisharp'),
            usesMono: config.get('omnisharpUsesMono')
        };
    };
    OmnisharpServer.prototype._recordRequestDelay = function (requestName, elapsedTime) {
        var delays = this._requestDelays[requestName];
        if (!delays) {
            delays = new Delays();
            this._requestDelays[requestName] = delays;
        }
        delays.report(elapsedTime);
    };
    OmnisharpServer.prototype.reportAndClearTelemetry = function () {
        for (var path in this._requestDelays) {
            var eventName = 'omnisharp' + path;
            var measures = this._requestDelays[path].toMeasures();
            this._reporter.sendTelemetryEvent(eventName, null, measures);
        }
        this._requestDelays = null;
    };
    OmnisharpServer.prototype.getSolutionPathOrFolder = function () {
        return this._launchTarget
            ? this._launchTarget.target
            : undefined;
    };
    OmnisharpServer.prototype.getChannel = function () {
        return this._channel;
    };
    OmnisharpServer.prototype.isDebugEnable = function () {
        return this._isDebugEnable;
    };
    // --- eventing
    OmnisharpServer.prototype.onStdout = function (listener, thisArg) {
        return this._addListener(Events.StdOut, listener, thisArg);
    };
    OmnisharpServer.prototype.onStderr = function (listener, thisArg) {
        return this._addListener(Events.StdErr, listener, thisArg);
    };
    OmnisharpServer.prototype.onError = function (listener, thisArg) {
        return this._addListener(Events.Error, listener, thisArg);
    };
    OmnisharpServer.prototype.onServerError = function (listener, thisArg) {
        return this._addListener(Events.ServerError, listener, thisArg);
    };
    OmnisharpServer.prototype.onUnresolvedDependencies = function (listener, thisArg) {
        return this._addListener(Events.UnresolvedDependencies, listener, thisArg);
    };
    OmnisharpServer.prototype.onBeforePackageRestore = function (listener, thisArg) {
        return this._addListener(Events.PackageRestoreStarted, listener, thisArg);
    };
    OmnisharpServer.prototype.onPackageRestore = function (listener, thisArg) {
        return this._addListener(Events.PackageRestoreFinished, listener, thisArg);
    };
    OmnisharpServer.prototype.onProjectChange = function (listener, thisArg) {
        return this._addListener(Events.ProjectChanged, listener, thisArg);
    };
    OmnisharpServer.prototype.onProjectAdded = function (listener, thisArg) {
        return this._addListener(Events.ProjectAdded, listener, thisArg);
    };
    OmnisharpServer.prototype.onProjectRemoved = function (listener, thisArg) {
        return this._addListener(Events.ProjectRemoved, listener, thisArg);
    };
    OmnisharpServer.prototype.onMsBuildProjectDiagnostics = function (listener, thisArg) {
        return this._addListener(Events.MsBuildProjectDiagnostics, listener, thisArg);
    };
    OmnisharpServer.prototype.onBeforeServerInstall = function (listener) {
        return this._addListener(Events.BeforeServerInstall, listener);
    };
    OmnisharpServer.prototype.onBeforeServerStart = function (listener) {
        return this._addListener(Events.BeforeServerStart, listener);
    };
    OmnisharpServer.prototype.onServerStart = function (listener) {
        return this._addListener(Events.ServerStart, listener);
    };
    OmnisharpServer.prototype.onServerStop = function (listener) {
        return this._addListener(Events.ServerStop, listener);
    };
    OmnisharpServer.prototype.onMultipleLaunchTargets = function (listener, thisArg) {
        return this._addListener(Events.MultipleLaunchTargets, listener, thisArg);
    };
    OmnisharpServer.prototype.onOmnisharpStart = function (listener) {
        return this._addListener(Events.Started, listener);
    };
    OmnisharpServer.prototype._addListener = function (event, listener, thisArg) {
        var _this = this;
        listener = thisArg ? listener.bind(thisArg) : listener;
        this._eventBus.addListener(event, listener);
        return new vscode.Disposable(function () { return _this._eventBus.removeListener(event, listener); });
    };
    OmnisharpServer.prototype._fireEvent = function (event, args) {
        this._eventBus.emit(event, args);
    };
    // --- start, stop, and connect
    OmnisharpServer.prototype._start = function (launchTarget) {
        var _this = this;
        var options = this._readOptions();
        var flavor;
        if (options.path !== undefined && options.usesMono === true) {
            flavor = omnisharp.Flavor.Mono;
        }
        else {
            flavor = launcher_2.getDefaultFlavor(launchTarget.kind);
        }
        return this._getServerPath(flavor).then(function (serverPath) {
            _this._setState(ServerState.Starting);
            _this._launchTarget = launchTarget;
            var solutionPath = launchTarget.target;
            var cwd = path_1.dirname(solutionPath);
            var args = [
                '-s', solutionPath,
                '--hostPID', process.pid.toString(),
                'DotNet:enablePackageRestore=false'
            ].concat(_this._extraArgs);
            _this._fireEvent(Events.StdOut, "[INFO] Starting OmniSharp at '" + solutionPath + "'...\n");
            _this._fireEvent(Events.BeforeServerStart, solutionPath);
            return launcher_1.launchOmniSharp({ serverPath: serverPath, flavor: flavor, cwd: cwd, args: args }).then(function (value) {
                _this._serverProcess = value.process;
                _this._requestDelays = {};
                _this._fireEvent(Events.StdOut, "[INFO] Started OmniSharp from '" + value.command + "' with process id " + value.process.pid + "...\n");
                _this._setState(ServerState.Started);
                _this._fireEvent(Events.ServerStart, solutionPath);
                return _this._doConnect();
            }).then(function () {
                return vscode.commands.getCommands()
                    .then(function (commands) {
                    if (commands.find(function (c) { return c === 'vscode.startDebug'; })) {
                        _this._isDebugEnable = true;
                    }
                });
            }).then(function () {
                _this._processQueue();
            }, function (err) {
                _this._fireEvent(Events.ServerError, err);
                _this._setState(ServerState.Stopped);
                throw err;
            });
        });
    };
    OmnisharpServer.prototype.stop = function () {
        var _this = this;
        var ret;
        if (!this._serverProcess) {
            // nothing to kill
            ret = Promise.resolve();
        }
        else if (process.platform === 'win32') {
            // when killing a process in windows its child
            // processes are *not* killed but become root
            // processes. Therefore we use TASKKILL.EXE
            ret = new Promise(function (resolve, reject) {
                var killer = child_process_1.exec("taskkill /F /T /PID " + _this._serverProcess.pid, function (err, stdout, stderr) {
                    if (err) {
                        return reject(err);
                    }
                });
                killer.on('exit', resolve);
                killer.on('error', reject);
            });
        }
        else {
            // Kill Unix process
            this._serverProcess.kill('SIGTERM');
            ret = Promise.resolve();
        }
        return ret.then(function () {
            _this._serverProcess = null;
            _this._setState(ServerState.Stopped);
            _this._fireEvent(Events.ServerStop, _this);
            return;
        });
    };
    OmnisharpServer.prototype.restart = function (launchTarget) {
        var _this = this;
        if (launchTarget === void 0) { launchTarget = this._launchTarget; }
        if (launchTarget) {
            return this.stop().then(function () {
                _this._start(launchTarget);
            });
        }
    };
    OmnisharpServer.prototype.autoStart = function (preferredPath) {
        var _this = this;
        return launcher_2.findLaunchTargets().then(function (launchTargets) {
            // If there aren't any potential launch targets, we create file watcher and
            // try to start the server again once a *.sln or project.json file is created.
            if (launchTargets.length === 0) {
                return new Promise(function (resolve, reject) {
                    // 1st watch for files
                    var watcher = vscode.workspace.createFileSystemWatcher('{**/*.sln,**/project.json}', false, true, true);
                    watcher.onDidCreate(function (uri) {
                        watcher.dispose();
                        resolve();
                    });
                }).then(function () {
                    // 2nd try again
                    return _this.autoStart(preferredPath);
                });
            }
            // If there's more than one launch target, we start the server if one of the targets
            // matches the preferred path. Otherwise, we fire the "MultipleLaunchTargets" event,
            // which is handled in status.ts to display the launch target selector.
            if (launchTargets.length > 1) {
                for (var _i = 0, launchTargets_1 = launchTargets; _i < launchTargets_1.length; _i++) {
                    var launchTarget = launchTargets_1[_i];
                    if (launchTarget.target === preferredPath) {
                        // start preferred path
                        return _this.restart(launchTarget);
                    }
                }
                _this._fireEvent(Events.MultipleLaunchTargets, launchTargets);
                return Promise.reject(undefined);
            }
            // If there's only one target, just start
            return _this.restart(launchTargets[0]);
        });
    };
    OmnisharpServer.prototype._getServerPath = function (flavor) {
        // Attempt to find launch file path first from options, and then from the default install location.
        // If OmniSharp can't be found, download it.
        var _this = this;
        var options = this._readOptions();
        var installDirectory = omnisharp.getInstallDirectory(flavor);
        return new Promise(function (resolve, reject) {
            if (options.path) {
                return omnisharp.findServerPath(options.path).then(function (serverPath) {
                    return resolve(serverPath);
                }).catch(function (err) {
                    vscode.window.showWarningMessage("Invalid \"csharp.omnisharp\" user setting specified ('" + options.path + ").");
                    return reject(err);
                });
            }
            return reject('No option specified.');
        }).catch(function (err) {
            return omnisharp.findServerPath(installDirectory);
        }).catch(function (err) {
            var platform = platform_1.getCurrentPlatform();
            if (platform == platform_1.Platform.Unknown && process.platform === 'linux') {
                _this._channel.appendLine("[ERROR] Could not locate an OmniSharp server that supports your Linux distribution.");
                _this._channel.appendLine("");
                _this._channel.appendLine("OmniSharp provides a richer C# editing experience, with features like IntelliSense and Find All References.");
                _this._channel.appendLine("It is recommend that you download the version of OmniSharp that runs on Mono using the following steps:");
                _this._channel.appendLine("    1. If it's not already installed, download and install Mono (https://www.mono-project.com)");
                _this._channel.appendLine("    2. Download and untar the latest OmniSharp Mono release from  https://github.com/OmniSharp/omnisharp-roslyn/releases/");
                _this._channel.appendLine("    3. In Visual Studio Code, select Preferences->User Settings to open settings.json.");
                _this._channel.appendLine("    4. In settings.json, add a new setting: \"csharp.omnisharp\": \"/path/to/omnisharp/OmniSharp.exe\"");
                _this._channel.appendLine("    4. In settings.json, add a new setting: \"csharp.omnisharpUsesMono\": true");
                _this._channel.appendLine("    5. Restart Visual Studio Code.");
                _this._channel.show();
                throw err;
            }
            var config = vscode.workspace.getConfiguration();
            var proxy = config.get('http.proxy');
            var strictSSL = config.get('http.proxyStrictSSL', true);
            var logger = function (message) { _this._channel.appendLine(message); };
            _this._fireEvent(Events.BeforeServerInstall, _this);
            return download.go(flavor, platform, logger, proxy, strictSSL).then(function (_) {
                return omnisharp.findServerPath(installDirectory);
            });
        });
    };
    // --- requests et al
    OmnisharpServer.prototype.makeRequest = function (path, data, token) {
        var _this = this;
        if (this._getState() !== ServerState.Started) {
            return Promise.reject('server has been stopped or not started');
        }
        var startTime;
        var request;
        var promise = new Promise(function (resolve, reject) {
            startTime = Date.now();
            request = {
                path: path,
                data: data,
                onSuccess: function (value) { return resolve(value); },
                onError: function (err) { return reject(err); },
                _enqueued: Date.now()
            };
            _this._queue.push(request);
            if (_this._getState() === ServerState.Started && !_this._isProcessingQueue) {
                _this._processQueue();
            }
        });
        if (token) {
            token.onCancellationRequested(function () {
                var idx = _this._queue.indexOf(request);
                if (idx !== -1) {
                    _this._queue.splice(idx, 1);
                    var err = new Error('Canceled');
                    err.message = 'Canceled';
                    request.onError(err);
                }
            });
        }
        return promise.then(function (response) {
            var endTime = Date.now();
            var elapsedTime = endTime - startTime;
            _this._recordRequestDelay(path, elapsedTime);
            return response;
        });
    };
    OmnisharpServer.prototype._processQueue = function () {
        var _this = this;
        if (this._queue.length === 0) {
            // nothing to do
            this._isProcessingQueue = false;
            return;
        }
        // signal that we are working on it
        this._isProcessingQueue = true;
        // send next request and recurse when done
        var thisRequest = this._queue.shift();
        this._makeNextRequest(thisRequest.path, thisRequest.data).then(function (value) {
            thisRequest.onSuccess(value);
            _this._processQueue();
        }, function (err) {
            thisRequest.onError(err);
            _this._processQueue();
        }).catch(function (err) {
            console.error(err);
            _this._processQueue();
        });
    };
    return OmnisharpServer;
}());
exports.OmnisharpServer = OmnisharpServer;
var StdioOmnisharpServer = (function (_super) {
    __extends(StdioOmnisharpServer, _super);
    function StdioOmnisharpServer(reporter) {
        _super.call(this, reporter);
        this._activeRequest = Object.create(null);
        this._callOnStop = [];
        // extra argv
        this._extraArgs.push('--stdio');
    }
    StdioOmnisharpServer.prototype.stop = function () {
        while (this._callOnStop.length) {
            this._callOnStop.pop()();
        }
        return _super.prototype.stop.call(this);
    };
    StdioOmnisharpServer.prototype._doConnect = function () {
        var _this = this;
        this._serverProcess.stderr.on('data', function (data) {
            _this._fireEvent('stderr', String(data));
        });
        this._rl = readline_1.createInterface({
            input: this._serverProcess.stdout,
            output: this._serverProcess.stdin,
            terminal: false
        });
        var p = new Promise(function (resolve, reject) {
            var listener;
            // timeout logic
            var handle = setTimeout(function () {
                if (listener) {
                    listener.dispose();
                }
                reject(new Error('Failed to start OmniSharp'));
            }, StdioOmnisharpServer.StartupTimeout);
            // handle started-event
            listener = _this.onOmnisharpStart(function () {
                if (listener) {
                    listener.dispose();
                }
                clearTimeout(handle);
                resolve();
            });
        });
        this._startListening();
        return p;
    };
    StdioOmnisharpServer.prototype._startListening = function () {
        var _this = this;
        var onLineReceived = function (line) {
            if (line[0] !== '{') {
                _this._fireEvent(Events.StdOut, line + "\n");
                return;
            }
            var packet;
            try {
                packet = JSON.parse(line);
            }
            catch (e) {
                // not json
                return;
            }
            if (!packet.Type) {
                // bogous packet
                return;
            }
            switch (packet.Type) {
                case 'response':
                    _this._handleResponsePacket(packet);
                    break;
                case 'event':
                    _this._handleEventPacket(packet);
                    break;
                default:
                    console.warn('unknown packet: ', packet);
                    break;
            }
        };
        this._rl.addListener('line', onLineReceived);
        this._callOnStop.push(function () { return _this._rl.removeListener('line', onLineReceived); });
    };
    StdioOmnisharpServer.prototype._handleResponsePacket = function (packet) {
        var requestSeq = packet.Request_seq, entry = this._activeRequest[requestSeq];
        if (!entry) {
            console.warn('Received a response WITHOUT a request', packet);
            return;
        }
        delete this._activeRequest[requestSeq];
        if (packet.Success) {
            entry.onSuccess(packet.Body);
        }
        else {
            entry.onError(packet.Message || packet.Body);
        }
    };
    StdioOmnisharpServer.prototype._handleEventPacket = function (packet) {
        if (packet.Event === 'log') {
            // handle log events
            var entry = packet.Body;
            this._fireEvent(Events.StdOut, "[" + entry.LogLevel + ":" + entry.Name + "] " + entry.Message + "\n");
            return;
        }
        else {
            // fwd all other events
            this._fireEvent(packet.Event, packet.Body);
        }
    };
    StdioOmnisharpServer.prototype._makeNextRequest = function (path, data) {
        var _this = this;
        var thisRequestPacket = {
            Type: 'request',
            Seq: StdioOmnisharpServer._seqPool++,
            Command: path,
            Arguments: data
        };
        return new Promise(function (resolve, reject) {
            _this._activeRequest[thisRequestPacket.Seq] = {
                onSuccess: function (value) { return resolve(value); },
                onError: function (err) { return reject(err); }
            };
            _this._serverProcess.stdin.write(JSON.stringify(thisRequestPacket) + '\n');
        });
    };
    StdioOmnisharpServer._seqPool = 1;
    StdioOmnisharpServer.StartupTimeout = 1000 * 60;
    return StdioOmnisharpServer;
}(OmnisharpServer));
exports.StdioOmnisharpServer = StdioOmnisharpServer;
//# sourceMappingURL=server.js.map