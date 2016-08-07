"use strict";
function createDeferred() {
    var resolve;
    var reject;
    var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return {
        resolve: resolve, reject: reject, promise: promise
    };
}
exports.createDeferred = createDeferred;
//# sourceMappingURL=helpers.js.map