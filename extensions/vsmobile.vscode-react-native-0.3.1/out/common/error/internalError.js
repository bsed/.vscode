// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
(function (InternalErrorLevel) {
    InternalErrorLevel[InternalErrorLevel["Error"] = 0] = "Error";
    InternalErrorLevel[InternalErrorLevel["Warning"] = 1] = "Warning";
})(exports.InternalErrorLevel || (exports.InternalErrorLevel = {}));
var InternalErrorLevel = exports.InternalErrorLevel;
class InternalError extends Error {
    constructor(errorCode, message, errorLevel = InternalErrorLevel.Error) {
        super(message);
        this.errorCode = errorCode;
        this.errorLevel = errorLevel;
        this.message = message;
    }
    get isInternalError() {
        return true;
    }
}
exports.InternalError = InternalError;
class NestedError extends InternalError {
    constructor(errorCode, message, innerError = null, extras, errorLevel = InternalErrorLevel.Error) {
        super(errorCode, message, errorLevel);
        this.innerError = innerError;
        this.name = innerError ? innerError.name : null;
        const innerMessage = innerError ? innerError.message : null;
        this.message = innerMessage ? `${message}: ${innerMessage}` : message;
        this._extras = extras;
    }
    get extras() {
        return this._extras;
    }
    static getWrappedError(error, innerError) {
        return new NestedError(innerError.errorCode || error.errorCode, error.message, innerError);
    }
}
exports.NestedError = NestedError;

//# sourceMappingURL=internalError.js.map
