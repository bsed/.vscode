"use strict";
(function (DebugType) {
    DebugType[DebugType["Local"] = 0] = "Local";
    DebugType[DebugType["Remote"] = 1] = "Remote";
})(exports.DebugType || (exports.DebugType = {}));
var DebugType = exports.DebugType;
var DebugClient = (function () {
    function DebugClient(args, debugSession) {
        this.debugSession = debugSession;
    }
    Object.defineProperty(DebugClient.prototype, "DebugType", {
        get: function () {
            return DebugType.Local;
        },
        enumerable: true,
        configurable: true
    });
    DebugClient.prototype.Stop = function () {
    };
    DebugClient.prototype.LaunchApplicationToDebug = function (dbgServer) {
        return Promise.resolve();
    };
    return DebugClient;
}());
exports.DebugClient = DebugClient;
//# sourceMappingURL=DebugClient.js.map