'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const commands_1 = require("./commands");
const logger_1 = require("../logger");
class DiffDirectoryCommand extends commands_1.ActiveEditorCommand {
    constructor(git, repoPath) {
        super(commands_1.Commands.DiffDirectory);
        this.git = git;
        this.repoPath = repoPath;
    }
    execute(editor, uri, shaOrBranch1, shaOrBranch2) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(uri instanceof vscode_1.Uri)) {
                uri = editor && editor.document && editor.document.uri;
            }
            try {
                const repoPath = yield this.git.getRepoPathFromUri(uri, this.repoPath);
                if (!repoPath)
                    return vscode_1.window.showWarningMessage(`Unable to open directory diff`);
                if (!shaOrBranch1) {
                    return undefined;
                }
                this.git.openDirectoryDiff(repoPath, shaOrBranch1, shaOrBranch2);
                return undefined;
            }
            catch (ex) {
                logger_1.Logger.error('GitLens.DiffDirectoryCommand', ex);
                return vscode_1.window.showErrorMessage(`Unable to open directory diff. See output channel for more details`);
            }
        });
    }
}
exports.DiffDirectoryCommand = DiffDirectoryCommand;
//# sourceMappingURL=diffDirectory.js.map