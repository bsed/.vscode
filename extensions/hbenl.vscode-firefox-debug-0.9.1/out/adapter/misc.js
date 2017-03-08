"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SourceAdapter {
    constructor(id, actor, sourcePath) {
        this.id = id;
        this.actor = actor;
        this.sourcePath = sourcePath;
        this.breakpointsPromise = Promise.resolve([]);
        this.currentBreakpoints = [];
    }
    getBreakpointsPromise() {
        return this.breakpointsPromise;
    }
    hasCurrentBreakpoints() {
        return this.currentBreakpoints !== undefined;
    }
    getCurrentBreakpoints() {
        return this.currentBreakpoints;
    }
    setBreakpointsPromise(promise) {
        this.breakpointsPromise = promise;
        this.currentBreakpoints = undefined;
        this.breakpointsPromise.then((breakpoints) => this.currentBreakpoints = breakpoints);
    }
}
exports.SourceAdapter = SourceAdapter;
class BreakpointAdapter {
    constructor(requestedBreakpoint, actor) {
        this.breakpointInfo = requestedBreakpoint;
        this.actor = actor;
    }
}
exports.BreakpointAdapter = BreakpointAdapter;
//# sourceMappingURL=misc.js.map