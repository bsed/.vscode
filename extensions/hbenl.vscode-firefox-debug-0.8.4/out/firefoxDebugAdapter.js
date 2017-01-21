"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const os = require("os");
const path = require("path");
const log_1 = require("./util/log");
const addon_1 = require("./util/addon");
const launcher_1 = require("./util/launcher");
const minimatch_1 = require("minimatch");
const debugAdapterBase_1 = require("./debugAdapterBase");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const index_1 = require("./firefox/index");
const index_2 = require("./adapter/index");
let log = log_1.Log.create('FirefoxDebugAdapter');
let pathConversionLog = log_1.Log.create('PathConversion');
let consoleActorLog = log_1.Log.create('ConsoleActor');
class FirefoxDebugAdapter extends debugAdapterBase_1.DebugAdapterBase {
    constructor(debuggerLinesStartAt1, isServer = false) {
        super(debuggerLinesStartAt1, isServer);
        this.pathMappings = [];
        this.filesToSkip = [];
        this.nextThreadId = 1;
        this.threadsById = new Map();
        this.lastActiveConsoleThreadId = 0;
        this.nextBreakpointId = 1;
        this.breakpointsBySourcePath = new Map();
        this.verifiedBreakpointSources = [];
        this.nextFrameId = 1;
        this.framesById = new Map();
        this.nextVariablesProviderId = 1;
        this.variablesProvidersById = new Map();
        this.nextSourceId = 1;
        this.sourcesById = new Map();
        this.exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        this.urlDetector = /^[a-zA-Z][a-zA-Z0-9\+\-\.]*\:\/\//;
        this.isWindowsPlatform = (os.platform() === 'win32');
        if (!isServer) {
            log_1.Log.consoleLog = (msg) => {
                this.sendEvent(new vscode_debugadapter_1.OutputEvent(msg + '\n'));
            };
        }
    }
    initialize(args) {
        return {
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
    }
    launch(args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.readCommonConfiguration(args);
            this.firefoxProc = yield launcher_1.launchFirefox(args);
            let socket = yield launcher_1.waitForSocket(args);
            this.startSession(socket);
        });
    }
    attach(args) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.readCommonConfiguration(args);
            let socket = yield launcher_1.connect(args.port || 6000, args.host || 'localhost');
            this.startSession(socket);
        });
    }
    setBreakpoints(args) {
        let breakpoints = args.breakpoints || [];
        log.debug(`Setting ${breakpoints.length} breakpoints for ${args.source.path}`);
        let sourcePath = args.source.path;
        let breakpointInfos = breakpoints.map((breakpoint) => ({
            id: this.nextBreakpointId++,
            requestedLine: breakpoint.line,
            condition: breakpoint.condition
        }));
        this.breakpointsBySourcePath.set(sourcePath, breakpointInfos);
        this.verifiedBreakpointSources = this.verifiedBreakpointSources.filter((verifiedSourcePath) => (verifiedSourcePath !== sourcePath));
        return new Promise((resolve, reject) => {
            this.threadsById.forEach((threadAdapter) => {
                let sourceAdapters = threadAdapter.findSourceAdaptersForPath(sourcePath);
                sourceAdapters.forEach((sourceAdapter) => {
                    log.debug(`Found source ${args.source.path} on tab ${threadAdapter.actorName}`);
                    let setBreakpointsPromise = threadAdapter.setBreakpoints(breakpointInfos, sourceAdapter);
                    if (this.verifiedBreakpointSources.indexOf(sourcePath) < 0) {
                        setBreakpointsPromise.then((breakpointAdapters) => {
                            log.debug('Replying to setBreakpointsRequest with actual breakpoints from the first thread with this source');
                            resolve({
                                breakpoints: breakpointAdapters.map((breakpointAdapter) => {
                                    let breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine);
                                    breakpoint.id = breakpointAdapter.breakpointInfo.id;
                                    return breakpoint;
                                })
                            });
                        });
                        this.verifiedBreakpointSources.push(sourcePath);
                    }
                });
            });
            if (this.verifiedBreakpointSources.indexOf(sourcePath) < 0) {
                log.debug(`Replying to setBreakpointsRequest (Source ${args.source.path} not seen yet)`);
                resolve({
                    breakpoints: breakpointInfos.map((breakpointInfo) => {
                        let breakpoint = new vscode_debugadapter_1.Breakpoint(false, breakpointInfo.requestedLine);
                        breakpoint.id = breakpointInfo.id;
                        return breakpoint;
                    })
                });
            }
        });
    }
    setExceptionBreakpoints(args) {
        log.debug(`Setting exception filters: ${JSON.stringify(args.filters)}`);
        this.exceptionBreakpoints = index_1.ExceptionBreakpoints.None;
        if (args.filters.indexOf('all') >= 0) {
            this.exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        }
        else if (args.filters.indexOf('uncaught') >= 0) {
            this.exceptionBreakpoints = index_1.ExceptionBreakpoints.Uncaught;
        }
        this.threadsById.forEach((threadAdapter) => threadAdapter.setExceptionBreakpoints(this.exceptionBreakpoints));
    }
    pause(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            yield threadAdapter.interrupt();
            let stoppedEvent = new vscode_debugadapter_1.StoppedEvent('interrupt', threadAdapter.id);
            stoppedEvent.body.allThreadsStopped = false;
            this.sendEvent(stoppedEvent);
        });
    }
    next(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            yield threadAdapter.stepOver();
        });
    }
    stepIn(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            yield threadAdapter.stepIn();
        });
    }
    stepOut(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            yield threadAdapter.stepOut();
        });
    }
    continue(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            yield threadAdapter.resume();
            return { allThreadsContinued: false };
        });
    }
    getSource(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let sourceAdapter = this.sourcesById.get(args.sourceReference);
            if (!sourceAdapter) {
                throw new Error('Failed sourceRequest: the requested source reference can\'t be found');
            }
            let sourceGrip = yield sourceAdapter.actor.fetchSource();
            if (typeof sourceGrip === 'string') {
                return { content: sourceGrip };
            }
            else {
                let longStringGrip = sourceGrip;
                let longStringActor = this.getOrCreateLongStringGripActorProxy(longStringGrip);
                let content = yield longStringActor.fetchContent();
                return { content };
            }
        });
    }
    getThreads() {
        log.debug(`${this.threadsById.size} threads`);
        let threads = [];
        this.threadsById.forEach((threadAdapter) => {
            threads.push(new vscode_debugadapter_1.Thread(threadAdapter.id, threadAdapter.name));
        });
        return { threads };
    }
    getStackTrace(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.setActiveThread(threadAdapter);
            let [frameAdapters, totalFrames] = yield threadAdapter.fetchStackFrames(args.startFrame || 0, args.levels || 0);
            let stackFrames = frameAdapters.map((frameAdapter) => frameAdapter.getStackframe());
            return { stackFrames, totalFrames };
        });
    }
    getScopes(args) {
        let frameAdapter = this.framesById.get(args.frameId);
        if (!frameAdapter) {
            throw new Error('Failed scopesRequest: the requested frame can\'t be found');
        }
        this.setActiveThread(frameAdapter.threadAdapter);
        let scopes = frameAdapter.scopeAdapters.map((scopeAdapter) => scopeAdapter.getScope());
        return { scopes };
    }
    getVariables(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let variablesProvider = this.variablesProvidersById.get(args.variablesReference);
            if (!variablesProvider) {
                throw new Error('Failed variablesRequest: the requested object reference can\'t be found');
            }
            this.setActiveThread(variablesProvider.threadAdapter);
            let variables = yield variablesProvider.threadAdapter.fetchVariables(variablesProvider);
            return { variables };
        });
    }
    evaluate(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let variable = undefined;
            if (args.context === 'watch') {
                if (args.frameId !== undefined) {
                    let frameAdapter = this.framesById.get(args.frameId);
                    if (frameAdapter !== undefined) {
                        this.setActiveThread(frameAdapter.threadAdapter);
                        let threadAdapter = frameAdapter.threadAdapter;
                        let frameActorName = frameAdapter.frame.actor;
                        variable = yield threadAdapter.evaluate(args.expression, frameActorName);
                    }
                    else {
                        log.warn(`Couldn\'t find specified frame for evaluating ${args.expression}`);
                        throw 'not available';
                    }
                }
                else {
                    let threadAdapter = this.findConsoleThread();
                    if (threadAdapter !== undefined) {
                        variable = yield threadAdapter.evaluate(args.expression);
                    }
                    else {
                        log.info(`Couldn't find a console for evaluating watch ${args.expression}`);
                        throw 'not available';
                    }
                }
            }
            else {
                let threadAdapter = this.findConsoleThread();
                if (threadAdapter !== undefined) {
                    let frameActorName = undefined;
                    if (args.frameId !== undefined) {
                        let frameAdapter = this.framesById.get(args.frameId);
                        if (frameAdapter !== undefined) {
                            frameActorName = frameAdapter.frame.actor;
                        }
                    }
                    variable = yield threadAdapter.consoleEvaluate(args.expression, frameActorName);
                }
                else {
                    log.info(`Couldn't find a console for evaluating ${args.expression}`);
                    throw 'not available';
                }
            }
            return {
                result: variable.value,
                variablesReference: variable.variablesReference
            };
        });
    }
    disconnect(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let detachPromises = [];
            if (!this.firefoxDebugSocketClosed) {
                this.threadsById.forEach((threadAdapter) => {
                    detachPromises.push(threadAdapter.detach());
                });
            }
            yield Promise.all(detachPromises);
            this.disconnectFirefox();
        });
    }
    registerVariablesProvider(variablesProvider) {
        let providerId = this.nextVariablesProviderId++;
        variablesProvider.variablesProviderId = providerId;
        this.variablesProvidersById.set(providerId, variablesProvider);
    }
    unregisterVariablesProvider(variablesProvider) {
        this.variablesProvidersById.delete(variablesProvider.variablesProviderId);
    }
    registerFrameAdapter(frameAdapter) {
        let frameId = this.nextFrameId++;
        frameAdapter.id = frameId;
        this.framesById.set(frameAdapter.id, frameAdapter);
    }
    unregisterFrameAdapter(frameAdapter) {
        this.framesById.delete(frameAdapter.id);
    }
    getOrCreateObjectGripActorProxy(objectGrip) {
        return this.firefoxDebugConnection.getOrCreate(objectGrip.actor, () => new index_1.ObjectGripActorProxy(objectGrip, this.firefoxDebugConnection));
    }
    getOrCreateLongStringGripActorProxy(longStringGrip) {
        return this.firefoxDebugConnection.getOrCreate(longStringGrip.actor, () => new index_1.LongStringGripActorProxy(longStringGrip, this.firefoxDebugConnection));
    }
    getThreadAdapter(threadId) {
        let threadAdapter = this.threadsById.get(threadId);
        if (!threadAdapter) {
            throw new Error(`Unknown threadId ${threadId}`);
        }
        return threadAdapter;
    }
    convertFirefoxSourceToPath(source) {
        if (!source)
            return undefined;
        if (source.addonID && (source.addonID === this.addonId)) {
            let sourcePath = this.removeQueryString(path.join(this.addonPath, source.addonPath));
            pathConversionLog.debug(`Addon script path: ${sourcePath}`);
            return sourcePath;
        }
        else if (source.isSourceMapped && source.generatedUrl && source.url && !this.urlDetector.test(source.url)) {
            let generatedPath = this.convertFirefoxUrlToPath(source.generatedUrl);
            if (!generatedPath)
                return undefined;
            let relativePath = source.url;
            let sourcePath = this.removeQueryString(path.join(path.dirname(generatedPath), relativePath));
            pathConversionLog.debug(`Sourcemapped path: ${sourcePath}`);
            return sourcePath;
        }
        else if (source.url) {
            return this.convertFirefoxUrlToPath(source.url);
        }
        else {
            return undefined;
        }
    }
    convertFirefoxUrlToPath(url) {
        for (var i = 0; i < this.pathMappings.length; i++) {
            let [from, to] = this.pathMappings[i];
            if (typeof from === 'string') {
                if (url.substr(0, from.length) === from) {
                    let path = this.removeQueryString(to + url.substr(from.length));
                    if (this.isWindowsPlatform) {
                        path = path.replace(/\//g, '\\');
                    }
                    pathConversionLog.debug(`Converted url ${url} to path ${path}`);
                    return path;
                }
            }
            else {
                let match = from.exec(url);
                if (match) {
                    let path = this.removeQueryString(to + match[1]);
                    if (this.isWindowsPlatform) {
                        path = path.replace(/\//g, '\\');
                    }
                    pathConversionLog.debug(`Converted url ${url} to path ${path}`);
                    return path;
                }
            }
        }
        if ((url.substr(0, 11) === 'resource://') || (url.substr(0, 9) === 'chrome://') ||
            (url === 'XStringBundle') || (url.substr(0, 4) === 'jar:')) {
            pathConversionLog.info(`Can't convert url ${url} to path`);
        }
        else {
            pathConversionLog.warn(`Can't convert url ${url} to path`);
        }
        return undefined;
    }
    removeQueryString(path) {
        let queryStringIndex = path.indexOf('?');
        if (queryStringIndex >= 0) {
            return path.substr(0, queryStringIndex);
        }
        else {
            return path;
        }
    }
    readCommonConfiguration(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.log) {
                log_1.Log.config = args.log;
            }
            if (args.pathMappings) {
                args.pathMappings.forEach((pathMapping) => {
                    this.pathMappings.push([pathMapping.url, pathMapping.path]);
                });
            }
            if (args.addonType) {
                if (!args.addonPath) {
                    throw `If you set "addonType" you also have to set "addonPath" in the ${args.request} configuration`;
                }
                this.addonType = args.addonType;
                let success;
                let addonIdOrErrorMsg;
                this.addonId = yield addon_1.findAddonId(args.addonPath);
                this.addonPath = args.addonPath;
                if (this.addonType === 'addonSdk') {
                    let rewrittenAddonId = this.addonId.replace("@", "-at-");
                    let sanitizedAddonPath = this.addonPath;
                    if (sanitizedAddonPath[sanitizedAddonPath.length - 1] === '/') {
                        sanitizedAddonPath = sanitizedAddonPath.substr(0, sanitizedAddonPath.length - 1);
                    }
                    this.pathMappings.push(['resource://' + rewrittenAddonId, sanitizedAddonPath]);
                }
                else if (this.addonType === 'webExtension') {
                    let rewrittenAddonId = this.addonId.replace('{', '%7B').replace('}', '%7D');
                    let sanitizedAddonPath = this.addonPath;
                    if (sanitizedAddonPath[sanitizedAddonPath.length - 1] === '/') {
                        sanitizedAddonPath = sanitizedAddonPath.substr(0, sanitizedAddonPath.length - 1);
                    }
                    this.pathMappings.push([new RegExp('^moz-extension://[0-9a-f-]*(/.*)$'), sanitizedAddonPath]);
                    this.pathMappings.push([new RegExp(`^jar:file:.*/extensions/${rewrittenAddonId}.xpi!(/.*)$`), sanitizedAddonPath]);
                }
            }
            else if (args.addonPath) {
                throw `If you set "addonPath" you also have to set "addonType" in the ${args.request} configuration`;
            }
            else if (args.url) {
                if (!args.webRoot) {
                    throw `If you set "url" you also have to set "webRoot" in the ${args.request} configuration`;
                }
                else if (!path.isAbsolute(args.webRoot)) {
                    throw `The "webRoot" property in the ${args.request} configuration has to be an absolute path`;
                }
                let webRootUrl = args.url;
                if (webRootUrl.indexOf('/') >= 0) {
                    webRootUrl = webRootUrl.substr(0, webRootUrl.lastIndexOf('/'));
                }
                let webRoot = path.normalize(args.webRoot);
                if (this.isWindowsPlatform) {
                    webRoot = webRoot.replace(/\\/g, '/');
                }
                if (webRoot[webRoot.length - 1] === '/') {
                    webRoot = webRoot.substr(0, webRoot.length - 1);
                }
                this.pathMappings.forEach((pathMapping) => {
                    const to = pathMapping[1];
                    if ((typeof to === 'string') && (to.substr(0, 10) === '${webRoot}')) {
                        pathMapping[1] = webRoot + to.substr(10);
                    }
                });
                this.pathMappings.push([webRootUrl, webRoot]);
            }
            else if (args.webRoot) {
                throw `If you set "webRoot" you also have to set "url" in the ${args.request} configuration`;
            }
            this.pathMappings.push([(this.isWindowsPlatform ? 'file:///' : 'file://'), '']);
            pathConversionLog.info('Path mappings:');
            this.pathMappings.forEach(([from, to]) => pathConversionLog.info(`'${from}' => '${to}'`));
            if (args.skipFiles) {
                args.skipFiles.forEach((glob) => {
                    let minimatch = new minimatch_1.Minimatch(glob);
                    let regExp = minimatch.makeRe();
                    if (regExp) {
                        this.filesToSkip.push(regExp);
                    }
                    else {
                        log.warn(`Invalid glob pattern "${glob}" specified in "skipFiles"`);
                    }
                });
            }
            return undefined;
        });
    }
    startSession(socket) {
        this.firefoxDebugConnection = new index_1.DebugConnection(socket);
        this.firefoxDebugSocketClosed = false;
        let rootActor = this.firefoxDebugConnection.rootActor;
        let nextTabId = 1;
        if (this.addonId) {
            rootActor.onInit(() => __awaiter(this, void 0, void 0, function* () {
                let addons = yield rootActor.fetchAddons();
                addons.forEach((addon) => {
                    if (addon.id === this.addonId) {
                        this.attachTab(new index_1.TabActorProxy(addon.actor, addon.name, '', this.firefoxDebugConnection), new index_1.ConsoleActorProxy(addon.consoleActor, this.firefoxDebugConnection), nextTabId++, false, 'Addon');
                    }
                });
                if (this.addonType === 'legacy') {
                    rootActor.fetchProcess().then(([tabActor, consoleActor]) => {
                        this.attachTab(tabActor, consoleActor, nextTabId++, true, 'Browser');
                    });
                }
            }));
        }
        rootActor.onTabOpened(([tabActor, consoleActor]) => {
            log.info(`Tab opened with url ${tabActor.url}`);
            let tabId = nextTabId++;
            this.attachTab(tabActor, consoleActor, tabId);
            this.attachConsole(consoleActor);
        });
        rootActor.onTabListChanged(() => {
            rootActor.fetchTabs();
        });
        rootActor.onInit(() => {
            rootActor.fetchTabs();
        });
        socket.on('close', () => {
            log.info('Connection to Firefox closed - terminating debug session');
            this.firefoxDebugSocketClosed = true;
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    attachTab(tabActor, consoleActor, tabId, hasWorkers = true, threadName) {
        return __awaiter(this, void 0, void 0, function* () {
            let threadActor;
            try {
                threadActor = yield tabActor.attach();
            }
            catch (err) {
                log.error(`Failed attaching to tab: ${err}`);
                return;
            }
            log.debug(`Attached to tab ${tabActor.name}`);
            let threadId = this.nextThreadId++;
            if (!threadName) {
                threadName = `Tab ${tabId}`;
            }
            let threadAdapter = new index_2.ThreadAdapter(threadId, threadActor, consoleActor, threadName, this);
            this.attachThread(threadAdapter, threadActor.name);
            if (hasWorkers) {
                let nextWorkerId = 1;
                tabActor.onWorkerStarted((workerActor) => __awaiter(this, void 0, void 0, function* () {
                    log.info(`Worker started with url ${tabActor.url}`);
                    let workerId = nextWorkerId++;
                    try {
                        yield this.attachWorker(workerActor, tabId, workerId);
                    }
                    catch (err) {
                        log.error(`Failed attaching to worker: ${err}`);
                    }
                }));
                tabActor.onWorkerListChanged(() => tabActor.fetchWorkers());
                tabActor.fetchWorkers();
            }
            try {
                yield threadAdapter.init(this.exceptionBreakpoints);
                this.threadsById.set(threadId, threadAdapter);
                this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', threadId));
                tabActor.onDetached(() => {
                    this.threadsById.delete(threadId);
                    this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadId));
                });
            }
            catch (err) {
                if (this.nextThreadId == (threadId + 1)) {
                    this.nextThreadId--;
                }
                log.info(`Failed attaching to tab: ${err}`);
            }
        });
    }
    attachWorker(workerActor, tabId, workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = yield workerActor.attach();
            let threadActor = yield workerActor.connect();
            log.debug(`Attached to worker ${workerActor.name}`);
            let threadId = this.nextThreadId++;
            let threadAdapter = new index_2.ThreadAdapter(threadId, threadActor, undefined, `Worker ${tabId}/${workerId}`, this);
            this.attachThread(threadAdapter, threadActor.name);
            yield threadAdapter.init(this.exceptionBreakpoints);
            this.threadsById.set(threadId, threadAdapter);
            this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', threadId));
            workerActor.onClose(() => {
                this.threadsById.delete(threadId);
                this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadId));
            });
        });
    }
    attachThread(threadAdapter, actorName) {
        threadAdapter.onNewSource((sourceActor) => {
            this.attachSource(sourceActor, threadAdapter);
        });
        threadAdapter.onPaused((reason) => {
            log.info(`Thread ${actorName} paused , reason: ${reason.type}`);
            let stoppedEvent = new vscode_debugadapter_1.StoppedEvent(reason.type, threadAdapter.id);
            stoppedEvent.body.allThreadsStopped = false;
            this.sendEvent(stoppedEvent);
        });
        threadAdapter.onResumed(() => {
            log.info(`Thread ${actorName} resumed unexpectedly`);
            this.sendEvent(new vscode_debugadapter_1.ContinuedEvent(threadAdapter.id));
        });
        threadAdapter.onExited(() => {
            log.info(`Thread ${actorName} exited`);
            this.threadsById.delete(threadAdapter.id);
            this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadAdapter.id));
        });
    }
    attachSource(sourceActor, threadAdapter) {
        const source = sourceActor.source;
        const sourcePath = this.convertFirefoxSourceToPath(source);
        let sourceAdapter = threadAdapter.findCorrespondingSourceAdapter(source);
        if (sourceAdapter !== undefined) {
            sourceAdapter.actor = sourceActor;
        }
        else {
            let sourceId = this.nextSourceId++;
            sourceAdapter = threadAdapter.createSourceAdapter(sourceId, sourceActor, sourcePath);
            this.sourcesById.set(sourceId, sourceAdapter);
        }
        let pathToCheck = undefined;
        if (sourcePath !== undefined) {
            pathToCheck = sourcePath;
            if (this.isWindowsPlatform) {
                pathToCheck = pathToCheck.split('\\').join('/');
            }
        }
        else if (source.generatedUrl && (!source.url || !this.urlDetector.test(source.url))) {
            pathToCheck = source.generatedUrl;
        }
        else {
            pathToCheck = source.url;
        }
        if (pathToCheck) {
            let skipThisSource = false;
            for (let regExp of this.filesToSkip) {
                if (regExp.test(pathToCheck)) {
                    skipThisSource = true;
                    break;
                }
            }
            if (source.isBlackBoxed !== skipThisSource) {
                sourceActor.setBlackbox(skipThisSource);
                source.isBlackBoxed = skipThisSource;
            }
        }
        if (sourcePath && this.breakpointsBySourcePath.has(sourcePath)) {
            let breakpointInfos = this.breakpointsBySourcePath.get(sourcePath) || [];
            if (sourceAdapter !== undefined) {
                let setBreakpointsPromise = threadAdapter.setBreakpoints(breakpointInfos, sourceAdapter);
                if (this.verifiedBreakpointSources.indexOf(sourcePath) < 0) {
                    setBreakpointsPromise.then((breakpointAdapters) => {
                        log.debug('Updating breakpoints');
                        breakpointAdapters.forEach((breakpointAdapter) => {
                            let breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine);
                            breakpoint.id = breakpointAdapter.breakpointInfo.id;
                            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('update', breakpoint));
                        });
                        this.verifiedBreakpointSources.push(sourcePath);
                    });
                }
            }
            ;
        }
    }
    attachConsole(consoleActor) {
        consoleActor.onConsoleAPICall((msg) => {
            consoleActorLog.debug(`Console API: ${JSON.stringify(msg)}`);
            let category = (msg.level === 'error') ? 'stderr' :
                (msg.level === 'warn') ? 'console' : 'stdout';
            let displayMsg = msg.arguments.join(',') + '\n';
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(displayMsg, category));
        });
        consoleActor.onPageErrorCall((err) => {
            consoleActorLog.debug(`Page Error: ${JSON.stringify(err)}`);
            if (err.category === 'content javascript') {
                let category = err.exception ? 'stderr' : 'stdout';
                this.sendEvent(new vscode_debugadapter_1.OutputEvent(err.errorMessage + '\n', category));
            }
        });
        consoleActor.startListeners();
    }
    setActiveThread(threadAdapter) {
        if (threadAdapter.hasConsole) {
            this.lastActiveConsoleThreadId = threadAdapter.id;
        }
    }
    findConsoleThread() {
        let threadAdapter = this.threadsById.get(this.lastActiveConsoleThreadId);
        if (threadAdapter !== undefined) {
            return threadAdapter;
        }
        for (let i = 1; i < this.nextThreadId; i++) {
            if (this.threadsById.has(i)) {
                threadAdapter = this.threadsById.get(i);
                if (threadAdapter.hasConsole) {
                    this.setActiveThread(threadAdapter);
                    return threadAdapter;
                }
            }
        }
        return undefined;
    }
    disconnectFirefox() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.firefoxDebugConnection) {
                yield this.firefoxDebugConnection.disconnect();
                if (this.firefoxProc) {
                    this.firefoxProc.kill('SIGTERM');
                    this.firefoxProc = undefined;
                }
            }
        });
    }
}
exports.FirefoxDebugAdapter = FirefoxDebugAdapter;
vscode_debugadapter_1.DebugSession.run(FirefoxDebugAdapter);
//# sourceMappingURL=firefoxDebugAdapter.js.map