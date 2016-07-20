/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var lifecycle_1 = require('./lifecycle');
var encoding_1 = require('../node/encoding');
function exec(child, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    var disposables = [];
    var once = function (ee, name, fn) {
        ee.once(name, fn);
        disposables.push(lifecycle_1.toDisposable(function () { return ee.removeListener(name, fn); }));
    };
    var on = function (ee, name, fn) {
        ee.on(name, fn);
        disposables.push(lifecycle_1.toDisposable(function () { return ee.removeListener(name, fn); }));
    };
    var exitCode = new Promise(function (resolve, reject) {
        once(child, 'error', reject);
        once(child, 'exit', resolve);
    });
    var stdout = new Promise(function (resolve, reject) {
        var buffers = [];
        on(child.stdout, 'data', function (b) { return buffers.push(b); });
        once(child.stdout, 'close', function () { return resolve(encoding_1.decode(Buffer.concat(buffers), encoding)); });
    });
    var stderr = new Promise(function (resolve, reject) {
        var buffers = [];
        on(child.stderr, 'data', function (b) { return buffers.push(b); });
        once(child.stderr, 'close', function () { return resolve(encoding_1.decode(Buffer.concat(buffers), encoding)); });
    });
    return Promise.all([exitCode, stdout, stderr]).then(function (values) {
        lifecycle_1.dispose(disposables);
        return {
            exitCode: values[0],
            stdout: values[1],
            stderr: values[2]
        };
    });
}
exports.exec = exec;
function stream(child, progress, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    var disposables = [];
    var once = function (ee, name, fn) {
        ee.once(name, fn);
        disposables.push(lifecycle_1.toDisposable(function () { return ee.removeListener(name, fn); }));
    };
    var on = function (ee, name, fn) {
        ee.on(name, fn);
        disposables.push(lifecycle_1.toDisposable(function () { return ee.removeListener(name, fn); }));
    };
    var exitCode = new Promise(function (resolve, reject) {
        once(child, 'error', reject);
        once(child, 'exit', resolve);
    });
    var stdout = new Promise(function (resolve, reject) {
        var buffers = [];
        on(child.stdout, 'data', function (b) {
            buffers.push(b);
            progress(encoding_1.decode(b, encoding));
        });
        once(child.stdout, 'close', function () { return resolve(encoding_1.decode(Buffer.concat(buffers), encoding)); });
    });
    var stderr = new Promise(function (resolve, reject) {
        var buffers = [];
        on(child.stderr, 'data', function (b) {
            buffers.push(b);
            progress(encoding_1.decode(b, encoding));
        });
        once(child.stderr, 'close', function () { return resolve(encoding_1.decode(Buffer.concat(buffers), encoding)); });
    });
    return Promise.all([exitCode, stdout, stderr]).then(function (values) {
        lifecycle_1.dispose(disposables);
        return {
            exitCode: values[0],
            stdout: values[1],
            stderr: values[2]
        };
    });
}
exports.stream = stream;
//# sourceMappingURL=execution.js.map