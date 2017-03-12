/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
const vscode_languageserver_1 = require("vscode-languageserver");
/**
 * Defines the structure of the extension settings
 */
class Variables {
    /**
     * Initialize a new instance
     */
    constructor(app) {
        this.app = app;
    }
    /**
     * Checks if finder can match
     */
    matches(context) {
        return true;
    }
    /**
     * Finds a list of completion items
     */
    find(context) {
        var result = [];
        var item = vscode_languageserver_1.CompletionItem.create('$foo');
        item.kind = 1;
        result.push(item);
        return result;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
// exports
exports.default = Variables;
//# sourceMappingURL=Variables.js.map