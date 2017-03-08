/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
const Classes_1 = require("./Classes");
const Variables_1 = require("./Variables");
// ...etc...
/**
 * Creates a list of application suggestion resolvers
 */
function default_1(app) {
    const resolvers = [
        new Classes_1.default(app),
        new Variables_1.default(app),
    ];
    /**
     * Resolves a context
     */
    return function (context) {
        var result = [];
        for (let i = 0; i < resolvers.length; i++) {
            const item = resolvers[i];
            if (item.matches(context)) {
                const items = item.find(context);
                if (Array.isArray(items) && items.length > 0) {
                    result = result.concat(items);
                    if (result.length > app.settings.maxSuggestionSize) {
                        result = result.slice(0, app.settings.maxSuggestionSize);
                        if (app.settings.debugMode) {
                            app.message.warning("Reached the limit of " + app.settings.maxSuggestionSize + " suggested items");
                        }
                        break; // reached the end
                    }
                }
            }
        }
        ;
        return result;
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=index.js.map