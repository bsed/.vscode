"use strict";
class TestGhcMod {
    constructor(commandResults) {
        this.commandResults = commandResults;
    }
    runGhcModCommand(options) {
        return Promise.resolve(this.commandResults);
    }
    killProcess() {
        return;
    }
}
exports.TestGhcMod = TestGhcMod;
//# sourceMappingURL=testGhcMod.js.map