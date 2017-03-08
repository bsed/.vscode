"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const vscode_debugadapter_1 = require("vscode-debugadapter");
let log = log_1.Log.create('VariableAdapter');
class VariableAdapter {
    constructor(varname, value, objectGripAdapter) {
        this.varname = varname;
        this.value = value;
        this._objectGripAdapter = objectGripAdapter;
    }
    getVariable() {
        return new vscode_debugadapter_1.Variable(this.varname, this.value, this._objectGripAdapter ? this._objectGripAdapter.variablesProviderId : undefined);
    }
    get objectGripAdapter() {
        return this._objectGripAdapter;
    }
    static fromGrip(varname, grip, threadLifetime, threadAdapter) {
        if ((typeof grip === 'boolean') || (typeof grip === 'number')) {
            return new VariableAdapter(varname, grip.toString());
        }
        else if (typeof grip === 'string') {
            return new VariableAdapter(varname, `"${grip}"`);
        }
        else {
            switch (grip.type) {
                case 'null':
                case 'undefined':
                case 'Infinity':
                case '-Infinity':
                case 'NaN':
                case '-0':
                    return new VariableAdapter(varname, grip.type);
                case 'longString':
                    return new VariableAdapter(varname, grip.initial);
                case 'symbol':
                    return new VariableAdapter(varname, grip.name);
                case 'object':
                    let objectGrip = grip;
                    let vartype = objectGrip.class;
                    let objectGripAdapter = threadAdapter.getOrCreateObjectGripAdapter(objectGrip, threadLifetime);
                    return new VariableAdapter(varname, vartype, objectGripAdapter);
                default:
                    log.warn(`Unexpected object grip of type ${grip.type}: ${JSON.stringify(grip)}`);
                    return new VariableAdapter(varname, grip.type);
            }
        }
    }
    static fromPropertyDescriptor(varname, propertyDescriptor, threadLifetime, threadAdapter) {
        if (propertyDescriptor.value !== undefined) {
            return VariableAdapter.fromGrip(varname, propertyDescriptor.value, threadLifetime, threadAdapter);
        }
        else {
            return new VariableAdapter(varname, 'undefined');
        }
    }
    static fromSafeGetterValueDescriptor(varname, safeGetterValueDescriptor, threadLifetime, threadAdapter) {
        return VariableAdapter.fromGrip(varname, safeGetterValueDescriptor.getterValue, threadLifetime, threadAdapter);
    }
    static sortVariables(variables) {
        variables.sort((var1, var2) => VariableAdapter.compareStrings(var1.varname, var2.varname));
    }
    static compareStrings(s1, s2) {
        if (s1 < s2) {
            return -1;
        }
        else if (s1 === s2) {
            return 0;
        }
        else {
            return 1;
        }
    }
}
exports.VariableAdapter = VariableAdapter;
//# sourceMappingURL=variable.js.map