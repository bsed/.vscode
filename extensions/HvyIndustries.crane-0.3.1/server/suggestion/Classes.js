/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
/**
 * Defines the structure of the extension settings
 */
class Classes {
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
        return (context.word === 'extends' || context.word === 'new');
    }
    /**
     * Finds a list of completion items
     */
    find(context) {
        var nodes = this.app.workspace.getByName('class', context.text);
        if (context.inNamespace()) {
        }
        return null;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
// exports
exports.default = Classes;
//# sourceMappingURL=Classes.js.map