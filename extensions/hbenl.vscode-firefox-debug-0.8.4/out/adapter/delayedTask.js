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
let log = log_1.Log.create('DelayedTask');
class DelayedTask {
    constructor(mainTask, postprocessTask) {
        this.mainTask = mainTask;
        this.postprocessTask = postprocessTask;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.state = 'waiting';
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state !== 'waiting') {
                log.error(`Tried to execute DelayedTask, but it is ${this.state}`);
                return;
            }
            let result;
            try {
                this.state = 'running';
                result = yield this.mainTask();
                this.resolve(result);
            }
            catch (err) {
                this.reject(err);
                throw err;
            }
            if (this.postprocessTask) {
                this.state = 'postprocessing';
                yield this.postprocessTask(result);
            }
            this.state = 'finished';
        });
    }
    cancel(reason) {
        if (this.state !== 'waiting') {
            log.error(`Tried to cancel DelayedTask, but it is ${this.state}`);
            return;
        }
        this.reject(reason);
        this.state = 'finished';
    }
}
exports.DelayedTask = DelayedTask;
//# sourceMappingURL=delayedTask.js.map