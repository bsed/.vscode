"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var typeAssertion_1 = require('./typeAssertion');
var resolveMap = {};
/**
 * resolves dependencies from the resolve map
 */
function resolve(dependencyKey) {
    var instance = resolveMap[dependencyKey];
    typeAssertion_1.assertDefined(instance, "Resolve: Could not resolve dependency {" + dependencyKey + "}");
    return instance;
}
exports.resolve = resolve;
/**
 * registers dependencies to the resolve map
 */
function register(dependencyKey, instance) {
    return resolveMap[dependencyKey] = instance;
}
exports.register = register;
/**
 * clears the resolution map
 */
function clear() {
    resolveMap = {};
}
exports.clear = clear;
/**
 * injects dependencies found in the resolve map
 */
function inject() {
    var resolvableKeys = [];
    for (var index = 0; index < arguments.length; index++) {
        resolvableKeys.push(arguments[index]);
    }
    return function (target, key, desc) {
        var prototype = target.prototype;
        if (!prototype.__resolve)
            prototype.__resolve = resolve;
        var _loop_1 = function(index_1) {
            var resolveKey = resolvableKeys[index_1];
            Object.defineProperty(prototype, resolveKey, {
                get: function () {
                    return this.__resolve(resolveKey);
                }
            });
        };
        for (var index_1 = 0; index_1 < resolvableKeys.length; index_1++) {
            _loop_1(index_1);
        }
    };
}
exports.inject = inject;
//# sourceMappingURL=di.js.map