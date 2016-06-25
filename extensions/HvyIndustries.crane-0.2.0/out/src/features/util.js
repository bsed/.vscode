"use strict";
// Takes a PHP function signature like:
//     (foo, thisClass bar, otherClass baz)
// and returns an array of parameter strings:
//     ["foo", "thisClass bar", "otherClass baz"]
// Takes care of balancing parens so to not get confused by signatures like:
//     (pattern string, handler func(ResponseWriter, &Request)) {
function parameters(signature) {
    var ret = [];
    var parenCount = 0;
    var lastStart = 1;
    for (var i = 1; i < signature.length; i++) {
        switch (signature[i]) {
            case '(':
                parenCount++;
                break;
            case ')':
                parenCount--;
                if (parenCount < 0) {
                    if (i > lastStart) {
                        ret.push(signature.substring(lastStart, i));
                    }
                    return ret;
                }
                break;
            case ',':
                if (parenCount === 0) {
                    ret.push(signature.substring(lastStart, i));
                    lastStart = i + 2;
                }
                break;
        }
    }
    return null;
}
exports.parameters = parameters;
//# sourceMappingURL=util.js.map