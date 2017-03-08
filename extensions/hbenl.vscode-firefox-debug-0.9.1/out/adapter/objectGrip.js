"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("./index");
class ObjectGripAdapter {
    get actor() {
        return this._actor;
    }
    constructor(objectGrip, threadLifetime, threadAdapter) {
        this.threadAdapter = threadAdapter;
        this._actor = threadAdapter.debugSession.getOrCreateObjectGripActorProxy(objectGrip);
        this.isThreadLifetime = threadLifetime;
        this.threadAdapter.debugSession.registerVariablesProvider(this);
    }
    getVariables() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let prototypeAndProperties = yield this.actor.fetchPrototypeAndProperties();
            let variables = [];
            for (let varname in prototypeAndProperties.ownProperties) {
                variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, prototypeAndProperties.ownProperties[varname], this.isThreadLifetime, this.threadAdapter));
            }
            if (prototypeAndProperties.safeGetterValues) {
                for (let varname in prototypeAndProperties.safeGetterValues) {
                    variables.push(index_1.VariableAdapter.fromSafeGetterValueDescriptor(varname, prototypeAndProperties.safeGetterValues[varname], this.isThreadLifetime, this.threadAdapter));
                }
            }
            index_1.VariableAdapter.sortVariables(variables);
            if (prototypeAndProperties.prototype.type !== 'null') {
                variables.push(index_1.VariableAdapter.fromGrip('__proto__', prototypeAndProperties.prototype, this.isThreadLifetime, this.threadAdapter));
            }
            return variables;
        });
    }
    dispose() {
        this.threadAdapter.debugSession.unregisterVariablesProvider(this);
        this.actor.dispose();
    }
}
exports.ObjectGripAdapter = ObjectGripAdapter;
//# sourceMappingURL=objectGrip.js.map