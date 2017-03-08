"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../util/log");
const events_1 = require("events");
const misc_1 = require("../util/misc");
const index_1 = require("./index");
let log = log_1.Log.create('ThreadAdapter');
class ThreadAdapter extends events_1.EventEmitter {
    constructor(id, threadActor, consoleActor, pauseCoordinator, name, debugAdapter) {
        super();
        this.pauseCoordinator = pauseCoordinator;
        this.sources = [];
        this.frames = [];
        this.scopes = [];
        this.objectGripAdaptersByActorName = new Map();
        this.pauseLifetimeObjects = [];
        this.id = id;
        this.actor = threadActor;
        this.consoleActor = consoleActor;
        this._name = name;
        this._debugAdapter = debugAdapter;
        this.coordinator = new index_1.ThreadCoordinator(this.id, this.name, this.actor, this.consoleActor, this.pauseCoordinator, () => this.disposePauseLifetimeAdapters());
        this.coordinator.onPaused((reason) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.threadPausedReason = reason;
            yield this.fetchAllStackFrames();
            if (this.shouldSkip(this.frames[0].frame.where.source)) {
                this.resume();
            }
            else {
                this.emit('paused', reason);
            }
        }));
    }
    get debugSession() {
        return this._debugAdapter;
    }
    get name() {
        return this._name;
    }
    get actorName() {
        return this.actor.name;
    }
    get hasConsole() {
        return this.consoleActor !== undefined;
    }
    init(exceptionBreakpoints, reload) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
            yield this.pauseCoordinator.requestInterrupt(this.id, this.name, 'auto');
            try {
                yield this.actor.attach();
                this.pauseCoordinator.notifyInterrupted(this.id, this.name, 'auto');
            }
            catch (e) {
                this.pauseCoordinator.notifyInterruptFailed(this.id, this.name);
                throw e;
            }
            yield this.actor.fetchSources();
            yield this.coordinator.resume();
            if (reload) {
                yield this.consoleEvaluate('location.reload(true)');
            }
        });
    }
    createSourceAdapter(id, actor, path) {
        let adapter = new index_1.SourceAdapter(id, actor, path);
        this.sources.push(adapter);
        return adapter;
    }
    getOrCreateObjectGripAdapter(objectGrip, threadLifetime) {
        let objectGripAdapter = this.objectGripAdaptersByActorName.get(objectGrip.actor);
        if (objectGripAdapter === undefined) {
            objectGripAdapter = new index_1.ObjectGripAdapter(objectGrip, threadLifetime, this);
            this.objectGripAdaptersByActorName.set(objectGrip.actor, objectGripAdapter);
            if (!threadLifetime) {
                this.pauseLifetimeObjects.push(objectGripAdapter);
            }
        }
        return objectGripAdapter;
    }
    registerScopeAdapter(scopeAdapter) {
        this.scopes.push(scopeAdapter);
    }
    findCorrespondingSourceAdapter(source) {
        if (!source.url)
            return undefined;
        for (let sourceAdapter of this.sources) {
            if (sourceAdapter.actor.source.url === source.url) {
                return sourceAdapter;
            }
        }
        return undefined;
    }
    findSourceAdaptersForPath(path) {
        if (!path)
            return [];
        return this.sources.filter((sourceAdapter) => (sourceAdapter.sourcePath === path));
    }
    findSourceAdapterForActorName(actorName) {
        for (let i = 0; i < this.sources.length; i++) {
            if (this.sources[i].actor.name === actorName) {
                return this.sources[i];
            }
        }
        return undefined;
    }
    interrupt() {
        return this.coordinator.interrupt();
    }
    resume() {
        return this.coordinator.resume();
    }
    stepOver() {
        return this.coordinator.stepOver();
    }
    stepIn() {
        return this.coordinator.stepIn();
    }
    stepOut() {
        return this.coordinator.stepOut();
    }
    setBreakpoints(breakpointInfos, sourceAdapter) {
        return index_1.BreakpointsAdapter.setBreakpointsOnSourceActor(breakpointInfos, sourceAdapter, this.coordinator);
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
    }
    fetchAllStackFrames() {
        return this.coordinator.runOnPausedThread(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let frames = yield this.actor.fetchStackFrames();
            let frameAdapters = frames.map((frame) => {
                let frameAdapter = new index_1.FrameAdapter(frame, this);
                this._debugAdapter.registerFrameAdapter(frameAdapter);
                this.frames.push(frameAdapter);
                return frameAdapter;
            });
            if ((this.threadPausedReason !== undefined) && (frameAdapters.length > 0)) {
                frameAdapters[0].scopeAdapters[0].addCompletionValue(this.threadPausedReason);
            }
            return frameAdapters;
        }), (frameAdapters) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let objectGripAdapters = misc_1.concatArrays(frameAdapters.map((frameAdapter) => frameAdapter.getObjectGripAdapters()));
            let extendLifetimePromises = objectGripAdapters.map((objectGripAdapter) => objectGripAdapter.actor.extendLifetime().catch((err) => undefined));
            yield Promise.all(extendLifetimePromises);
        }));
    }
    fetchStackFrames(start, count) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let frameAdapters = (this.frames.length > 0) ? this.frames : yield this.fetchAllStackFrames();
            let requestedFrames = (count > 0) ? frameAdapters.slice(start, start + count) : frameAdapters.slice(start);
            return [requestedFrames, frameAdapters.length];
        });
    }
    fetchVariables(variablesProvider) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variableAdapters = yield this.coordinator.runOnPausedThread(() => variablesProvider.getVariables(), (variableAdapters) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let objectGripAdapters = variableAdapters
                    .map((variableAdapter) => variableAdapter.objectGripAdapter)
                    .filter((objectGripAdapter) => (objectGripAdapter !== undefined));
                if (!variablesProvider.isThreadLifetime) {
                    let extendLifetimePromises = objectGripAdapters.map((objectGripAdapter) => objectGripAdapter.actor.extendLifetime().catch((err) => undefined));
                    yield Promise.all(extendLifetimePromises);
                }
            }));
            return variableAdapters.map((variableAdapter) => variableAdapter.getVariable());
        });
    }
    evaluate(expr, frameActorName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variableAdapter;
            if (frameActorName !== undefined) {
                variableAdapter = yield this.coordinator.evaluate(expr, frameActorName, (grip) => this.variableFromGrip(grip, false), (variableAdapter) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let objectGripAdapter = variableAdapter.objectGripAdapter;
                    if (objectGripAdapter !== undefined) {
                        yield objectGripAdapter.actor.extendLifetime();
                    }
                }));
            }
            else {
                variableAdapter = yield this.coordinator.consoleEvaluate(expr, undefined, (grip) => this.variableFromGrip(grip, true));
            }
            return variableAdapter.getVariable();
        });
    }
    consoleEvaluate(expr, frameActorName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let grip = yield this.consoleActor.evaluate(expr, frameActorName);
            let variableAdapter = this.variableFromGrip(grip, true);
            return variableAdapter.getVariable();
        });
    }
    detach() {
        return this.actor.detach();
    }
    variableFromGrip(grip, threadLifetime) {
        if (grip !== undefined) {
            return index_1.VariableAdapter.fromGrip('', grip, threadLifetime, this);
        }
        else {
            return new index_1.VariableAdapter('', 'undefined');
        }
    }
    shouldSkip(source) {
        let sourceAdapter = this.findSourceAdapterForActorName(source.actor);
        if (sourceAdapter !== undefined) {
            return sourceAdapter.actor.source.isBlackBoxed;
        }
        else {
            log.warn(`No adapter found for sourceActor ${source.actor}`);
            return false;
        }
    }
    disposePauseLifetimeAdapters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let objectGripActorsToRelease = this.pauseLifetimeObjects.map((objectGripAdapter) => objectGripAdapter.actor.name);
            this.pauseLifetimeObjects.forEach((objectGripAdapter) => {
                objectGripAdapter.dispose();
                this.objectGripAdaptersByActorName.delete(objectGripAdapter.actor.name);
            });
            this.pauseLifetimeObjects = [];
            this.scopes.forEach((scopeAdapter) => {
                scopeAdapter.dispose();
            });
            this.scopes = [];
            this.frames.forEach((frameAdapter) => {
                frameAdapter.dispose();
            });
            this.frames = [];
            if (objectGripActorsToRelease.length > 0) {
                try {
                    yield this.actor.releaseMany(objectGripActorsToRelease);
                }
                catch (err) { }
            }
        });
    }
    onPaused(cb) {
        this.on('paused', cb);
    }
    onResumed(cb) {
        this.actor.onResumed(cb);
    }
    onExited(cb) {
        this.actor.onExited(cb);
    }
    onWrongState(cb) {
        this.actor.onWrongState(cb);
    }
    onNewSource(cb) {
        this.actor.onNewSource(cb);
    }
}
exports.ThreadAdapter = ThreadAdapter;
//# sourceMappingURL=thread.js.map