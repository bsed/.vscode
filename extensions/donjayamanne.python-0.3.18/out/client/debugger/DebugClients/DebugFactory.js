"use strict";
var LocalDebugClient_1 = require("./LocalDebugClient");
var RemoteDebugClient_1 = require("./RemoteDebugClient");
function CreateLaunchDebugClient(launchRequestOptions, debugSession) {
    return new LocalDebugClient_1.LocalDebugClient(launchRequestOptions, debugSession);
}
exports.CreateLaunchDebugClient = CreateLaunchDebugClient;
function CreateAttachDebugClient(attachRequestOptions, debugSession) {
    return new RemoteDebugClient_1.RemoteDebugClient(attachRequestOptions, debugSession);
}
exports.CreateAttachDebugClient = CreateAttachDebugClient;
//# sourceMappingURL=DebugFactory.js.map