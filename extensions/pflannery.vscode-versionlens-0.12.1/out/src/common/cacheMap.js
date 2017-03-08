"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var CacheMap = (function () {
    function CacheMap(cacheDuration) {
        this.cacheDuration = cacheDuration || 300000; // defaults to 5mins in ms
        this.data = {};
    }
    CacheMap.prototype.expired = function (key) {
        var entry = this.data[key];
        return !entry || Date.now() > entry.expiryTime;
    };
    CacheMap.prototype.get = function (key) {
        var entry = this.data[key];
        return entry && entry.data;
    };
    CacheMap.prototype.set = function (key, data) {
        var newEntry = {
            expiryTime: Date.now() + this.cacheDuration,
            data: data
        };
        this.data[key] = newEntry;
        return newEntry.data;
    };
    return CacheMap;
}());
exports.CacheMap = CacheMap;
//# sourceMappingURL=cacheMap.js.map