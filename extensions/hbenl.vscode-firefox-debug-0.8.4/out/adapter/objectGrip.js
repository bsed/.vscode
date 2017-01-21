"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
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
        return __awaiter(this, void 0, void 0, function* () {
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