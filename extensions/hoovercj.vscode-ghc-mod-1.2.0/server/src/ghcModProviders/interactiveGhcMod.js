"use strict";
const cp = require('child_process');
const os_1 = require('os');
const async_1 = require('../utils/async');
let promiseQueue = require('promise-queue');
class InteractiveGhcModProcess {
    constructor() {
        this.EOT = os_1.EOL + '\x04' + os_1.EOL;
        this.queue = new promiseQueue(1);
    }
    static create(options, logger) {
        let defaultOptions = {
            executable: 'ghc-mod',
            rootPath: ''
        };
        options = options || defaultOptions;
        // Make sure executable path can be executed.
        try {
            cp.execSync(`${options.executable} --version`);
        }
        catch (error) {
            logger.error(`Couldn't start ${options.executable} process ${error}`);
            return null;
        }
        let ret = new InteractiveGhcModProcess();
        ret.options = options;
        ret.logger = logger;
        // Start process, otherwise hover takes a while to work
        ret.spawnProcess();
        return ret;
    }
    runGhcModCommand(options) {
        return this.queue.add(() => {
            return new Promise((resolve, reject) => {
                resolve(this.runGhcModCommand_(options));
            });
        });
    }
    runGhcModCommand_(options) {
        let process = this.spawnProcess();
        if (!process) {
            this.logger.error('Process could not be spawned');
            return Promise.resolve([]);
        }
        let promise = Promise.resolve();
        return promise.then(() => {
            return this.mapFile(process, options);
        }).then(() => {
            return this.interact(process, this.commandAndArgsAsString(options));
        }).then((res) => {
            return this.unmapFile(process, options).then(() => {
                return res;
            });
        }, (err) => {
            this.logger.error(`Error running ${options.command} command - ${err}`);
        });
    }
    killProcess() {
        if (this.childProcess) {
            if (this.childProcess.stdin) {
                this.childProcess.stdin.end();
            }
            this.childProcess.kill();
            this.childProcess = null;
        }
    }
    waitForAnswer(process, command) {
        return new Promise((resolve, reject) => {
            let savedLines = [], timer = null;
            let cleanup = () => {
                process.stdout.removeListener('data', parseData);
                process.removeListener('exit', exitCallback);
                clearTimeout(timer);
            };
            let parseData = (data) => {
                let lines = data.toString().split(os_1.EOL);
                savedLines = savedLines.concat(lines);
                let result = savedLines[savedLines.length - 2];
                if (result === 'OK') {
                    cleanup();
                    lines = savedLines.slice(0, -2);
                    resolve(lines.map((line) => {
                        return line.replace(/\0/g, os_1.EOL);
                    }));
                }
            };
            let exitCallback = () => {
                cleanup();
                let message = `ghc-mod crashed on command ${command} with savedLines ${savedLines}`;
                this.logger.error(message);
                reject(message);
            };
            process.stdout.on('data', parseData);
            process.on('exit', exitCallback);
            timer = setTimeout(() => {
                cleanup();
                this.logger.log(`Timeout on ghc-mod command ${command}; message so far: ${savedLines}`);
            }, 60000);
        });
    }
    interact(process, command) {
        let resultP = this.waitForAnswer(process, command);
        this.logger.log('Interact: ' + command);
        process.stdin.write(command);
        return resultP;
    }
    spawnProcess() {
        if (this.childProcess) {
            return this.childProcess;
        }
        let errorDelayer = new async_1.ThrottledDelayer(100);
        let errorLines = [];
        let ghcArgs = ['legacy-interactive'];
        let stackArgs = ['exec', 'ghc-mod', '--'].concat(ghcArgs);
        let processArgs = this.options.executable === 'stack' ? stackArgs : ghcArgs;
        this.childProcess = cp.spawn(this.options.executable, processArgs, { cwd: this.options.rootPath });
        this.childProcess.on('error', (err) => {
            this.logger.error(`Error spawning ${this.options.executable} process - ${err}`);
        });
        this.childProcess.on('exit', () => {
            this.logger.log('EXIT: ghc-mod process');
            this.childProcess = null;
        });
        this.childProcess.stderr.on('data', (data) => {
            errorLines.push(data);
            errorDelayer.trigger(() => {
                return new Promise((resolve, reject) => {
                    this.logger.log(`ghc-mod stderr: ${errorLines.join('')}`);
                    errorLines = [];
                    resolve();
                });
            });
        });
        this.childProcess.stdout.setEncoding('utf-8');
        return this.childProcess;
    }
    mapFile(process, options) {
        // options.text represents the haskell file relevant to the command
        // In case it has not been saved, map the file to the text first
        // return Promise.resolve([]);
        return !options.text ? Promise.resolve([]) :
            this.interact(process, `map-file ${options.uri}${os_1.EOL}${options.text}${this.EOT}`);
    }
    unmapFile(process, options) {
        // return Promise.resolve([]);
        return !options.text ? Promise.resolve([]) : this.interact(process, `unmap-file ${options.uri}${os_1.EOL}`);
    }
    commandAndArgsAsString(options) {
        let base = options.uri ? [options.command, options.uri] : [options.command];
        if (options.args) {
            base = base.concat(options.args);
        }
        return base.join(' ').replace(os_1.EOL, ' ') + os_1.EOL;
    }
}
exports.InteractiveGhcModProcess = InteractiveGhcModProcess;
//# sourceMappingURL=interactiveGhcMod.js.map