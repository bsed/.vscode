/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var path = require('path');
var child_process = require('child_process');
var util_1 = require('./util');
var ProxyErrorResponse = (function () {
    function ProxyErrorResponse(message) {
        this.message = message;
        this.request_seq = 1;
        this.seq = 1;
        this.type = "response";
        this.success = false;
        this.command = "initialize";
    }
    return ProxyErrorResponse;
}());
function serializeProtocolEvent(message) {
    var payload = JSON.stringify(message);
    var finalPayload = "Content-Length: " + payload.length + "\r\n\r\n" + payload;
    return finalPayload;
}
// The default extension manifest calls this proxy as the debugger program
// When installation of the debugger components finishes, the extension manifest is rewritten so that this proxy is no longer called
// If the debugger components have not finished downloading, the proxy displays an error message to the user
// If the debugger components have finished downloading, the manifest has been rewritten but has not been reloaded. 
// This proxy will still be called and launch OpenDebugAD7 as a child process.
// During subsequent code sessions, the rewritten manifest will be loaded and this proxy will no longer be called. 
function proxy() {
    var util = new util_1.CoreClrDebugUtil(path.resolve(__dirname, '../../'));
    if (!util_1.CoreClrDebugUtil.existsSync(util.installCompleteFilePath())) {
        if (util_1.CoreClrDebugUtil.existsSync(util.installBeginFilePath())) {
            process.stdout.write(serializeProtocolEvent(new ProxyErrorResponse('The .NET Core Debugger is still being downloaded. See the Status Bar for more information.')));
        }
        else {
            process.stdout.write(serializeProtocolEvent(new ProxyErrorResponse('Run \'Debug: Download .NET Core Debugger\' in the Command Palette or open a .NET project directory to download the .NET Core Debugger')));
        }
    }
    else {
        new Promise(function (resolve, reject) {
            var processPath = path.join(util.debugAdapterDir(), "OpenDebugAD7" + util_1.CoreClrDebugUtil.getPlatformExeExtension());
            var args = process.argv.slice(2);
            // do not explicitly set a current working dir
            // this seems to match what code does when OpenDebugAD7 is launched directly from the manifest
            var child = child_process.spawn(processPath, args);
            // If we don't exit cleanly from the child process, log the error.
            child.on('close', function (code) {
                if (code !== 0) {
                    reject(new Error(code.toString()));
                }
                else {
                    resolve();
                }
            });
            process.stdin.setEncoding('utf8');
            child.on('error', function (data) {
                util.logToFile("Child error: " + data);
            });
            process.on('SIGTERM', function () {
                child.kill();
                process.exit(0);
            });
            process.on('SIGHUP', function () {
                child.kill();
                process.exit(0);
            });
            process.stdin.on('error', function (error) {
                util.logToFile("process.stdin error: " + error);
            });
            process.stdout.on('error', function (error) {
                util.logToFile("process.stdout error: " + error);
            });
            child.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            process.stdin.on('data', function (data) {
                child.stdin.write(data);
            });
            process.stdin.resume();
        }).catch(function (err) {
            util.logToFile("Promise failed: " + err);
        });
    }
}
proxy();
//# sourceMappingURL=proxy.js.map