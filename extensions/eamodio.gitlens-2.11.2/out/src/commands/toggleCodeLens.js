'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("./commands");
class ToggleCodeLensCommand extends commands_1.EditorCommand {
    constructor(git) {
        super(commands_1.Commands.ToggleCodeLens);
        this.git = git;
    }
    execute(editor, edit) {
        return this.git.toggleCodeLens(editor);
    }
}
exports.ToggleCodeLensCommand = ToggleCodeLensCommand;
//# sourceMappingURL=toggleCodeLens.js.map