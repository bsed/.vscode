'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const vscode_debugadapter_testsupport_1 = require('vscode-debugadapter-testsupport');
var dc;
const debuggee = 'out/tests/debuggee';
const debuggeeSource = path.normalize(path.join(process.cwd(), 'src', 'tests', 'debuggee.cpp'));
var port = null;
if (process.env.DEBUG_SERVER) {
    port = parseInt(process.env.DEBUG_SERVER);
    console.log('Debug server port:', port);
}
setup(() => {
    dc = new vscode_debugadapter_testsupport_1.DebugClient('node', './out/adapter.js', 'lldb');
    return dc.start(port);
});
teardown(() => dc.stop());
test('run program to the end', () => __awaiter(this, void 0, void 0, function* () {
    let terminatedAsync = dc.waitForEvent('terminated');
    yield launch({ program: debuggee });
    yield terminatedAsync;
}));
test('run program with modified environment', () => __awaiter(this, void 0, void 0, function* () {
    let waitExitedAsync = dc.waitForEvent('exited');
    yield launch({
        env: { 'FOO': 'bar' },
        program: debuggee,
        args: ['check_env', 'FOO', 'bar'],
    });
    let exitedEvent = yield waitExitedAsync;
    // debuggee shall return 1 if env[argv[2]] == argv[3]
    assert.equal(exitedEvent.body.exitCode, 1);
}));
test('stop on entry', () => __awaiter(this, void 0, void 0, function* () {
    let stopAsync = dc.waitForEvent('stopped');
    launch({ program: debuggee, stopOnEntry: true });
    let stopEvent = yield stopAsync;
    if (process.platform.startsWith('win'))
        assert.equal(stopEvent.body.reason, 'exception');
    else
        assert.equal(stopEvent.body.reason, 'signal');
}));
test('stop on a breakpoint', () => __awaiter(this, void 0, void 0, function* () {
    let bp_line = findMarker(debuggeeSource, '#BP1');
    let hitBreakpointAsync = hitBreakpoint(debuggeeSource, bp_line);
    yield launch({ program: debuggee });
    yield hitBreakpointAsync;
    let waitForExitAsync = dc.waitForEvent('exited');
    yield dc.continueRequest({ threadId: 0 });
    yield waitForExitAsync;
}));
test('page stack', () => __awaiter(this, void 0, void 0, function* () {
    let bp_line = findMarker(debuggeeSource, '#BP2');
    let hitBreakpointAsync = hitBreakpoint(debuggeeSource, bp_line);
    yield launch({ program: debuggee, args: ['deepstack'] });
    let stoppedEvent = yield hitBreakpointAsync;
    let response2 = yield dc.stackTraceRequest({ threadId: stoppedEvent.body.threadId, startFrame: 20, levels: 10 });
    assert.equal(response2.body.stackFrames.length, 10);
    let response3 = yield dc.scopesRequest({ frameId: response2.body.stackFrames[0].id });
    let response4 = yield dc.variablesRequest({ variablesReference: response3.body.scopes[0].variablesReference });
    assert.equal(response4.body.variables[0].name, 'levelsToGo');
    assert.equal(response4.body.variables[0].value, '20');
}));
test('set variable', () => __awaiter(this, void 0, void 0, function* () {
    let bp_line = findMarker(debuggeeSource, '#BP3');
    let hitBreakpointAsync = hitBreakpoint(debuggeeSource, bp_line);
    yield launch({ program: debuggee, args: ['vars'] });
    let stoppedEvent = yield hitBreakpointAsync;
    let vars = yield readVariables(stoppedEvent.body.threadId);
    assert.equal(vars['a'], '30');
    assert.equal(vars['b'], '40');
    yield dc.send('setVariable', { variablesReference: vars._containerRef, name: 'a', value: '100' });
    let vars2 = yield readVariables(stoppedEvent.body.threadId);
    assert.equal(vars2['a'], '100');
}));
suite('attach tests - these may fail if your system has a locked-down ptrace() syscall', () => {
    // Many Linux systems restrict tracing to parent processes only, which lldb in this case isn't.
    // To allow unrestricted tracing run `echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope`.
    var debuggeeProc;
    suiteSetup(() => {
        debuggeeProc = cp.spawn(debuggee, ['inf_loop'], {});
    });
    suiteTeardown(() => {
        debuggeeProc.kill();
    });
    test('attach by pid', () => __awaiter(this, void 0, void 0, function* () {
        let asyncWaitStopped = dc.waitForEvent('stopped');
        let attachResp = yield attach({ program: debuggee, pid: debuggeeProc.pid, stopOnEntry: true });
        assert(attachResp.success);
        yield asyncWaitStopped;
    }));
    test('attach by name - may fail if a copy of debuggee is already running', () => __awaiter(this, void 0, void 0, function* () {
        // To fix, try running `killall debuggee` (`taskkill /im debuggee.exe` on Windows)
        let asyncWaitStopped = dc.waitForEvent('stopped');
        let attachResp = yield attach({ program: debuggee, stopOnEntry: true });
        assert(attachResp.success);
        yield asyncWaitStopped;
        debuggeeProc.kill();
    }));
});
function findMarker(file, marker) {
    let data = fs.readFileSync(file, 'utf8');
    let lines = data.split('\n');
    for (var i = 0; i < lines.length; ++i) {
        let pos = lines[i].indexOf(marker);
        if (pos >= 0)
            return i + 1;
    }
    throw Error('Marker not found');
}
function launch(launchArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        let waitForInit = dc.waitForEvent('initialized');
        yield dc.initializeRequest();
        let attachResp = dc.launchRequest(launchArgs);
        yield waitForInit;
        dc.configurationDoneRequest();
        return attachResp;
    });
}
function attach(attachArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        let waitForInit = dc.waitForEvent('initialized');
        yield dc.initializeRequest();
        let attachResp = dc.attachRequest(attachArgs);
        yield waitForInit;
        dc.configurationDoneRequest();
        return attachResp;
    });
}
function hitBreakpoint(file, line) {
    return __awaiter(this, void 0, void 0, function* () {
        let waitStopAsync = dc.waitForEvent('stopped');
        yield dc.waitForEvent('initialized');
        let breakpointResp = yield dc.setBreakpointsRequest({
            source: { path: file },
            breakpoints: [{ line: line, column: 0 }],
        });
        let bp = breakpointResp.body.breakpoints[0];
        assert.ok(bp.verified);
        assert.equal(bp.line, line);
        let stopEvent = yield waitStopAsync;
        let stackResp = yield dc.stackTraceRequest({ threadId: stopEvent.body.threadId });
        let topFrame = stackResp.body.stackFrames[0];
        assert.equal(topFrame.line, line);
        return stopEvent;
    });
}
function readVariables(threadId) {
    return __awaiter(this, void 0, void 0, function* () {
        let response1 = yield dc.stackTraceRequest({ threadId: threadId, startFrame: 0, levels: 1 });
        let response2 = yield dc.scopesRequest({ frameId: response1.body.stackFrames[0].id });
        let response3 = yield dc.variablesRequest({ variablesReference: response2.body.scopes[0].variablesReference });
        let vars = {};
        for (var v of response3.body.variables) {
            vars[v.name] = v.value;
        }
        vars._containerRef = response2.body.scopes[0].variablesReference;
        return vars;
    });
}
//# sourceMappingURL=adapter.test.js.map