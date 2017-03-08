"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const misc_1 = require("../util/misc");
const index_1 = require("../adapter/index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
let log = log_1.Log.create('FrameAdapter');
let actorIdRegex = /[0-9]+$/;
class FrameAdapter {
    constructor(frame, threadAdapter) {
        this.frame = frame;
        this.threadAdapter = threadAdapter;
        this.threadAdapter.debugSession.registerFrameAdapter(this);
        let environmentAdapter = index_1.EnvironmentAdapter.from(this.frame.environment);
        this.scopeAdapters = environmentAdapter.getScopeAdapters(this.threadAdapter);
        this.scopeAdapters[0].addThis(this.frame.this);
    }
    getStackframe() {
        let firefoxSource = this.frame.where.source;
        let sourceActorName = firefoxSource.actor;
        let sourcePath = this.threadAdapter.debugSession.convertFirefoxSourceToPath(firefoxSource);
        let sourceName = '';
        if (firefoxSource.url != null) {
            sourceName = firefoxSource.url;
        }
        else if (this.frame.type === 'eval') {
            let match = actorIdRegex.exec(sourceActorName);
            if (match) {
                sourceName = `eval ${match[0]}`;
            }
        }
        let sourceAdapter = this.threadAdapter.findSourceAdapterForActorName(sourceActorName);
        if (!sourceAdapter) {
            throw new Error(`Couldn't find source adapter for ${sourceActorName}`);
        }
        let sourceReference = (sourcePath === undefined) ? sourceAdapter.id : undefined;
        let source = new vscode_debugadapter_1.Source(sourceName, sourcePath, sourceReference);
        if (sourceAdapter.actor.source.isBlackBoxed) {
            source.presentationHint = 'deemphasize';
        }
        let name;
        switch (this.frame.type) {
            case 'call':
                let callee = this.frame.callee;
                if ((typeof callee === 'object') && (callee.type === 'object') &&
                    (callee.class === 'Function')) {
                    let calleeName = callee.name;
                    name = (calleeName !== undefined) ? calleeName : '[anonymous function]';
                }
                else {
                    log.error(`Unexpected callee in call frame: ${JSON.stringify(callee)}`);
                    name = '[unknown]';
                }
                break;
            case 'global':
                name = '[Global]';
                break;
            case 'eval':
            case 'clientEvaluate':
                name = '[eval]';
                break;
            default:
                name = `[${this.frame.type}]`;
                log.error(`Unexpected frame type ${this.frame.type}`);
                break;
        }
        return new vscode_debugadapter_1.StackFrame(this.id, name, source, this.frame.where.line, this.frame.where.column);
    }
    getObjectGripAdapters() {
        return misc_1.concatArrays(this.scopeAdapters.map((scopeAdapter) => scopeAdapter.getObjectGripAdapters()));
    }
    dispose() {
        this.threadAdapter.debugSession.unregisterFrameAdapter(this);
    }
}
exports.FrameAdapter = FrameAdapter;
//# sourceMappingURL=frame.js.map