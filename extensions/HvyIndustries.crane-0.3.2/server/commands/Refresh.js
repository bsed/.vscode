/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
const vscode_languageserver_1 = require("vscode-languageserver");
/**
 * Defines a callback registration
 */
function cmdRefresh(app, connection) {
    connection.onRequest(new vscode_languageserver_1.RequestType("doRefresh"), (data) => {
        app.workspace.scan()
            .catch(function (e) {
            app.message.error(e.message);
            if (app.settings.debugMode) {
                app.message.trace(e.stack);
            }
            return new Error();
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = cmdRefresh;
;
//# sourceMappingURL=Refresh.js.map