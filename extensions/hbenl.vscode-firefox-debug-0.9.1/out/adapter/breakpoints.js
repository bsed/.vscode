"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const index_1 = require("../adapter/index");
let log = log_1.Log.create('BreakpointsAdapter');
class BreakpointsAdapter {
    static setBreakpointsOnSourceActor(breakpointsToSet, sourceAdapter, threadCoordinator) {
        if (sourceAdapter.hasCurrentBreakpoints()) {
            let currentBreakpoints = sourceAdapter.getCurrentBreakpoints();
            if (this.breakpointsAreEqual(breakpointsToSet, currentBreakpoints)) {
                return Promise.resolve(currentBreakpoints);
            }
        }
        return threadCoordinator.runOnPausedThread(() => this.setBreakpointsOnPausedSourceActor(breakpointsToSet, sourceAdapter), undefined);
    }
    static setBreakpointsOnPausedSourceActor(origBreakpointsToSet, sourceAdapter) {
        let breakpointsToSet = origBreakpointsToSet.slice();
        log.debug(`Setting ${breakpointsToSet.length} breakpoints for ${sourceAdapter.actor.url}`);
        let result = new Promise((resolve, reject) => {
            sourceAdapter.getBreakpointsPromise().then((oldBreakpoints) => {
                log.debug(`${oldBreakpoints.length} breakpoints were previously set for ${sourceAdapter.actor.url}`);
                let newBreakpoints = [];
                let breakpointsBeingRemoved = [];
                let breakpointsBeingSet = [];
                oldBreakpoints.forEach((breakpointAdapter) => {
                    let breakpointIndex = -1;
                    for (let i = 0; i < breakpointsToSet.length; i++) {
                        let breakpointToSet = breakpointsToSet[i];
                        if (breakpointToSet &&
                            (breakpointToSet.requestedLine === breakpointAdapter.breakpointInfo.requestedLine)) {
                            breakpointIndex = i;
                            break;
                        }
                    }
                    if (breakpointIndex >= 0) {
                        newBreakpoints[breakpointIndex] = breakpointAdapter;
                        breakpointsToSet[breakpointIndex] = undefined;
                    }
                    else {
                        breakpointsBeingRemoved.push(breakpointAdapter.actor.delete().catch((err) => {
                            log.error(`Failed removing breakpoint: ${err}`);
                        }));
                    }
                });
                breakpointsToSet.map((requestedBreakpoint, index) => {
                    if (requestedBreakpoint !== undefined) {
                        breakpointsBeingSet.push(sourceAdapter.actor.setBreakpoint({ line: requestedBreakpoint.requestedLine }, requestedBreakpoint.condition).then((setBreakpointResult) => {
                            requestedBreakpoint.actualLine =
                                (setBreakpointResult.actualLocation === undefined) ?
                                    requestedBreakpoint.requestedLine :
                                    setBreakpointResult.actualLocation.line;
                            newBreakpoints[index] = new index_1.BreakpointAdapter(requestedBreakpoint, setBreakpointResult.breakpointActor);
                        }, (err) => {
                            log.error(`Failed setting breakpoint: ${err}`);
                        }));
                    }
                });
                log.debug(`Adding ${breakpointsBeingSet.length} and removing ${breakpointsBeingRemoved.length} breakpoints`);
                Promise.all(breakpointsBeingRemoved).then(() => Promise.all(breakpointsBeingSet)).then(() => {
                    resolve(newBreakpoints);
                });
            });
        });
        sourceAdapter.setBreakpointsPromise(result);
        return result;
    }
    static breakpointsAreEqual(breakpointsToSet, currentBreakpoints) {
        let breakpointsToSetLines = new Set(breakpointsToSet.map((breakpointInfo) => breakpointInfo.requestedLine));
        let currentBreakpointsLines = new Set(currentBreakpoints.map((breakpointAdapter) => breakpointAdapter.breakpointInfo.requestedLine));
        if (breakpointsToSetLines.size !== currentBreakpointsLines.size) {
            return false;
        }
        for (let line of breakpointsToSetLines.keys()) {
            if (!currentBreakpointsLines.has(line)) {
                return false;
            }
        }
        return true;
    }
}
exports.BreakpointsAdapter = BreakpointsAdapter;
class BreakpointInfo {
}
exports.BreakpointInfo = BreakpointInfo;
//# sourceMappingURL=breakpoints.js.map