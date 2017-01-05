"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode_debugadapter_1 = require("vscode-debugadapter");
class DebugAdapterBase extends vscode_debugadapter_1.DebugSession {
    constructor(debuggerLinesStartAt1, isServer = false) {
        super(debuggerLinesStartAt1, isServer);
    }
    initializeRequest(response, args) {
        this.handleRequest(response, () => this.initialize(args));
    }
    disconnectRequest(response, args) {
        this.handleRequestAsync(response, () => this.disconnect(args));
    }
    launchRequest(response, args) {
        this.handleRequestAsync(response, () => this.launch(args));
    }
    attachRequest(response, args) {
        this.handleRequestAsync(response, () => this.attach(args));
    }
    setBreakPointsRequest(response, args) {
        this.handleRequestAsync(response, () => this.setBreakpoints(args));
    }
    setExceptionBreakPointsRequest(response, args) {
        this.handleRequest(response, () => this.setExceptionBreakpoints(args));
    }
    pauseRequest(response, args) {
        this.handleRequestAsync(response, () => this.pause(args));
    }
    nextRequest(response, args) {
        this.handleRequestAsync(response, () => this.next(args));
    }
    stepInRequest(response, args) {
        this.handleRequestAsync(response, () => this.stepIn(args));
    }
    stepOutRequest(response, args) {
        this.handleRequestAsync(response, () => this.stepOut(args));
    }
    continueRequest(response, args) {
        this.handleRequestAsync(response, () => this.continue(args));
    }
    sourceRequest(response, args) {
        this.handleRequestAsync(response, () => this.getSource(args));
    }
    threadsRequest(response) {
        this.handleRequest(response, () => this.getThreads());
    }
    stackTraceRequest(response, args) {
        this.handleRequestAsync(response, () => this.getStackTrace(args));
    }
    scopesRequest(response, args) {
        this.handleRequest(response, () => this.getScopes(args));
    }
    variablesRequest(response, args) {
        this.handleRequestAsync(response, () => this.getVariables(args));
    }
    evaluateRequest(response, args) {
        this.handleRequestAsync(response, () => this.evaluate(args));
    }
    handleRequest(response, executeRequest) {
        try {
            response.body = executeRequest();
        }
        catch (err) {
            response.success = false;
            response.message = this.errorString(err);
        }
        this.sendResponse(response);
    }
    handleRequestAsync(response, executeRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                response.body = yield executeRequest();
            }
            catch (err) {
                response.success = false;
                response.message = this.errorString(err);
            }
            this.sendResponse(response);
        });
    }
    errorString(err) {
        if ((typeof err === 'object') && (err !== null) && (typeof err.message === 'string')) {
            return err.message;
        }
        else {
            return String(err);
        }
    }
}
exports.DebugAdapterBase = DebugAdapterBase;
//# sourceMappingURL=debugAdapterBase.js.map