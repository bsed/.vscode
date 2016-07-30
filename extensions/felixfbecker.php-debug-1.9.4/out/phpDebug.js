'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _vscodeDebugadapter = require('vscode-debugadapter');

var vscode = _interopRequireWildcard(_vscodeDebugadapter);

var _net = require('net');

var net = _interopRequireWildcard(_net);

var _xdebugConnection = require('./xdebugConnection');

var xdebug = _interopRequireWildcard(_xdebugConnection);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _url = require('url');

var url = _interopRequireWildcard(_url);

var _child_process = require('child_process');

var childProcess = _interopRequireWildcard(_child_process);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _util = require('util');

var util = _interopRequireWildcard(_util);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _terminal = require('./terminal');

var _paths = require('./paths');

var _semver = require('semver');

var semver = _interopRequireWildcard(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};

if (process.env.VSCODE_NLS_CONFIG) {
    try {
        _moment2.default.locale(JSON.parse(process.env.VSCODE_NLS_CONFIG).locale);
    } catch (e) {}
}
/** formats a xdebug property value for VS Code */
function formatPropertyValue(property) {
    let displayValue;
    if (property.hasChildren || property.type === 'array' || property.type === 'object') {
        if (property.type === 'array') {
            // for arrays, show the length, like a var_dump would do
            displayValue = 'array(' + (property.hasChildren ? property.numberOfChildren : 0) + ')';
        } else if (property.type === 'object' && property.class) {
            // for objects, show the class name as type (if specified)
            displayValue = property.class;
        } else {
            // edge case: show the type of the property as the value
            displayValue = property.type;
        }
    } else {
        // for null, uninitialized, resource, etc. show the type
        displayValue = property.value || property.type === 'string' ? property.value : property.type;
        if (property.type === 'string') {
            displayValue = '"' + displayValue + '"';
        } else if (property.type === 'bool') {
            displayValue = !!parseInt(displayValue) + '';
        }
    }
    return displayValue;
}
class PhpDebugSession extends vscode.DebugSession {
    constructor() {
        super();
        /**
         * A map from VS Code thread IDs to XDebug Connections.
         * XDebug makes a new connection for each request to the webserver, we present these as threads to VS Code.
         * The threadId key is equal to the id attribute of the connection.
         */
        this._connections = new Map();
        /** A set of connections which are not yet running and are waiting for configurationDoneRequest */
        this._waitingConnections = new Set();
        /** A counter for unique source IDs */
        this._sourceIdCounter = 1;
        /** A map of VS Code source IDs to XDebug file URLs for virtual files (dpgp://whatever) and the corresponding connection */
        this._sources = new Map();
        /** A counter for unique stackframe IDs */
        this._stackFrameIdCounter = 1;
        /** A map from unique stackframe IDs (even across connections) to XDebug stackframes */
        this._stackFrames = new Map();
        /** A map from XDebug connections to their current status */
        this._statuses = new Map();
        /** A counter for unique context, property and eval result properties (as these are all requested by a VariableRequest from VS Code) */
        this._variableIdCounter = 1;
        /** A map from unique VS Code variable IDs to XDebug statuses for virtual error stack frames */
        this._errorStackFrames = new Map();
        /** A map from unique VS Code variable IDs to XDebug statuses for virtual error scopes */
        this._errorScopes = new Map();
        /** A map from unique VS Code variable IDs to an XDebug contexts */
        this._contexts = new Map();
        /** A map from unique VS Code variable IDs to a XDebug properties */
        this._properties = new Map();
        /** A map from unique VS Code variable IDs to XDebug eval result properties, because property children returned from eval commands are always inlined */
        this._evalResultProperties = new Map();
        this.setDebuggerColumnsStartAt1(true);
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerPathFormat('uri');
    }
    initializeRequest(response, args) {
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsEvaluateForHovers = false;
        response.body.supportsConditionalBreakpoints = true;
        response.body.supportsFunctionBreakpoints = true;
        response.body.exceptionBreakpointFilters = [{
            filter: 'Notice',
            label: 'Notices'
        }, {
            filter: 'Warning',
            label: 'Warnings'
        }, {
            filter: 'Exception',
            label: 'Exceptions'
        }, {
            filter: '*',
            label: 'Everything',
            default: true
        }];
        this.sendResponse(response);
    }
    attachRequest(response, args) {
        this.sendErrorResponse(response, new Error('Attach requests are not supported'));
        this.shutdown();
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this._args = args;
            /** launches the script as CLI */
            const launchScript = () => __awaiter(this, void 0, void 0, function* () {
                // check if program exists
                yield new Promise((resolve, reject) => fs.access(args.program, fs.F_OK, err => err ? reject(err) : resolve()));
                const runtimeArgs = args.runtimeArgs || [];
                const runtimeExecutable = args.runtimeExecutable || 'php';
                const programArgs = args.args || [];
                const cwd = args.cwd || process.cwd();
                const env = args.env || process.env;
                // launch in CLI mode
                if (args.externalConsole) {
                    const script = yield _terminal.Terminal.launchInTerminal(cwd, [runtimeExecutable, ...runtimeArgs, args.program, ...programArgs], env);
                    // we only do this for CLI mode. In normal listen mode, only a thread exited event is send.
                    script.on('exit', () => {
                        this.sendEvent(new vscode.TerminatedEvent());
                    });
                } else {
                    const script = childProcess.spawn(runtimeExecutable, [...runtimeArgs, args.program, ...programArgs], { cwd: cwd, env: env });
                    // redirect output to debug console
                    script.stdout.on('data', data => {
                        this.sendEvent(new vscode.OutputEvent(data + '', 'stdout'));
                    });
                    script.stderr.on('data', data => {
                        this.sendEvent(new vscode.OutputEvent(data + '', 'stderr'));
                    });
                    // we only do this for CLI mode. In normal listen mode, only a thread exited event is send.
                    script.on('exit', () => {
                        this.sendEvent(new vscode.TerminatedEvent());
                    });
                    script.on('error', error => {
                        this.sendEvent(new vscode.OutputEvent(error.message));
                    });
                }
            });
            /** sets up a TCP server to listen for XDebug connections */
            const createServer = () => new Promise((resolve, reject) => {
                const server = this._server = net.createServer();
                server.on('connection', socket => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // new XDebug connection
                        const connection = new xdebug.Connection(socket);
                        if (args.log) {
                            this.sendEvent(new vscode.OutputEvent('new connection ' + connection.id + '\n'), true);
                        }
                        this._connections.set(connection.id, connection);
                        this._waitingConnections.add(connection);
                        const disposeConnection = error => {
                            if (this._connections.has(connection.id)) {
                                if (args.log) {
                                    this.sendEvent(new vscode.OutputEvent('connection ' + connection.id + ' closed\n'));
                                }
                                if (error) {
                                    this.sendEvent(new vscode.OutputEvent(error.message));
                                }
                                this.sendEvent(new vscode.ThreadEvent('exited', connection.id));
                                connection.close();
                                this._connections.delete(connection.id);
                                this._waitingConnections.delete(connection);
                            }
                        };
                        connection.on('warning', warning => {
                            this.sendEvent(new vscode.OutputEvent(warning));
                        });
                        connection.on('error', disposeConnection);
                        connection.on('close', disposeConnection);
                        const initPacket = yield connection.waitForInitPacket();
                        this.sendEvent(new vscode.ThreadEvent('started', connection.id));
                        // set max_depth to 1 since VS Code requests nested structures individually anyway
                        yield connection.sendFeatureSetCommand('max_depth', '1');
                        // raise default of 32
                        yield connection.sendFeatureSetCommand('max_children', '10000');
                        // don't truncate long variable values
                        yield connection.sendFeatureSetCommand('max_data', semver.lt(initPacket.engineVersion.replace(/((?:dev|alpha|beta|RC|stable)\d*)$/, '-$1'), '2.2.4') ? '10000' : '0');
                        // request breakpoints from VS Code
                        yield this.sendEvent(new vscode.InitializedEvent());
                    } catch (error) {
                        this.sendEvent(new vscode.OutputEvent(error instanceof Error ? error.message : error));
                    }
                }));
                server.on('error', error => {
                    this.sendEvent(new vscode.OutputEvent(error.message));
                    this.shutdown();
                });
                server.listen(args.port || 9000, error => error ? reject(error) : resolve());
            });
            try {
                if (!args.noDebug) {
                    yield createServer();
                }
                if (args.program) {
                    yield launchScript();
                }
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /**
     * Checks the status of a StatusResponse and notifies VS Code accordingly
     * @param {xdebug.StatusResponse} response
     */
    _checkStatus(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = response.connection;
            this._statuses.set(connection, response);
            if (response.status === 'stopping') {
                const response = yield connection.sendStopCommand();
                this._checkStatus(response);
            } else if (response.status === 'stopped') {
                this._connections.delete(connection.id);
                this.sendEvent(new vscode.ThreadEvent('exited', connection.id));
                connection.close();
            } else if (response.status === 'break') {
                // StoppedEvent reason can be 'step', 'breakpoint', 'exception' or 'pause'
                let stoppedEventReason;
                let exceptionText;
                if (response.exception) {
                    stoppedEventReason = 'exception';
                    exceptionText = response.exception.name + ': ' + response.exception.message; // this seems to be ignored currently by VS Code
                } else if (this._args.stopOnEntry) {
                        stoppedEventReason = 'entry';
                    } else if (response.command.indexOf('step') === 0) {
                        stoppedEventReason = 'step';
                    } else {
                        stoppedEventReason = 'breakpoint';
                    }
                const event = new vscode.StoppedEvent(stoppedEventReason, connection.id, exceptionText);
                event.body.allThreadsStopped = false;
                this.sendEvent(event);
            }
        });
    }
    /** Logs all requests before dispatching */
    dispatchRequest(request) {
        if (this._args && this._args.log) {
            const log = `-> ${ request.command }Request\n${ util.inspect(request, { depth: null }) }\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.dispatchRequest(request);
    }
    sendEvent(event) {
        let bypassLog = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        if (this._args && this._args.log && !bypassLog) {
            const log = `<- ${ event.event }Event\n${ util.inspect(event, { depth: null }) }\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.sendEvent(event);
    }
    sendResponse(response) {
        if (this._args && this._args.log) {
            const log = `<- ${ response.command }Response\n${ util.inspect(response, { depth: null }) }\n\n`;
            super.sendEvent(new vscode.OutputEvent(log));
        }
        super.sendResponse(response);
    }
    sendErrorResponse(response) {
        if (arguments[1] instanceof Error) {
            const error = arguments[1];
            const dest = arguments[2];
            let code;
            if (typeof error.code === 'number') {
                code = error.code;
            } else if (typeof error.errno === 'number') {
                code = error.errno;
            } else {
                code = 0;
            }
            super.sendErrorResponse(response, code, error.message, dest);
        } else {
            super.sendErrorResponse(response, arguments[1], arguments[2], arguments[3], arguments[4]);
        }
    }
    /** This is called for each source file that has breakpoints with all the breakpoints in that file and whenever these change. */
    setBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileUri = (0, _paths.convertClientPathToDebugger)(args.source.path, this._args.localSourceRoot, this._args.serverSourceRoot);
                const connections = Array.from(this._connections.values());
                let xdebugBreakpoints;
                response.body = { breakpoints: [] };
                // this is returned to VS Code
                let vscodeBreakpoints;
                if (connections.length === 0) {
                    // if there are no connections yet, we cannot verify any breakpoint
                    vscodeBreakpoints = args.breakpoints.map(breakpoint => ({ verified: false, line: breakpoint.line }));
                } else {
                    vscodeBreakpoints = [];
                    // create XDebug breakpoints from the arguments
                    xdebugBreakpoints = args.breakpoints.map(breakpoint => {
                        if (breakpoint.condition) {
                            return new xdebug.ConditionalBreakpoint(breakpoint.condition, fileUri, breakpoint.line);
                        } else {
                            return new xdebug.LineBreakpoint(fileUri, breakpoint.line);
                        }
                    });
                    // for all connections
                    yield Promise.all(connections.map((connection, connectionIndex) => __awaiter(this, void 0, void 0, function* () {
                        // clear breakpoints for this file
                        // in the future when VS Code returns the breakpoint IDs it would be better to calculate the diff

                        var _ref = yield connection.sendBreakpointListCommand();

                        const breakpoints = _ref.breakpoints;

                        yield Promise.all(breakpoints.filter(breakpoint => breakpoint instanceof xdebug.LineBreakpoint && (0, _paths.isSameUri)(fileUri, breakpoint.fileUri)).map(breakpoint => breakpoint.remove()));
                        // set new breakpoints
                        yield Promise.all(xdebugBreakpoints.map((breakpoint, index) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield connection.sendBreakpointSetCommand(breakpoint);
                                // only capture each breakpoint once
                                if (connectionIndex === 0) {
                                    vscodeBreakpoints[index] = { verified: true, line: breakpoint.line };
                                }
                            } catch (error) {
                                // only capture each breakpoint once
                                if (connectionIndex === 0) {
                                    vscodeBreakpoints[index] = { verified: false, line: breakpoint.line, message: error.message };
                                }
                            }
                        })));
                    })));
                }
                response.body = { breakpoints: vscodeBreakpoints };
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /** This is called once after all line breakpoints have been set and whenever the breakpoints settings change */
    setExceptionBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connections = Array.from(this._connections.values());
                yield Promise.all(connections.map(connection => __awaiter(this, void 0, void 0, function* () {
                    // get all breakpoints

                    var _ref2 = yield connection.sendBreakpointListCommand();

                    const breakpoints = _ref2.breakpoints;
                    // remove all exception breakpoints

                    yield Promise.all(breakpoints.filter(breakpoint => breakpoint.type === 'exception').map(breakpoint => breakpoint.remove()));
                    // set new exception breakpoints
                    yield Promise.all(args.filters.map(filter => connection.sendBreakpointSetCommand(new xdebug.ExceptionBreakpoint(filter))));
                })));
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    setFunctionBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connections = Array.from(this._connections.values());
                // this is returned to VS Code
                let vscodeBreakpoints;
                if (connections.length === 0) {
                    // if there are no connections yet, we cannot verify any breakpoint
                    vscodeBreakpoints = args.breakpoints.map(breakpoint => ({ verified: false, message: 'No connection' }));
                } else {
                    vscodeBreakpoints = [];
                    // for all connections
                    yield Promise.all(connections.map((connection, connectionIndex) => __awaiter(this, void 0, void 0, function* () {
                        // clear breakpoints for this file

                        var _ref3 = yield connection.sendBreakpointListCommand();

                        const breakpoints = _ref3.breakpoints;

                        yield Promise.all(breakpoints.filter(breakpoint => breakpoint.type === 'call').map(breakpoint => breakpoint.remove()));
                        // set new breakpoints
                        yield Promise.all(args.breakpoints.map((functionBreakpoint, index) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield connection.sendBreakpointSetCommand(new xdebug.CallBreakpoint(functionBreakpoint.name, functionBreakpoint.condition));
                                // only capture each breakpoint once
                                if (connectionIndex === 0) {
                                    vscodeBreakpoints[index] = { verified: true };
                                }
                            } catch (error) {
                                // only capture each breakpoint once
                                if (connectionIndex === 0) {
                                    vscodeBreakpoints[index] = { verified: false, message: error instanceof Error ? error.message : error };
                                }
                            }
                        })));
                    })));
                }
                response.body = { breakpoints: vscodeBreakpoints };
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    /** Executed after all breakpoints have been set by VS Code */
    configurationDoneRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponses = [];
            try {
                xdebugResponses = yield Promise.all(Array.from(this._waitingConnections).map(connection => {
                    this._waitingConnections.delete(connection);
                    // either tell VS Code we stopped on entry or run the script
                    if (this._args.stopOnEntry) {
                        // do one step to the first statement
                        return connection.sendStepIntoCommand();
                    } else {
                        return connection.sendRunCommand();
                    }
                }));
            } catch (error) {
                this.sendErrorResponse(response, error);
                for (const response of xdebugResponses) {
                    this._checkStatus(response);
                }
                return;
            }
            this.sendResponse(response);
            for (const response of xdebugResponses) {
                this._checkStatus(response);
            }
        });
    }
    /** Executed after a successfull launch or attach request and after a ThreadEvent */
    threadsRequest(response) {
        // PHP doesn't have threads, but it may have multiple requests in parallel.
        // Think about a website that makes multiple, parallel AJAX requests to your PHP backend.
        // XDebug opens a new socket connection for each of them, we tell VS Code that these are our threads.
        const connections = Array.from(this._connections.values());
        response.body = {
            threads: connections.map(connection => new vscode.Thread(connection.id, `Request ${ connection.id } (${ (0, _moment2.default)(connection.timeEstablished).format('LTS') })`))
        };
        this.sendResponse(response);
    }
    /** Called by VS Code after a StoppedEvent */
    stackTraceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID');
                }

                var _ref4 = yield connection.sendStackGetCommand();

                const stack = _ref4.stack;
                // First delete the old stack trace info ???
                // this._stackFrames.clear();
                // this._properties.clear();
                // this._contexts.clear();

                const status = this._statuses.get(connection);
                if (stack.length === 0 && status && status.exception) {
                    // special case: if a fatal error occurs (for example after an uncaught exception), the stack trace is EMPTY.
                    // in that case, VS Code would normally not show any information to the user at all
                    // to avoid this, we create a virtual stack frame with the info from the last status response we got
                    const status = this._statuses.get(connection);
                    const id = this._stackFrameIdCounter++;
                    const name = status.exception.name;
                    let line = status.line;
                    let source;
                    const urlObject = url.parse(status.fileUri);
                    if (urlObject.protocol === 'dbgp:') {
                        const sourceReference = this._sourceIdCounter++;
                        this._sources.set(sourceReference, { connection: connection, url: status.fileUri });
                        // for eval code, we need to include .php extension to get syntax highlighting
                        source = new vscode.Source(status.exception.name + '.php', null, sourceReference, status.exception.name);
                        // for eval code, we add a "<?php" line at the beginning to get syntax highlighting (see sourceRequest)
                        line++;
                    } else {
                        // XDebug paths are URIs, VS Code file paths
                        const filePath = (0, _paths.convertDebuggerPathToClient)(urlObject, this._args.localSourceRoot, this._args.serverSourceRoot);
                        // "Name" of the source and the actual file path
                        source = new vscode.Source(path.basename(filePath), filePath);
                    }
                    this._errorStackFrames.set(id, status);
                    response.body = { stackFrames: [new vscode.StackFrame(id, name, source, status.line, 1)] };
                } else {
                    response.body = {
                        stackFrames: stack.map(stackFrame => {
                            let source;
                            let line = stackFrame.line;
                            const urlObject = url.parse(stackFrame.fileUri);
                            if (urlObject.protocol === 'dbgp:') {
                                const sourceReference = this._sourceIdCounter++;
                                this._sources.set(sourceReference, { connection: connection, url: stackFrame.fileUri });
                                // for eval code, we need to include .php extension to get syntax highlighting
                                source = new vscode.Source(stackFrame.type === 'eval' ? 'eval.php' : stackFrame.name, null, sourceReference, stackFrame.type);
                                // for eval code, we add a "<?php" line at the beginning to get syntax highlighting (see sourceRequest)
                                line++;
                            } else {
                                // XDebug paths are URIs, VS Code file paths
                                const filePath = (0, _paths.convertDebuggerPathToClient)(urlObject, this._args.localSourceRoot, this._args.serverSourceRoot);
                                // "Name" of the source and the actual file path
                                source = new vscode.Source(path.basename(filePath), filePath);
                            }
                            // a new, unique ID for scopeRequests
                            const stackFrameId = this._stackFrameIdCounter++;
                            // save the connection this stackframe belongs to and the level of the stackframe under the stacktrace id
                            this._stackFrames.set(stackFrameId, stackFrame);
                            // prepare response for VS Code (column is always 1 since XDebug doesn't tell us the column)
                            return new vscode.StackFrame(stackFrameId, stackFrame.name, source, line, 1);
                        })
                    };
                }
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    sourceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var _sources$get = this._sources.get(args.sourceReference);

                const connection = _sources$get.connection;
                const url = _sources$get.url;

                var _ref5 = yield connection.sendSourceCommand(url);

                let source = _ref5.source;

                if (!/^\s*<\?(php|=)/.test(source)) {
                    // we do this because otherwise VS Code would not show syntax highlighting for eval() code
                    source = '<?php\n' + source;
                }
                response.body = { content: source };
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    scopesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let scopes = [];
                if (this._errorStackFrames.has(args.frameId)) {
                    // VS Code is requesting the scopes for a virtual error stack frame
                    const status = this._errorStackFrames.get(args.frameId);
                    if (status.exception) {
                        const variableId = this._variableIdCounter++;
                        this._errorScopes.set(variableId, status);
                        scopes = [new vscode.Scope(status.exception.name.replace(/^(.*\\)+/g, ''), variableId)];
                    }
                } else {
                    const stackFrame = this._stackFrames.get(args.frameId);
                    const contexts = yield stackFrame.getContexts();
                    scopes = contexts.map(context => {
                        const variableId = this._variableIdCounter++;
                        // remember that this new variable ID is assigned to a SCOPE (in XDebug "context"), not a variable (in XDebug "property"),
                        // so when VS Code does a variablesRequest with that ID we do a context_get and not a property_get
                        this._contexts.set(variableId, context);
                        // send VS Code the variable ID as identifier
                        return new vscode.Scope(context.name, variableId);
                    });
                    const status = this._statuses.get(stackFrame.connection);
                    if (status && status.exception) {
                        const variableId = this._variableIdCounter++;
                        this._errorScopes.set(variableId, status);
                        scopes.unshift(new vscode.Scope(status.exception.name.replace(/^(.*\\)+/g, ''), variableId));
                    }
                }
                response.body = { scopes: scopes };
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    variablesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const variablesReference = args.variablesReference;
                let variables;
                if (this._errorScopes.has(variablesReference)) {
                    // this is a virtual error scope
                    const status = this._errorScopes.get(variablesReference);
                    variables = [new vscode.Variable('type', status.exception.name), new vscode.Variable('message', '"' + status.exception.message + '"')];
                    if (status.exception.code !== undefined) {
                        variables.push(new vscode.Variable('code', status.exception.code + ''));
                    }
                } else {
                    // it is a real scope
                    let properties;
                    if (this._contexts.has(variablesReference)) {
                        // VS Code is requesting the variables for a SCOPE, so we have to do a context_get
                        const context = this._contexts.get(variablesReference);
                        properties = yield context.getProperties();
                    } else if (this._properties.has(variablesReference)) {
                        // VS Code is requesting the subelements for a variable, so we have to do a property_get
                        const property = this._properties.get(variablesReference);
                        properties = property.hasChildren ? yield property.getChildren() : [];
                    } else if (this._evalResultProperties.has(variablesReference)) {
                        // the children of properties returned from an eval command are always inlined, so we simply resolve them
                        const property = this._evalResultProperties.get(variablesReference);
                        properties = property.hasChildren ? property.children : [];
                    } else {
                        throw new Error('Unknown variable reference');
                    }
                    variables = properties.map(property => {
                        const displayValue = formatPropertyValue(property);
                        let variablesReference;
                        if (property.hasChildren || property.type === 'array' || property.type === 'object') {
                            // if the property has children, we have to send a variableReference back to VS Code
                            // so it can receive the child elements in another request.
                            // for arrays and objects we do it even when it does not have children so the user can still expand/collapse the entry
                            variablesReference = this._variableIdCounter++;
                            if (property instanceof xdebug.Property) {
                                this._properties.set(variablesReference, property);
                            } else if (property instanceof xdebug.EvalResultProperty) {
                                this._evalResultProperties.set(variablesReference, property);
                            }
                        } else {
                            variablesReference = 0;
                        }
                        return new vscode.Variable(property.name, displayValue, variablesReference);
                    });
                }
                response.body = { variables: variables };
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
        });
    }
    continueRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendRunCommand();
            } catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    nextRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepOverCommand();
            } catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            response.body = {
                allThreadsContinued: false
            };
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    stepInRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepIntoCommand();
            } catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    stepOutRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let xdebugResponse;
            try {
                const connection = this._connections.get(args.threadId);
                if (!connection) {
                    throw new Error('Unknown thread ID ' + args.threadId);
                }
                xdebugResponse = yield connection.sendStepOutCommand();
            } catch (error) {
                this.sendErrorResponse(response, error);
                if (xdebugResponse) {
                    this._checkStatus(xdebugResponse);
                }
                return;
            }
            this.sendResponse(response);
            this._checkStatus(xdebugResponse);
        });
    }
    pauseRequest(response, args) {
        this.sendErrorResponse(response, new Error('Pausing the execution is not supported by XDebug'));
    }
    disconnectRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all(Array.from(this._connections).map(_ref6 => {
                    var _ref7 = _slicedToArray(_ref6, 2);

                    let id = _ref7[0];
                    let connection = _ref7[1];
                    return __awaiter(this, void 0, void 0, function* () {
                        yield connection.sendStopCommand();
                        yield connection.close();
                        this._connections.delete(id);
                        this._waitingConnections.delete(connection);
                    });
                }));
                if (this._server) {
                    yield new Promise(resolve => this._server.close(resolve));
                }
            } catch (error) {
                this.sendErrorResponse(response, error);
                return;
            }
            this.sendResponse(response);
            this.shutdown();
        });
    }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = this._stackFrames.get(args.frameId).connection;

                var _ref8 = yield connection.sendEvalCommand(args.expression);

                const result = _ref8.result;

                if (result) {
                    const displayValue = formatPropertyValue(result);
                    let variablesReference;
                    // if the property has children, generate a variable ID and save the property (including children) so VS Code can request them
                    if (result.hasChildren || result.type === 'array' || result.type === 'object') {
                        variablesReference = this._variableIdCounter++;
                        this._evalResultProperties.set(variablesReference, result);
                    } else {
                        variablesReference = 0;
                    }
                    response.body = { result: displayValue, variablesReference: variablesReference };
                } else {
                    response.body = { result: 'no result', variablesReference: 0 };
                }
                this.sendResponse(response);
            } catch (error) {
                this.sendErrorResponse(response, error);
            }
        });
    }
}
vscode.DebugSession.run(PhpDebugSession);
//# sourceMappingURL=phpDebug.js.map
