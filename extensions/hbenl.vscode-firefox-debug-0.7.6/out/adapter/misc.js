"use strict";
var SourceAdapter = (function () {
    function SourceAdapter(id, actor, sourcePath) {
        this.id = id;
        this.actor = actor;
        this.sourcePath = sourcePath;
        this.breakpointsPromise = Promise.resolve([]);
        this.currentBreakpoints = [];
    }
    SourceAdapter.prototype.getBreakpointsPromise = function () {
        return this.breakpointsPromise;
    };
    SourceAdapter.prototype.hasCurrentBreakpoints = function () {
        return this.currentBreakpoints !== undefined;
    };
    SourceAdapter.prototype.getCurrentBreakpoints = function () {
        return this.currentBreakpoints;
    };
    SourceAdapter.prototype.setBreakpointsPromise = function (promise) {
        var _this = this;
        this.breakpointsPromise = promise;
        this.currentBreakpoints = undefined;
        this.breakpointsPromise.then(function (breakpoints) { return _this.currentBreakpoints = breakpoints; });
    };
    return SourceAdapter;
}());
exports.SourceAdapter = SourceAdapter;
var BreakpointAdapter = (function () {
    function BreakpointAdapter(requestedBreakpoint, actor) {
        this.breakpointInfo = requestedBreakpoint;
        this.actor = actor;
    }
    return BreakpointAdapter;
}());
exports.BreakpointAdapter = BreakpointAdapter;
//# sourceMappingURL=misc.js.map