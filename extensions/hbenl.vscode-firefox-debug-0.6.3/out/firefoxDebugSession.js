"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var os = require('os');
var path = require('path');
var net_1 = require('net');
var log_1 = require('./util/log');
var launcher_1 = require('./util/launcher');
var vscode_debugadapter_1 = require('vscode-debugadapter');
var index_1 = require('./firefox/index');
var index_2 = require('./adapter/index');
var log = log_1.Log.create('FirefoxDebugSession');
var pathConversionLog = log_1.Log.create('PathConversion');
var FirefoxDebugSession = (function (_super) {
    __extends(FirefoxDebugSession, _super);
    function FirefoxDebugSession(debuggerLinesStartAt1, isServer) {
        var _this = this;
        if (isServer === void 0) { isServer = false; }
        _super.call(this, debuggerLinesStartAt1, isServer);
        this.firefoxProc = null;
        this.nextThreadId = 1;
        this.threadsById = new Map();
        this.nextBreakpointId = 1;
        this.breakpointsBySourceUrl = new Map();
        this.verifiedBreakpointSources = [];
        this.nextFrameId = 1;
        this.framesById = new Map();
        this.nextVariablesProviderId = 1;
        this.variablesProvidersById = new Map();
        this.nextSourceId = 1;
        this.sourcesById = new Map();
        this.exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        this.isWindowsPlatform = (os.platform() === 'win32');
        if (!isServer) {
            log_1.Log.consoleLog = function (msg) {
                _this.sendEvent(new vscode_debugadapter_1.OutputEvent(msg + '\n'));
            };
        }
    }
    FirefoxDebugSession.prototype.registerVariablesProvider = function (variablesProvider) {
        var providerId = this.nextVariablesProviderId++;
        variablesProvider.variablesProviderId = providerId;
        this.variablesProvidersById.set(providerId, variablesProvider);
    };
    FirefoxDebugSession.prototype.unregisterVariablesProvider = function (variablesProvider) {
        this.variablesProvidersById.delete(variablesProvider.variablesProviderId);
    };
    FirefoxDebugSession.prototype.registerFrameAdapter = function (frameAdapter) {
        var frameId = this.nextFrameId++;
        frameAdapter.id = frameId;
        this.framesById.set(frameAdapter.id, frameAdapter);
    };
    FirefoxDebugSession.prototype.unregisterFrameAdapter = function (frameAdapter) {
        this.framesById.delete(frameAdapter.id);
    };
    FirefoxDebugSession.prototype.getOrCreateObjectGripActorProxy = function (objectGrip) {
        var _this = this;
        return this.firefoxDebugConnection.getOrCreate(objectGrip.actor, function () {
            return new index_1.ObjectGripActorProxy(objectGrip, _this.firefoxDebugConnection);
        });
    };
    FirefoxDebugSession.prototype.getOrCreateLongStringGripActorProxy = function (longStringGrip) {
        var _this = this;
        return this.firefoxDebugConnection.getOrCreate(longStringGrip.actor, function () {
            return new index_1.LongStringGripActorProxy(longStringGrip, _this.firefoxDebugConnection);
        });
    };
    FirefoxDebugSession.prototype.convertPathToFirefoxUrl = function (path) {
        var url = path;
        if (this.isWindowsPlatform) {
            url = url.replace(/\\/g, '/');
        }
        if (this.webRoot) {
            if (url.substr(0, this.webRoot.length) === this.webRoot) {
                url = this.webRootUrl + url.substr(this.webRoot.length);
            }
            else {
                pathConversionLog.warn("Can't convert path " + path + " to url");
                return null;
            }
        }
        else {
            url = (this.isWindowsPlatform ? 'file:///' : 'file://') + url;
        }
        pathConversionLog.debug("Converted path " + path + " to url " + url);
        return url;
    };
    FirefoxDebugSession.prototype.convertFirefoxUrlToPath = function (url) {
        var path = url;
        if (this.webRootUrl && (path.substr(0, this.webRootUrl.length) === this.webRootUrl)) {
            path = this.webRoot + path.substr(this.webRootUrl.length);
        }
        else if (path.substr(0, 7) === 'file://') {
            path = path.substr(this.isWindowsPlatform ? 8 : 7);
        }
        else {
            pathConversionLog.warn("Can't convert url " + url + " to path");
            return null;
        }
        if (this.isWindowsPlatform) {
            path = path.replace(/\//g, '\\');
        }
        pathConversionLog.debug("Converted url " + url + " to path " + path);
        return path;
    };
    FirefoxDebugSession.prototype.initializeRequest = function (response, args) {
        response.body = {
            supportsConfigurationDoneRequest: false,
            supportsEvaluateForHovers: false,
            supportsFunctionBreakpoints: false,
            supportsConditionalBreakpoints: true,
            exceptionBreakpointFilters: [
                {
                    filter: 'all',
                    label: 'All Exceptions',
                    default: false
                },
                {
                    filter: 'uncaught',
                    label: 'Uncaught Exceptions',
                    default: true
                }
            ]
        };
        this.sendResponse(response);
    };
    FirefoxDebugSession.prototype.launchRequest = function (response, args) {
        var _this = this;
        var configError = this.readCommonConfiguration(args);
        if (configError) {
            response.success = false;
            response.message = configError;
            this.sendResponse(response);
            return;
        }
        var launchResult = launcher_1.launchFirefox(args, function (path) { return _this.convertPathToFirefoxUrl(path); });
        if (typeof launchResult === 'string') {
            response.success = false;
            response.message = launchResult;
            this.sendResponse(response);
            return;
        }
        else {
            this.firefoxProc = launchResult;
        }
        launcher_1.waitForSocket(args).then(function (socket) {
            _this.startSession(socket);
            _this.sendResponse(response);
        }, function (err) {
            log.error('Error: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.attachRequest = function (response, args) {
        var _this = this;
        var configError = this.readCommonConfiguration(args);
        if (configError) {
            response.success = false;
            response.message = configError;
            this.sendResponse(response);
            return;
        }
        var socket = net_1.connect(args.port || 6000, args.host || 'localhost');
        this.startSession(socket);
        socket.on('connect', function () {
            _this.sendResponse(response);
        });
        socket.on('error', function (err) {
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.readCommonConfiguration = function (args) {
        if (args.url) {
            if (!args.webRoot) {
                return "If you set \"url\" you also have to set \"webRoot\" in the " + args.request + " configuration";
            }
            else if (!path.isAbsolute(args.webRoot)) {
                return "The \"webRoot\" property in the " + args.request + " configuration has to be an absolute path";
            }
            this.webRootUrl = args.url;
            if (this.webRootUrl.indexOf('/') >= 0) {
                this.webRootUrl = this.webRootUrl.substr(0, this.webRootUrl.lastIndexOf('/'));
            }
            this.webRoot = path.normalize(args.webRoot);
            if (this.isWindowsPlatform) {
                this.webRoot = this.webRoot.replace(/\\/g, '/');
            }
            if (this.webRoot[this.webRoot.length - 1] === '/') {
                this.webRoot = this.webRoot.substr(0, this.webRoot.length - 1);
            }
        }
        else if (args.webRoot) {
            return "If you set \"webRoot\" you also have to set \"url\" in the " + args.request + " configuration";
        }
        if (args.log) {
            log_1.Log.config = args.log;
        }
    };
    FirefoxDebugSession.prototype.startSession = function (socket) {
        var _this = this;
        this.firefoxDebugConnection = new index_1.DebugConnection(socket);
        var rootActor = this.firefoxDebugConnection.rootActor;
        var nextTabId = 1;
        // attach to all tabs, register the corresponding threads and inform VSCode about them
        rootActor.onTabOpened(function (_a) {
            var tabActor = _a[0], consoleActor = _a[1];
            log.info("Tab opened with url " + tabActor.url);
            var tabId = nextTabId++;
            _this.attachTab(tabActor, consoleActor, tabId);
            _this.attachConsole(consoleActor);
        });
        rootActor.onTabListChanged(function () {
            rootActor.fetchTabs();
        });
        rootActor.onInit(function () {
            rootActor.fetchTabs();
        });
        // now we are ready to accept breakpoints -> fire the initialized event to give UI a chance to set breakpoints
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    };
    FirefoxDebugSession.prototype.attachTab = function (tabActor, consoleActor, tabId) {
        var _this = this;
        tabActor.attach().then(function (threadActor) {
            log.debug("Attached to tab " + tabActor.name);
            var threadId = _this.nextThreadId++;
            var threadAdapter = new index_2.ThreadAdapter(threadId, threadActor, consoleActor, "Tab " + tabId, _this);
            _this.attachThread(threadActor, threadAdapter);
            threadAdapter.init(_this.exceptionBreakpoints).then(function () {
                _this.threadsById.set(threadId, threadAdapter);
                _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', threadId));
                tabActor.onDetached(function () {
                    _this.threadsById.delete(threadId);
                    _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadId));
                });
            }, function (err) {
                // When the user closes a tab, Firefox creates an invisible tab and
                // immediately closes it again (while we're still trying to attach to it),
                // so the initialization for this invisible tab fails and we end up here.
                // Since we never sent the current threadId to VSCode, we can re-use it
                if (_this.nextThreadId == (threadId + 1)) {
                    _this.nextThreadId--;
                }
            });
            var nextWorkerId = 1;
            tabActor.onWorkerStarted(function (workerActor) {
                log.info("Worker started with url " + tabActor.url);
                var workerId = nextWorkerId++;
                _this.attachWorker(workerActor, tabId, workerId);
            });
            tabActor.onWorkerListChanged(function () { return tabActor.fetchWorkers(); });
            tabActor.fetchWorkers();
        }, function (err) {
            log.error("Failed attaching to tab: " + err);
        });
    };
    FirefoxDebugSession.prototype.attachWorker = function (workerActor, tabId, workerId) {
        var _this = this;
        workerActor.attach().then(function (url) { return workerActor.connect(); }).then(function (threadActor) {
            log.debug("Attached to worker " + workerActor.name);
            var threadId = _this.nextThreadId++;
            var threadAdapter = new index_2.ThreadAdapter(threadId, threadActor, null, "Worker " + tabId + "/" + workerId, _this);
            _this.attachThread(threadActor, threadAdapter);
            threadAdapter.init(_this.exceptionBreakpoints).then(function () {
                _this.threadsById.set(threadId, threadAdapter);
                _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', threadId));
                workerActor.onClose(function () {
                    _this.threadsById.delete(threadId);
                    _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadId));
                });
            }, function (err) {
                log.error('Failed initializing worker thread');
            });
        }, function (err) {
            log.error("Failed attaching to worker: " + err);
        });
    };
    FirefoxDebugSession.prototype.attachThread = function (threadActor, threadAdapter) {
        var _this = this;
        threadActor.onNewSource(function (sourceActor) {
            log.debug("New source " + sourceActor.url + " in thread " + threadActor.name);
            _this.attachSource(sourceActor, threadAdapter);
        });
        threadActor.onPaused(function (reason) {
            log.info("Thread " + threadActor.name + " paused , reason: " + reason.type);
            var stoppedEvent = new vscode_debugadapter_1.StoppedEvent(reason.type, threadAdapter.id);
            stoppedEvent.body.allThreadsStopped = false;
            _this.sendEvent(stoppedEvent);
        });
        threadActor.onResumed(function () {
            log.info("Thread " + threadActor.name + " resumed unexpectedly");
            _this.sendEvent(new vscode_debugadapter_1.ContinuedEvent(threadAdapter.id));
        });
        threadActor.onExited(function () {
            log.info("Thread " + threadActor.name + " exited");
            _this.threadsById.delete(threadAdapter.id);
            _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadAdapter.id));
        });
    };
    FirefoxDebugSession.prototype.attachSource = function (sourceActor, threadAdapter) {
        var _this = this;
        var sourceId = this.nextSourceId++;
        var sourceAdapter = threadAdapter.createSourceAdapter(sourceId, sourceActor);
        this.sourcesById.set(sourceId, sourceAdapter);
        if (this.breakpointsBySourceUrl.has(sourceActor.url)) {
            var breakpointInfos = this.breakpointsBySourceUrl.get(sourceActor.url);
            var setBreakpointsPromise = threadAdapter.setBreakpoints(breakpointInfos, sourceAdapter);
            if (this.verifiedBreakpointSources.indexOf(sourceActor.url) < 0) {
                setBreakpointsPromise.then(function (breakpointAdapters) {
                    log.debug('Updating breakpoints');
                    breakpointAdapters.forEach(function (breakpointAdapter) {
                        var breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine);
                        breakpoint.id = breakpointAdapter.breakpointInfo.id;
                        _this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('update', breakpoint));
                    });
                    _this.verifiedBreakpointSources.push(sourceActor.url);
                });
            }
        }
    };
    FirefoxDebugSession.prototype.attachConsole = function (consoleActor) {
        var _this = this;
        consoleActor.onConsoleAPICall(function (msg) {
            var category = (msg.level === 'error') ? 'stderr' :
                (msg.level === 'warn') ? 'console' : 'stdout';
            var displayMsg = msg.arguments.join(',') + '\n';
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(displayMsg, category));
        });
        consoleActor.onPageErrorCall(function (err) {
            var category = err.exception ? 'stderr' : 'stdout';
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(err.errorMessage + '\n', category));
        });
        consoleActor.startListeners();
    };
    FirefoxDebugSession.prototype.threadsRequest = function (response) {
        log.debug("Received threadsRequest - replying with " + this.threadsById.size + " threads");
        var responseThreads = [];
        this.threadsById.forEach(function (threadAdapter) {
            responseThreads.push(new vscode_debugadapter_1.Thread(threadAdapter.id, threadAdapter.name));
        });
        response.body = { threads: responseThreads };
        this.sendResponse(response);
    };
    FirefoxDebugSession.prototype.setBreakPointsRequest = function (response, args) {
        var _this = this;
        log.debug("Received setBreakpointsRequest with " + args.breakpoints.length + " breakpoints for " + args.source.path);
        var firefoxSourceUrl = this.convertPathToFirefoxUrl(args.source.path);
        var breakpointInfos = args.breakpoints.map(function (breakpoint) { return {
            id: _this.nextBreakpointId++,
            requestedLine: breakpoint.line,
            condition: breakpoint.condition
        }; });
        this.breakpointsBySourceUrl.set(firefoxSourceUrl, breakpointInfos);
        this.verifiedBreakpointSources =
            this.verifiedBreakpointSources.filter(function (sourceUrl) { return (sourceUrl !== firefoxSourceUrl); });
        this.threadsById.forEach(function (threadAdapter) {
            var sourceAdapter = threadAdapter.findSourceAdapterForUrl(firefoxSourceUrl);
            if (sourceAdapter !== null) {
                log.debug("Found source " + args.source.path + " on tab " + threadAdapter.actorName);
                var setBreakpointsPromise = threadAdapter.setBreakpoints(breakpointInfos, sourceAdapter);
                if (_this.verifiedBreakpointSources.indexOf(firefoxSourceUrl) < 0) {
                    setBreakpointsPromise.then(function (breakpointAdapters) {
                        response.body = {
                            breakpoints: breakpointAdapters.map(function (breakpointAdapter) {
                                var breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine);
                                breakpoint.id = breakpointAdapter.breakpointInfo.id;
                                return breakpoint;
                            })
                        };
                        log.debug('Replying to setBreakpointsRequest with actual breakpoints from the first thread with this source');
                        _this.sendResponse(response);
                    }, function (err) {
                        log.error("Failed setBreakpointsRequest: " + err);
                        response.success = false;
                        response.message = String(err);
                        _this.sendResponse(response);
                    });
                    _this.verifiedBreakpointSources.push(firefoxSourceUrl);
                }
            }
        });
        if (this.verifiedBreakpointSources.indexOf(firefoxSourceUrl) < 0) {
            log.debug("Replying to setBreakpointsRequest (Source " + args.source.path + " not seen yet)");
            response.body = {
                breakpoints: breakpointInfos.map(function (breakpointInfo) {
                    var breakpoint = new vscode_debugadapter_1.Breakpoint(false, breakpointInfo.requestedLine);
                    breakpoint.id = breakpointInfo.id;
                    return breakpoint;
                })
            };
            this.sendResponse(response);
        }
    };
    FirefoxDebugSession.prototype.setExceptionBreakPointsRequest = function (response, args) {
        var _this = this;
        log.debug("Received setExceptionBreakPointsRequest with filters: " + JSON.stringify(args.filters));
        this.exceptionBreakpoints = index_1.ExceptionBreakpoints.None;
        if (args.filters.indexOf('all') >= 0) {
            this.exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        }
        else if (args.filters.indexOf('uncaught') >= 0) {
            this.exceptionBreakpoints = index_1.ExceptionBreakpoints.Uncaught;
        }
        this.threadsById.forEach(function (threadAdapter) {
            return threadAdapter.setExceptionBreakpoints(_this.exceptionBreakpoints);
        });
        this.sendResponse(response);
    };
    FirefoxDebugSession.prototype.pauseRequest = function (response, args) {
        var _this = this;
        log.debug('Received pauseRequest');
        var threadId = args.threadId ? args.threadId : 1;
        var threadAdapter = this.threadsById.get(threadId);
        threadAdapter.interrupt().then(function () {
            log.debug('Replying to pauseRequest');
            _this.sendResponse(response);
            var stoppedEvent = new vscode_debugadapter_1.StoppedEvent('interrupt', threadId);
            stoppedEvent.body.allThreadsStopped = false;
            _this.sendEvent(stoppedEvent);
        }, function (err) {
            log.error('Failed pauseRequest: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.continueRequest = function (response, args) {
        var _this = this;
        log.debug('Received continueRequest');
        var threadAdapter = this.threadsById.get(args.threadId);
        threadAdapter.resume().then(function () {
            log.debug('Replying to continueRequest');
            response.body = { allThreadsContinued: false };
            _this.sendResponse(response);
        }, function (err) {
            log.error('Failed continueRequest: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.nextRequest = function (response, args) {
        var _this = this;
        log.debug('Received nextRequest');
        var threadAdapter = this.threadsById.get(args.threadId);
        threadAdapter.stepOver().then(function () {
            log.debug('Replying to nextRequest');
            _this.sendResponse(response);
        }, function (err) {
            log.error('Failed nextRequest: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.stepInRequest = function (response, args) {
        var _this = this;
        log.debug('Received stepInRequest');
        var threadAdapter = this.threadsById.get(args.threadId);
        threadAdapter.stepIn().then(function () {
            log.debug('Replying to stepInRequest');
            _this.sendResponse(response);
        }, function (err) {
            log.error('Failed stepInRequest: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.stepOutRequest = function (response, args) {
        var _this = this;
        log.debug('Received stepOutRequest');
        var threadAdapter = this.threadsById.get(args.threadId);
        threadAdapter.stepOut().then(function () {
            log.debug('Replying to stepOutRequest');
            _this.sendResponse(response);
        }, function (err) {
            log.error('Failed stepOutRequest: ' + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.stackTraceRequest = function (response, args) {
        var _this = this;
        var threadAdapter = this.threadsById.get(args.threadId);
        log.debug("Received stackTraceRequest for " + threadAdapter.actorName);
        threadAdapter.fetchStackFrames(args.startFrame || 0, args.levels || 0).then(function (_a) {
            var frameAdapters = _a[0], totalFrameCount = _a[1];
            log.debug('Replying to stackTraceRequest');
            response.body = {
                stackFrames: frameAdapters.map(function (frameAdapter) { return frameAdapter.getStackframe(); }),
                totalFrames: totalFrameCount
            };
            _this.sendResponse(response);
        }, function (err) {
            log.error("Failed stackTraceRequest: " + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.scopesRequest = function (response, args) {
        log.debug('Received scopesRequest');
        var frameAdapter = this.framesById.get(args.frameId);
        if (frameAdapter === undefined) {
            var err = 'Failed scopesRequest: the requested frame can\'t be found';
            log.error(err);
            response.success = false;
            response.message = err;
            this.sendResponse(response);
            return;
        }
        log.debug('Replying to scopesRequest');
        response.body = { scopes: frameAdapter.scopeAdapters.map(function (scopeAdapter) { return scopeAdapter.getScope(); }) };
        this.sendResponse(response);
    };
    FirefoxDebugSession.prototype.variablesRequest = function (response, args) {
        var _this = this;
        log.debug('Received variablesRequest');
        var variablesProvider = this.variablesProvidersById.get(args.variablesReference);
        if (variablesProvider === undefined) {
            var err = 'Failed variablesRequest: the requested object reference can\'t be found';
            log.error(err);
            response.success = false;
            response.message = err;
            this.sendResponse(response);
            return;
        }
        variablesProvider.threadAdapter.fetchVariables(variablesProvider).then(function (variables) {
            log.debug('Replying to variablesRequest');
            response.body = { variables: variables };
            _this.sendResponse(response);
        }, function (err) {
            log.error("Failed variablesRequest: " + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.evaluateRequest = function (response, args) {
        var _this = this;
        log.debug('Received evaluateRequest');
        var threadAdapter;
        var frameActorName;
        if (args.frameId) {
            var frameAdapter = this.framesById.get(args.frameId);
            threadAdapter = frameAdapter.threadAdapter;
            frameActorName = frameAdapter.frame.actor;
        }
        else {
            threadAdapter = this.threadsById.get(1);
        }
        threadAdapter.evaluate(args.expression, frameActorName, (args.context !== 'watch')).then(function (variable) {
            log.debug('Replying to evaluateRequest');
            response.body = {
                result: variable.value,
                variablesReference: variable.variablesReference
            };
            _this.sendResponse(response);
        }, function (err) {
            log.error("Failed evaluateRequest for \"" + args.expression + "\": " + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.sourceRequest = function (response, args) {
        var _this = this;
        log.debug('Received sourceRequest');
        var sourceAdapter = this.sourcesById.get(args.sourceReference);
        sourceAdapter.actor.fetchSource().then(function (sourceGrip) {
            if (typeof sourceGrip === 'string') {
                response.body = { content: sourceGrip };
                _this.sendResponse(response);
            }
            else {
                var longStringGrip = sourceGrip;
                var longStringActor = _this.getOrCreateLongStringGripActorProxy(longStringGrip);
                longStringActor.fetchContent().then(function (content) {
                    log.debug('Replying to sourceRequest');
                    response.body = { content: content };
                    _this.sendResponse(response);
                }, function (err) {
                    log.error("Failed sourceRequest: " + err);
                    response.success = false;
                    response.message = String(err);
                    _this.sendResponse(response);
                });
            }
        }, function (err) {
            log.error("Failed sourceRequest: " + err);
            response.success = false;
            response.message = String(err);
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.disconnectRequest = function (response, args) {
        var _this = this;
        log.debug('Received disconnectRequest');
        var detachPromises = [];
        this.threadsById.forEach(function (threadAdapter) {
            detachPromises.push(threadAdapter.detach());
        });
        Promise.all(detachPromises).then(function () {
            log.debug('Replying to disconnectRequest');
            _this.disconnect();
            _this.sendResponse(response);
        }, function (err) {
            log.warn("Failed disconnectRequest: " + err);
            _this.disconnect();
            _this.sendResponse(response);
        });
    };
    FirefoxDebugSession.prototype.disconnect = function () {
        var _this = this;
        if (this.firefoxDebugConnection) {
            this.firefoxDebugConnection.disconnect().then(function () {
                if (_this.firefoxProc) {
                    _this.firefoxProc.kill('SIGTERM');
                    _this.firefoxProc = null;
                }
            });
        }
    };
    return FirefoxDebugSession;
}(vscode_debugadapter_1.DebugSession));
exports.FirefoxDebugSession = FirefoxDebugSession;
vscode_debugadapter_1.DebugSession.run(FirefoxDebugSession);
//# sourceMappingURL=firefoxDebugSession.js.map