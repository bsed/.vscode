"use strict";
function concatArrays(arrays) {
    return [].concat.apply([], arrays);
}
exports.concatArrays = concatArrays;
function urlBasename(url) {
    let lastSepIndex = url.lastIndexOf('/');
    if (lastSepIndex < 0) {
        return url;
    }
    else {
        return url.substring(lastSepIndex + 1);
    }
}
exports.urlBasename = urlBasename;
function delay(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}
exports.delay = delay;
function exceptionGripToString(grip) {
    if ((typeof grip === 'object') && (grip !== null) && (grip.type === 'object')) {
        let preview = grip.preview;
        if (preview !== undefined) {
            if (preview.name === 'ReferenceError') {
                return 'not available';
            }
            let str = (preview.name !== undefined) ? (preview.name + ': ') : '';
            str += (preview.message !== undefined) ? preview.message : '';
            if (str !== '') {
                return str;
            }
        }
    }
    else if (typeof grip === 'string') {
        return grip;
    }
    return 'unknown error';
}
exports.exceptionGripToString = exceptionGripToString;
//# sourceMappingURL=misc.js.map