"use strict";
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 0] = "none";
    LogLevel[LogLevel["error"] = 1] = "error";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["info"] = 3] = "info";
    LogLevel[LogLevel["log"] = 4] = "log";
})(exports.LogLevel || (exports.LogLevel = {}));
var LogLevel = exports.LogLevel;
(function (CheckTrigger) {
    CheckTrigger[CheckTrigger["onSave"] = 0] = "onSave";
    CheckTrigger[CheckTrigger["onChange"] = 1] = "onChange";
    CheckTrigger[CheckTrigger["off"] = 2] = "off";
})(exports.CheckTrigger || (exports.CheckTrigger = {}));
var CheckTrigger = exports.CheckTrigger;
//# sourceMappingURL=interfaces.js.map