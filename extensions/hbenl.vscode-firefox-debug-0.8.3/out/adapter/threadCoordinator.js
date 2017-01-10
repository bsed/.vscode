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
const events_1 = require("events");
const delayedTask_1 = require("./delayedTask");
let log = log_1.Log.create('ThreadCoordinator');
class ThreadCoordinator extends events_1.EventEmitter {
    constructor(threadActor, consoleActor, shouldSkip, prepareResume) {
        super();
        this.threadActor = threadActor;
        this.consoleActor = consoleActor;
        this.prepareResume = prepareResume;
        this.threadState = 'paused';
        this.threadTarget = 'paused';
        this.queuedTasksToRunOnPausedThread = [];
        this.tasksRunningOnPausedThread = 0;
        this.queuedEvaluateTasks = [];
        this.evaluateTaskIsRunning = false;
        threadActor.onPaused((reason, frame) => {
            if (this.threadState === 'evaluating') {
                threadActor.resume(this.exceptionBreakpoints);
            }
            else if (shouldSkip(frame.where.source)) {
                threadActor.resume(this.exceptionBreakpoints, this.getResumeLimit());
            }
            else {
                this.threadState = 'paused';
                this.threadTarget = 'paused';
                this.interruptPromise = undefined;
                this.emit('paused', reason);
            }
        });
        threadActor.onResumed(() => {
            this.threadState = 'running';
            this.threadTarget = 'running';
            this.interruptPromise = undefined;
            if (this.tasksRunningOnPausedThread > 0) {
                log.warn('Thread resumed unexpectedly while tasks that need the thread to be paused were running');
            }
        });
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        this.exceptionBreakpoints = exceptionBreakpoints;
        if ((this.threadState === 'resuming') || (this.threadState === 'running')) {
            this.runOnPausedThread(() => __awaiter(this, void 0, void 0, function* () { return undefined; }), undefined);
        }
    }
    interrupt() {
        if (this.threadState === 'paused') {
            return Promise.resolve();
        }
        else if (this.interruptPromise !== undefined) {
            return this.interruptPromise;
        }
        else {
            this.threadTarget = 'paused';
            this.doNext();
            return this.interruptPromise;
        }
    }
    resume() {
        this.resumeTo('running');
    }
    stepOver() {
        this.resumeTo('stepOver');
    }
    stepIn() {
        this.resumeTo('stepIn');
    }
    stepOut() {
        this.resumeTo('stepOut');
    }
    resumeTo(target) {
        if (this.threadState === 'running') {
            if (target != 'running') {
                log.warn(`Can't ${target} because the thread is already running`);
            }
        }
        else {
            this.threadTarget = target;
        }
        this.doNext();
    }
    runOnPausedThread(mainTask, postprocessingTask) {
        let delayedTask = new delayedTask_1.DelayedTask(mainTask, postprocessingTask);
        this.queuedTasksToRunOnPausedThread.push(delayedTask);
        this.doNext();
        return delayedTask.promise;
    }
    evaluate(expr, frameActorName, convert, postprocess) {
        let evaluateTask = () => __awaiter(this, void 0, void 0, function* () {
            let grip = yield this.threadActor.evaluate(expr, frameActorName);
            return convert(grip);
        });
        let delayedTask = new delayedTask_1.DelayedTask(evaluateTask, postprocess);
        this.queuedEvaluateTasks.push(delayedTask);
        this.doNext();
        return delayedTask.promise;
    }
    consoleEvaluate(expr, frameActorName, convert, postprocess) {
        if (this.consoleActor === undefined) {
            throw new Error('This thread has no consoleActor');
        }
        let evaluateTask = () => __awaiter(this, void 0, void 0, function* () {
            let grip = yield this.consoleActor.evaluate(expr);
            return convert(grip);
        });
        let delayedTask = new delayedTask_1.DelayedTask(evaluateTask, postprocess);
        this.queuedEvaluateTasks.push(delayedTask);
        this.doNext();
        return delayedTask.promise;
    }
    onPaused(cb) {
        this.on('paused', cb);
    }
    doNext() {
        log.debug(`state: ${this.threadState}, target: ${this.threadTarget}, tasks: ${this.tasksRunningOnPausedThread}/${this.queuedTasksToRunOnPausedThread.length}, eval: ${this.queuedEvaluateTasks.length}`);
        if ((this.threadState === 'interrupting') ||
            (this.threadState === 'resuming') ||
            (this.threadState === 'evaluating')) {
            return;
        }
        if (this.threadState === 'running') {
            if ((this.queuedTasksToRunOnPausedThread.length > 0) || (this.queuedEvaluateTasks.length > 0)) {
                this.executeInterrupt(true);
                return;
            }
            if (this.threadTarget === 'paused') {
                this.executeInterrupt(false);
                return;
            }
        }
        else {
            if (this.queuedTasksToRunOnPausedThread.length > 0) {
                for (let task of this.queuedTasksToRunOnPausedThread) {
                    this.executeOnPausedThread(task);
                }
                this.queuedTasksToRunOnPausedThread = [];
                return;
            }
            if (this.tasksRunningOnPausedThread > 0) {
                return;
            }
            if (this.queuedEvaluateTasks.length > 0) {
                let task = this.queuedEvaluateTasks.shift();
                this.executeEvaluateTask(task);
                return;
            }
        }
        if ((this.threadState === 'paused') && (this.threadTarget !== 'paused')) {
            this.executeResume();
            return;
        }
    }
    executeInterrupt(immediate) {
        return __awaiter(this, void 0, void 0, function* () {
            this.threadState = 'interrupting';
            this.interruptPromise = this.threadActor.interrupt(immediate);
            try {
                yield this.interruptPromise;
                this.threadState = 'paused';
            }
            catch (e) {
                log.error(`interrupt failed: ${e}`);
                this.threadState = 'running';
            }
            this.interruptPromise = undefined;
            this.doNext();
        });
    }
    executeResume() {
        return __awaiter(this, void 0, void 0, function* () {
            let resumeLimit = this.getResumeLimit();
            this.threadState = 'resuming';
            try {
                yield this.prepareResume();
                yield this.threadActor.resume(this.exceptionBreakpoints, resumeLimit);
                this.threadState = 'running';
            }
            catch (e) {
                log.error(`resumeTask failed: ${e}`);
                this.threadState = 'paused';
            }
            this.doNext();
        });
    }
    executeOnPausedThread(task) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.threadState !== 'paused') {
                log.error(`executeOnPausedThread called but threadState is ${this.threadState}`);
                return;
            }
            this.tasksRunningOnPausedThread++;
            try {
                yield task.execute();
            }
            catch (e) {
                log.warn(`task running on paused thread failed: ${e}`);
            }
            this.tasksRunningOnPausedThread--;
            if (this.tasksRunningOnPausedThread === 0) {
                this.doNext();
            }
        });
    }
    executeEvaluateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.threadState !== 'paused') {
                log.error(`executeEvaluateTask called but threadState is ${this.threadState}`);
                return;
            }
            if (this.tasksRunningOnPausedThread > 0) {
                log.error(`executeEvaluateTask called but tasksRunningOnPausedThread is ${this.tasksRunningOnPausedThread}`);
                return;
            }
            this.threadState = 'evaluating';
            try {
                yield task.execute();
            }
            catch (e) {
            }
            this.threadState = 'paused';
            this.doNext();
        });
    }
    getResumeLimit() {
        switch (this.threadTarget) {
            case 'stepOver':
                return 'next';
            case 'stepIn':
                return 'step';
            case 'stepOut':
                return 'finish';
            default:
                return undefined;
        }
    }
}
exports.ThreadCoordinator = ThreadCoordinator;
//# sourceMappingURL=threadCoordinator.js.map