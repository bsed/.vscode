Array.range = function (from, to, step) {
    if (step === void 0) { step = 1; }
    var array = [];
    for (var i = from; i < to; i += step) {
        array.push(i);
    }
    return array;
};
Array.prototype.apply = function (fn) {
    return fn(this);
};
Array.prototype.flatMap =
    function (callback) {
        return this
            .reduce(function (acc, v, i, arr) { return acc.concat(callback(v, i, arr)); }, []);
    };
//# sourceMappingURL=extensions.js.map