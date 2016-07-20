"use strict";
var delayer_1 = require('./delayer');
var validationDelayer = {};
function validateDocument(name) {
    console.log("validate document: " + name);
}
validationDelayer['a'] = new delayer_1.Delayer(200);
validationDelayer['b'] = new delayer_1.Delayer(200);
function triggerValidateDocument(name) {
    var d = validationDelayer[name];
    if (!d) {
        d = new delayer_1.Delayer(200);
        validationDelayer[name] = d;
    }
    d.trigger(function () {
        validateDocument(name);
        delete validationDelayer[name];
    });
}
//d.trigger(() => { return validateDocument('a'); });
triggerValidateDocument('a');
triggerValidateDocument('a');
triggerValidateDocument('b');
triggerValidateDocument('b');
triggerValidateDocument('a');
//# sourceMappingURL=test.js.map