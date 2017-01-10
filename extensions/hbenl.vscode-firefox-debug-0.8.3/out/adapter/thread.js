"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const log_1 = require("../util/log");
const misc_1 = require("../util/misc");
const index_1 = require("./index");
let log = log_1.Log.create('ThreadAdapter');
class ThreadAdapter {
    constructor(id, threadActor, consoleActor, name, debugAdapter) {
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
        this.coordinator = new index_1.ThreadCoordinator(this.actor, this.consoleActor, (source) => this.shouldSkip(source), () => this.disposePauseLifetimeAdapters());
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
    init(exceptionBreakpoints) {
        return __awaiter(this, void 0, void 0, function* () {
            this.coordinator.onPaused((reason) => {
                this.completionValue = reason.frameFinished;
            });
            yield this.actor.attach();
            this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
            yield this.actor.fetchSources();
            this.coordinator.resume();
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
        this.coordinator.resume();
    }
    stepOver() {
        this.coordinator.stepOver();
    }
    stepIn() {
        this.coordinator.stepIn();
    }
    stepOut() {
        this.coordinator.stepOut();
    }
    setBreakpoints(breakpointInfos, sourceAdapter) {
        return index_1.BreakpointsAdapter.setBreakpointsOnSourceActor(breakpointInfos, sourceAdapter, this.coordinator);
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
    }
    fetchAllStackFrames() {
        return this.coordinator.runOnPausedThread(() => __awaiter(this, void 0, void 0, function* () {
            let frames = yield this.actor.fetchStackFrames();
            let frameAdapters = frames.map((frame) => {
                let frameAdapter = new index_1.FrameAdapter(frame, this);
                this._debugAdapter.registerFrameAdapter(frameAdapter);
                this.frames.push(frameAdapter);
                return frameAdapter;
            });
            if (frameAdapters.length > 0) {
                frameAdapters[0].scopeAdapters[0].addCompletionValue(this.completionValue);
            }
            return frameAdapters;
        }), (frameAdapters) => __awaiter(this, void 0, void 0, function* () {
            let objectGripAdapters = misc_1.concatArrays(frameAdapters.map((frameAdapter) => frameAdapter.getObjectGripAdapters()));
            let extendLifetimePromises = objectGripAdapters.map((objectGripAdapter) => objectGripAdapter.actor.extendLifetime().catch((err) => undefined));
            yield Promise.all(extendLifetimePromises);
        }));
    }
    fetchStackFrames(start, count) {
        return __awaiter(this, void 0, void 0, function* () {
            let frameAdapters = (this.frames.length > 0) ? this.frames : yield this.fetchAllStackFrames();
            let requestedFrames = (count > 0) ? frameAdapters.slice(start, start + count) : frameAdapters.slice(start);
            return [requestedFrames, frameAdapters.length];
        });
    }
    fetchVariables(variablesProvider) {
        return __awaiter(this, void 0, void 0, function* () {
            let variableAdapters = yield this.coordinator.runOnPausedThread(() => variablesProvider.getVariables(), (variableAdapters) => __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            let variableAdapter;
            if (frameActorName !== undefined) {
                variableAdapter = yield this.coordinator.evaluate(expr, frameActorName, (grip) => this.variableFromGrip(grip, false), (variableAdapter) => __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
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
        this.coordinator.onPaused(cb);
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