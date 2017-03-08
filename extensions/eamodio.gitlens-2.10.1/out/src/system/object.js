'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const _isEqual = require('lodash.isequal');
var Objects;
(function (Objects) {
    function areEquivalent(first, second) {
        return _isEqual(first, second);
    }
    Objects.areEquivalent = areEquivalent;
    function* entries(o) {
        for (let key in o) {
            yield [key, o[key]];
        }
    }
    Objects.entries = entries;
})(Objects = exports.Objects || (exports.Objects = {}));
//# sourceMappingURL=object.js.map