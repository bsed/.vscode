'use strict';
const cp = require('child_process');
const os = require('os');
const path = require('path');
function send_error_msg(slideout, message) {
    // Send this info as a console event
    let event = JSON.stringify({
        type: 'event', seq: 0, event: 'output', body: { category: 'console', output: message }
    });
    process.stdout.write('\r\nContent-Length: ' + event.length.toString() + '\r\n\r\n');
    process.stdout.write(event);
    // Also, fake out a response to 'initialize' message, which will be shown on a slide-out.
    let response = JSON.stringify({
        type: 'response', command: 'initialize', request_seq: 1, success: false, body: { error: { id: 0, format: slideout, showUser: true } }
    });
    process.stdout.write('Content-Length: ' + response.length.toString() + '\r\n\r\n');
    process.stdout.write(response);
}
let extInfoPath = path.join(os.tmpdir(), 'vscode-lldb-session').replace(/\\/g, '\\\\');
let launchScript = 'script import adapter; adapter.run_stdio_session(3,4,extinfo=\'' + extInfoPath + '\')';
let lldb = cp.spawn('lldb', ['-b', '-O', launchScript], {
    stdio: ['ignore', 'pipe', 'ignore', 'pipe', 'pipe'],
    cwd: __dirname + '/..'
});
// In case there are problems with launching...
lldb.on('error', (err) => {
    send_error_msg('Failed to launch LLDB: ' + err.message, err.message);
    process.exit(1);
});
// Monitor LLDB output for traceback spew and send it to debug console.
// This is about the only way to catch early Python errors (like the missing six.py module). >:-(
lldb.stdout.setEncoding('utf8');
lldb.stdout.on('data', (data) => {
    if (data.indexOf('Traceback') >= 0) {
        send_error_msg('Failed to launch LLDB: check debug console for error messages.', data);
    }
});
// When lldb exits, we exit too
lldb.on('exit', (code) => {
    process.exit(code);
});
process.stdin.pipe(lldb.stdio[3]);
lldb.stdio[4].pipe(process.stdout);
//# sourceMappingURL=adapter.js.map