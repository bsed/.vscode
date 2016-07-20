"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_debugadapter_1 = require("vscode-debugadapter");
var vscode_debugadapter_2 = require("vscode-debugadapter");
var path = require("path");
var fs = require("fs");
var PythonProcess_1 = require("./PythonProcess");
var Contracts_1 = require("./Common/Contracts");
var DebugFactory_1 = require("./DebugClients/DebugFactory");
var Contracts_2 = require("./Common/Contracts");
var telemetryContracts = require("../common/telemetryContracts");
var CHILD_ENUMEARATION_TIMEOUT = 5000;
var PythonDebugger = (function (_super) {
    __extends(PythonDebugger, _super);
    function PythonDebugger(debuggerLinesStartAt1, isServer) {
        var _this = this;
        _super.call(this, debuggerLinesStartAt1, isServer === true);
        this.breakPointCounter = 0;
        this._variableHandles = new vscode_debugadapter_1.Handles();
        this._pythonStackFrames = new vscode_debugadapter_1.Handles();
        this.registeredBreakpoints = new Map();
        this.registeredBreakpointsByFileName = new Map();
        this.debuggerLoaded = new Promise(function (resolve) {
            _this.debuggerLoadedPromiseResolve = resolve;
        });
    }
    PythonDebugger.prototype.initializeRequest = function (response, args) {
        response.body.supportsEvaluateForHovers = true;
        response.body.supportsConditionalBreakpoints = true;
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsEvaluateForHovers = false;
        response.body.supportsFunctionBreakpoints = false;
        response.body.exceptionBreakpointFilters = [
            {
                label: "All Exceptions",
                filter: "all"
            },
            {
                label: "Uncaught Exceptions",
                filter: "uncaught"
            }
        ];
        this.sendResponse(response);
        // now we are ready to accept breakpoints -> fire the initialized event to give UI a chance to set breakpoints
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    };
    PythonDebugger.prototype.startDebugServer = function () {
        var programDirectory = this.launchArgs ? path.dirname(this.launchArgs.program) : this.attachArgs.localRoot;
        this.pythonProcess = new PythonProcess_1.PythonProcess(0, "", programDirectory);
        this.debugServer = this.debugClient.CreateDebugServer(this.pythonProcess);
        this.InitializeEventHandlers();
        return this.debugServer.Start();
    };
    PythonDebugger.prototype.stopDebugServer = function () {
        if (this.debugClient) {
            this.debugClient.Stop();
            this.debugClient = null;
        }
        if (this.pythonProcess) {
            this.pythonProcess.Kill();
        }
    };
    PythonDebugger.prototype.InitializeEventHandlers = function () {
        var _this = this;
        this.pythonProcess.on("last", function (arg) { return _this.onDetachDebugger(); });
        this.pythonProcess.on("threadExited", function (arg) { return _this.onPythonThreadExited(arg); });
        this.pythonProcess.on("moduleLoaded", function (arg) { return _this.onPythonModuleLoaded(arg); });
        this.pythonProcess.on("threadCreated", function (arg) { return _this.onPythonThreadCreated(arg); });
        this.pythonProcess.on("processLoaded", function (arg) { return _this.onPythonProcessLoaded(arg); });
        this.pythonProcess.on("output", function (pyThread, output) { return _this.onDebuggerOutput(pyThread, output); });
        this.pythonProcess.on("exceptionRaised", function (pyThread, ex) { return _this.onPythonException(pyThread, ex); });
        this.pythonProcess.on("breakpointHit", function (pyThread, breakpointId) { return _this.onBreakpointHit(pyThread, breakpointId); });
        this.pythonProcess.on("stepCompleted", function (pyThread) { return _this.onStepCompleted(pyThread); });
        this.pythonProcess.on("detach", function () { return _this.onDetachDebugger(); });
        this.pythonProcess.on("error", function (ex) { return _this.sendEvent(new vscode_debugadapter_1.OutputEvent(ex, "stderr")); });
        this.pythonProcess.on("asyncBreakCompleted", function (arg) { return _this.onPythonProcessPaused(arg); });
        this.debugServer.on("detach", function () { return _this.onDetachDebugger(); });
    };
    PythonDebugger.prototype.onDetachDebugger = function () {
        this.stopDebugServer();
        this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        this.shutdown();
    };
    PythonDebugger.prototype.onPythonThreadCreated = function (pyThread) {
        this.sendEvent(new vscode_debugadapter_2.ThreadEvent("started", pyThread.Id));
    };
    PythonDebugger.prototype.onStepCompleted = function (pyThread) {
        this.sendEvent(new vscode_debugadapter_1.StoppedEvent("step", pyThread.Id));
    };
    PythonDebugger.prototype.onPythonException = function (pyThread, ex) {
        this.sendEvent(new vscode_debugadapter_1.StoppedEvent("exception", pyThread.Id, ex.TypeName + ", " + ex.Description));
        this.sendEvent(new vscode_debugadapter_1.OutputEvent(ex.TypeName + ", " + ex.Description + "\n", "stderr"));
    };
    PythonDebugger.prototype.onPythonThreadExited = function (pyThread) {
        this.sendEvent(new vscode_debugadapter_2.ThreadEvent("exited", pyThread.Id));
    };
    PythonDebugger.prototype.onPythonProcessPaused = function (pyThread) {
        this.sendEvent(new vscode_debugadapter_1.StoppedEvent("user request", pyThread.Id));
    };
    PythonDebugger.prototype.onPythonModuleLoaded = function (module) {
    };
    PythonDebugger.prototype.onPythonProcessLoaded = function (pyThread) {
        var _this = this;
        this.debuggerHasLoaded = true;
        this.sendResponse(this.entryResponse);
        this.debuggerLoadedPromiseResolve();
        if (this.launchArgs && this.launchArgs.stopOnEntry === true) {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("entry", pyThread.Id));
        }
        else if (this.launchArgs && this.launchArgs.stopOnEntry === false) {
            this.configurationDone.then(function () {
                _this.pythonProcess.SendResumeThread(pyThread.Id);
            });
        }
        else {
            this.pythonProcess.SendResumeThread(pyThread.Id);
        }
    };
    PythonDebugger.prototype.onDebuggerOutput = function (pyThread, output) {
        if (!this.debuggerHasLoaded) {
            this.sendResponse(this.entryResponse);
            this.debuggerLoadedPromiseResolve();
        }
        this.sendEvent(new vscode_debugadapter_1.OutputEvent(output, "stdout"));
    };
    PythonDebugger.prototype.canStartDebugger = function () {
        return Promise.resolve(true);
    };
    PythonDebugger.prototype.launchRequest = function (response, args) {
        var _this = this;
        // Confirm the file exists
        if (!fs.existsSync(args.program)) {
            return this.sendErrorResponse(response, 2001, "File does not exist. \"" + args.program + "\"");
        }
        this.sendEvent(new Contracts_2.TelemetryEvent(telemetryContracts.Debugger.Load, {
            Debug_ExternalConsole: args.externalConsole === true ? "true" : "false",
            Debug_DebugOptions: args.debugOptions.join(","),
            Debug_DJango: args.debugOptions.indexOf("DjangoDebugging") >= 0 ? "true" : "false",
            Debug_HasEnvVaraibles: args.env && typeof args.env === "object" ? "true" : "false"
        }));
        this.launchArgs = args;
        this.debugClient = DebugFactory_1.CreateLaunchDebugClient(args, this);
        this.configurationDone = new Promise(function (resolve) {
            _this.configurationDonePromiseResolve = resolve;
        });
        this.entryResponse = response;
        var that = this;
        this.startDebugServer().then(function (dbgServer) {
            return that.debugClient.LaunchApplicationToDebug(dbgServer);
        }).catch(function (error) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(error + "\n", "stderr"));
            _this.sendErrorResponse(that.entryResponse, 2000, error);
        });
    };
    PythonDebugger.prototype.attachRequest = function (response, args) {
        var _this = this;
        this.sendEvent(new Contracts_2.TelemetryEvent(telemetryContracts.Debugger.Attach));
        this.attachArgs = args;
        this.debugClient = DebugFactory_1.CreateAttachDebugClient(args, this);
        this.entryResponse = response;
        var that = this;
        this.canStartDebugger().then(function () {
            return _this.startDebugServer();
        }).then(function (dbgServer) {
            return that.debugClient.LaunchApplicationToDebug(dbgServer);
        }).catch(function (error) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(error + "\n", "stderr"));
            _this.sendErrorResponse(that.entryResponse, 2000, error);
        });
    };
    PythonDebugger.prototype.configurationDoneRequest = function (response, args) {
        // Tell debugger we have loaded the breakpoints
        if (this.configurationDonePromiseResolve) {
            this.configurationDonePromiseResolve();
            this.configurationDonePromiseResolve = null;
        }
        this.sendResponse(response);
    };
    PythonDebugger.prototype.onBreakpointHit = function (pyThread, breakpointId) {
        // Break only if the breakpoint exists and it is enabled
        if (this.registeredBreakpoints.has(breakpointId) && this.registeredBreakpoints.get(breakpointId).Enabled === true) {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", pyThread.Id));
        }
        else {
            this.pythonProcess.SendResumeThread(pyThread.Id);
        }
    };
    PythonDebugger.prototype.buildBreakpointDetails = function (filePath, line, condition) {
        var isDjangoFile = false;
        if (this.launchArgs != null &&
            Array.isArray(this.launchArgs.debugOptions) &&
            this.launchArgs.debugOptions.indexOf(Contracts_2.DebugOptions.DjangoDebugging) >= 0) {
            isDjangoFile = filePath.toUpperCase().endsWith(".HTML");
        }
        condition = typeof condition === "string" ? condition : "";
        return {
            Condition: condition,
            ConditionKind: condition.length === 0 ? Contracts_1.PythonBreakpointConditionKind.Always : Contracts_1.PythonBreakpointConditionKind.WhenTrue,
            Filename: filePath,
            Id: this.breakPointCounter++,
            LineNo: line,
            PassCount: 0,
            PassCountKind: Contracts_1.PythonBreakpointPassCountKind.Always,
            IsDjangoBreakpoint: isDjangoFile,
            Enabled: true
        };
    };
    PythonDebugger.prototype.setBreakPointsRequest = function (response, args) {
        var _this = this;
        this.debuggerLoaded.then(function () {
            if (!_this.registeredBreakpointsByFileName.has(args.source.path)) {
                _this.registeredBreakpointsByFileName.set(args.source.path, []);
            }
            var breakpoints = [];
            var breakpointsToRemove = [];
            var linesToAdd = args.breakpoints.map(function (b) { return b.line; });
            var registeredBks = _this.registeredBreakpointsByFileName.get(args.source.path);
            var linesToRemove = registeredBks.map(function (b) { return b.LineNo; }).filter(function (oldLine) { return linesToAdd.indexOf(oldLine) === -1; });
            var linesToUpdate = registeredBks.map(function (b) { return b.LineNo; }).filter(function (oldLine) { return linesToAdd.indexOf(oldLine) >= 0; });
            // Always add new breakpoints, don't re-enable previous breakpoints
            // Cuz sometimes some breakpoints get added too early (e.g. in django) and don't get registeredBks
            // and the response comes back indicating it wasn't set properly
            // However, at a later point in time, the program breaks at that point!!!            
            var linesToAddPromises = args.breakpoints.map(function (bk) {
                return new Promise(function (resolve) {
                    var breakpoint;
                    var existingBreakpointsForThisLine = registeredBks.filter(function (registeredBk) { return registeredBk.LineNo === bk.line; });
                    if (existingBreakpointsForThisLine.length > 0) {
                        // We have an existing breakpoint for this line
                        // just enable that
                        breakpoint = existingBreakpointsForThisLine[0];
                        breakpoint.Enabled = true;
                    }
                    else {
                        breakpoint = _this.buildBreakpointDetails(_this.convertClientPathToDebugger(args.source.path), bk.line, bk.condition);
                    }
                    _this.pythonProcess.BindBreakpoint(breakpoint).then(function () {
                        _this.registeredBreakpoints.set(breakpoint.Id, breakpoint);
                        breakpoints.push({ verified: true, line: bk.line });
                        registeredBks.push(breakpoint);
                        resolve();
                    }).catch(function (reason) {
                        _this.registeredBreakpoints.set(breakpoint.Id, breakpoint);
                        breakpoints.push({ verified: false, line: bk.line });
                        registeredBks.push(breakpoint);
                        resolve();
                    });
                });
            });
            var linesToRemovePromises = linesToRemove.map(function (line) {
                return new Promise(function (resolve) {
                    var registeredBks = _this.registeredBreakpointsByFileName.get(args.source.path);
                    var bk = registeredBks.filter(function (b) { return b.LineNo === line; })[0];
                    // Ok, we won't get a response back, so update the breakpoints list  indicating this has been disabled
                    bk.Enabled = false;
                    _this.pythonProcess.DisableBreakPoint(bk);
                    resolve();
                });
            });
            var promises = linesToAddPromises.concat(linesToRemovePromises);
            Promise.all(promises).then(function () {
                response.body = {
                    breakpoints: breakpoints
                };
                _this.sendResponse(response);
                // Tell debugger we have loaded the breakpoints
                if (_this.configurationDonePromiseResolve) {
                    _this.configurationDonePromiseResolve();
                    _this.configurationDonePromiseResolve = null;
                }
            }).catch(function (error) { return _this.sendErrorResponse(response, 2000, error); });
        });
    };
    PythonDebugger.prototype.threadsRequest = function (response) {
        var threads = [];
        this.pythonProcess.Threads.forEach(function (t) {
            threads.push(new vscode_debugadapter_1.Thread(t.Id, t.Name));
        });
        response.body = {
            threads: threads
        };
        this.sendResponse(response);
    };
    /** converts the remote path to local path */
    PythonDebugger.prototype.convertDebuggerPathToClient = function (remotePath) {
        if (this.attachArgs && this.attachArgs.localRoot && this.attachArgs.remoteRoot) {
            // get the part of the path that is relative to the source root
            var pathRelativeToSourceRoot = path.relative(this.attachArgs.remoteRoot, remotePath);
            // resolve from the local source root
            return path.resolve(this.attachArgs.localRoot, pathRelativeToSourceRoot);
        }
        else {
            return remotePath;
        }
    };
    /** converts the local path to remote path */
    PythonDebugger.prototype.convertClientPathToDebugger = function (clientPath) {
        if (this.attachArgs && this.attachArgs.localRoot && this.attachArgs.remoteRoot) {
            // get the part of the path that is relative to the client root
            var pathRelativeToClientRoot = path.relative(this.attachArgs.localRoot, clientPath);
            // resolve from the remote source root
            return path.resolve(this.attachArgs.remoteRoot, pathRelativeToClientRoot);
        }
        else {
            return clientPath;
        }
    };
    PythonDebugger.prototype.stackTraceRequest = function (response, args) {
        var _this = this;
        this.debuggerLoaded.then(function () {
            if (!_this.pythonProcess.Threads.has(args.threadId)) {
                response.body = {
                    stackFrames: []
                };
                _this.sendResponse(response);
            }
            var pyThread = _this.pythonProcess.Threads.get(args.threadId);
            var maxFrames = typeof args.levels === "number" && args.levels > 0 ? args.levels : pyThread.Frames.length - 1;
            maxFrames = maxFrames < pyThread.Frames.length ? maxFrames : pyThread.Frames.length;
            var frames = [];
            for (var counter = 0; counter < maxFrames; counter++) {
                var frame = pyThread.Frames[counter];
                var frameId = _this._pythonStackFrames.create(frame);
                frames.push(new vscode_debugadapter_1.StackFrame(frameId, frame.FunctionName, new vscode_debugadapter_1.Source(path.basename(frame.FileName), _this.convertDebuggerPathToClient(frame.FileName)), _this.convertDebuggerLineToClient(frame.LineNo - 1), 0));
            }
            response.body = {
                stackFrames: frames
            };
            _this.sendResponse(response);
        });
    };
    PythonDebugger.prototype.stepInRequest = function (response) {
        this.sendResponse(response);
        this.pythonProcess.SendStepInto(this.pythonProcess.LastExecutedThread.Id);
    };
    PythonDebugger.prototype.stepOutRequest = function (response) {
        this.sendResponse(response);
        this.pythonProcess.SendStepOut(this.pythonProcess.LastExecutedThread.Id);
    };
    PythonDebugger.prototype.continueRequest = function (response, args) {
        var _this = this;
        this.pythonProcess.SendContinue().then(function () {
            _this.sendResponse(response);
        }).catch(function (error) { return _this.sendErrorResponse(response, 2000, error); });
    };
    PythonDebugger.prototype.nextRequest = function (response, args) {
        this.sendResponse(response);
        this.pythonProcess.SendStepOver(this.pythonProcess.LastExecutedThread.Id);
    };
    PythonDebugger.prototype.evaluateRequest = function (response, args) {
        var _this = this;
        this.debuggerLoaded.then(function () {
            var frame = _this._pythonStackFrames.get(args.frameId);
            if (!frame) {
                response.body = {
                    result: null,
                    variablesReference: 0
                };
                return _this.sendResponse(response);
            }
            _this.pythonProcess.ExecuteText(args.expression, Contracts_1.PythonEvaluationResultReprKind.Normal, frame).then(function (result) {
                var variablesReference = 0;
                // If this value can be expanded, then create a vars ref for user to expand it
                if (result.IsExpandable) {
                    var parentVariable = {
                        variables: [result],
                        evaluateChildren: true
                    };
                    variablesReference = _this._variableHandles.create(parentVariable);
                }
                response.body = {
                    result: result.StringRepr,
                    variablesReference: variablesReference
                };
                _this.sendResponse(response);
            }).catch(function (error) { return _this.sendErrorResponse(response, 2000, error); });
        });
    };
    PythonDebugger.prototype.scopesRequest = function (response, args) {
        var _this = this;
        this.debuggerLoaded.then(function () {
            var frame = _this._pythonStackFrames.get(args.frameId);
            if (!frame) {
                response.body = {
                    scopes: []
                };
                return _this.sendResponse(response);
            }
            var scopes = [];
            if (Array.isArray(frame.Locals) && frame.Locals.length > 0) {
                var values = { variables: frame.Locals };
                scopes.push(new vscode_debugadapter_1.Scope("Local", _this._variableHandles.create(values), false));
            }
            if (Array.isArray(frame.Parameters) && frame.Parameters.length > 0) {
                var values = { variables: frame.Parameters };
                scopes.push(new vscode_debugadapter_1.Scope("Arguments", _this._variableHandles.create(values), false));
            }
            response.body = { scopes: scopes };
            _this.sendResponse(response);
        });
    };
    PythonDebugger.prototype.variablesRequest = function (response, args) {
        var _this = this;
        var varRef = this._variableHandles.get(args.variablesReference);
        if (varRef.evaluateChildren !== true) {
            var variables_1 = [];
            varRef.variables.forEach(function (variable) {
                var variablesReference = 0;
                // If this value can be expanded, then create a vars ref for user to expand it
                if (variable.IsExpandable) {
                    var parentVariable = {
                        variables: [variable],
                        evaluateChildren: true
                    };
                    variablesReference = _this._variableHandles.create(parentVariable);
                }
                variables_1.push({
                    name: variable.Expression,
                    value: variable.StringRepr,
                    variablesReference: variablesReference
                });
            });
            response.body = {
                variables: variables_1
            };
            return this.sendResponse(response);
        }
        // Ok, we need to evaluate the children of the current variable
        var variables = [];
        var promises = varRef.variables.map(function (variable) {
            return variable.Process.EnumChildren(variable.Expression, variable.Frame, CHILD_ENUMEARATION_TIMEOUT).then(function (children) {
                children.forEach(function (child) {
                    var variablesReference = 0;
                    // If this value can be expanded, then create a vars ref for user to expand it
                    if (child.IsExpandable) {
                        var childVariable = {
                            variables: [child],
                            evaluateChildren: true
                        };
                        variablesReference = _this._variableHandles.create(childVariable);
                    }
                    variables.push({
                        name: child.ChildName,
                        value: child.StringRepr,
                        variablesReference: variablesReference
                    });
                });
            });
        });
        Promise.all(promises).then(function () {
            response.body = {
                variables: variables
            };
            return _this.sendResponse(response);
        }).catch(function (error) { return _this.sendErrorResponse(response, 2001, error); });
    };
    PythonDebugger.prototype.pauseRequest = function (response) {
        this.pythonProcess.Break();
        this.sendResponse(response);
    };
    PythonDebugger.prototype.setExceptionBreakPointsRequest = function (response, args) {
        var _this = this;
        this.debuggerLoaded.then(function () {
            var mode = Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_NEVER;
            if (args.filters.indexOf("uncaught") >= 0) {
                mode = Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_UNHANDLED;
            }
            if (args.filters.indexOf("all") >= 0) {
                mode = Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_ALWAYS;
            }
            var exToIgnore = null;
            var exceptionHandling = _this.launchArgs.exceptionHandling;
            if (exceptionHandling) {
                exToIgnore = new Map();
                if (Array.isArray(exceptionHandling.ignore)) {
                    exceptionHandling.ignore.forEach(function (exType) {
                        exToIgnore.set(exType, Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_NEVER);
                    });
                }
                if (Array.isArray(exceptionHandling.always)) {
                    exceptionHandling.always.forEach(function (exType) {
                        exToIgnore.set(exType, Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_ALWAYS);
                    });
                }
                if (Array.isArray(exceptionHandling.unhandled)) {
                    exceptionHandling.unhandled.forEach(function (exType) {
                        exToIgnore.set(exType, Contracts_1.enum_EXCEPTION_STATE.BREAK_MODE_UNHANDLED);
                    });
                }
            }
            _this.pythonProcess.SendExceptionInfo(mode, exToIgnore);
            _this.sendResponse(response);
        });
    };
    PythonDebugger.prototype.disconnectRequest = function (response, args) {
        this.stopDebugServer();
        this.sendResponse(response);
    };
    return PythonDebugger;
}(vscode_debugadapter_1.DebugSession));
exports.PythonDebugger = PythonDebugger;
vscode_debugadapter_1.DebugSession.run(PythonDebugger);
//# sourceMappingURL=Main.js.map