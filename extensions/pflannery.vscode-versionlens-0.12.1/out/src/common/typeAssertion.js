"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function assertInstanceOf(param, expectedParamType, msgOnFail) {
    if (param instanceof expectedParamType === false)
        throw new ReferenceError(msgOnFail);
}
exports.assertInstanceOf = assertInstanceOf;
function assertTypeOf(param, expectedParamType, msgOnFail) {
    if (typeof param !== expectedParamType)
        throw new ReferenceError(msgOnFail);
}
exports.assertTypeOf = assertTypeOf;
function assertDefined(param, msgOnFail) {
    if (param === undefined || param === null)
        throw new ReferenceError(msgOnFail);
}
exports.assertDefined = assertDefined;
function assertEmpty(param, msgOnFail) {
    if (param.length === 0)
        throw new ReferenceError(msgOnFail);
}
exports.assertEmpty = assertEmpty;
//# sourceMappingURL=typeAssertion.js.map