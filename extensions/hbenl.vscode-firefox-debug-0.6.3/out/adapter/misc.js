"use strict";
var SourceAdapter = (function () {
    function SourceAdapter(id, actor) {
        this.id = id;
        this.actor = actor;
        this.currentBreakpoints = Promise.resolve([]);
    }
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