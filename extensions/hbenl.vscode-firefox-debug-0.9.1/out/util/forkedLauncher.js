"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
let args = process.argv;
args.shift();
args.shift();
let exe = args.shift();
let childProc = child_process_1.spawn(exe, args, { detached: true, stdio: 'ignore' });
childProc.unref();
//# sourceMappingURL=forkedLauncher.js.map