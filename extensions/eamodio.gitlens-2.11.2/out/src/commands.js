'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
var keyboard_1 = require("./commands/keyboard");
exports.Keyboard = keyboard_1.Keyboard;
var commands_1 = require("./commands/commands");
exports.ActiveEditorCommand = commands_1.ActiveEditorCommand;
exports.Command = commands_1.Command;
exports.Commands = commands_1.Commands;
exports.EditorCommand = commands_1.EditorCommand;
exports.openEditor = commands_1.openEditor;
var closeUnchangedFiles_1 = require("./commands/closeUnchangedFiles");
exports.CloseUnchangedFilesCommand = closeUnchangedFiles_1.CloseUnchangedFilesCommand;
var copyMessageToClipboard_1 = require("./commands/copyMessageToClipboard");
exports.CopyMessageToClipboardCommand = copyMessageToClipboard_1.CopyMessageToClipboardCommand;
var copyShaToClipboard_1 = require("./commands/copyShaToClipboard");
exports.CopyShaToClipboardCommand = copyShaToClipboard_1.CopyShaToClipboardCommand;
var diffDirectory_1 = require("./commands/diffDirectory");
exports.DiffDirectoryCommand = diffDirectory_1.DiffDirectoryCommand;
var diffLineWithPrevious_1 = require("./commands/diffLineWithPrevious");
exports.DiffLineWithPreviousCommand = diffLineWithPrevious_1.DiffLineWithPreviousCommand;
var diffLineWithWorking_1 = require("./commands/diffLineWithWorking");
exports.DiffLineWithWorkingCommand = diffLineWithWorking_1.DiffLineWithWorkingCommand;
var diffWithNext_1 = require("./commands/diffWithNext");
exports.DiffWithNextCommand = diffWithNext_1.DiffWithNextCommand;
var diffWithPrevious_1 = require("./commands/diffWithPrevious");
exports.DiffWithPreviousCommand = diffWithPrevious_1.DiffWithPreviousCommand;
var diffWithWorking_1 = require("./commands/diffWithWorking");
exports.DiffWithWorkingCommand = diffWithWorking_1.DiffWithWorkingCommand;
var openChangedFiles_1 = require("./commands/openChangedFiles");
exports.OpenChangedFilesCommand = openChangedFiles_1.OpenChangedFilesCommand;
var showBlame_1 = require("./commands/showBlame");
exports.ShowBlameCommand = showBlame_1.ShowBlameCommand;
var showBlameHistory_1 = require("./commands/showBlameHistory");
exports.ShowBlameHistoryCommand = showBlameHistory_1.ShowBlameHistoryCommand;
var showFileHistory_1 = require("./commands/showFileHistory");
exports.ShowFileHistoryCommand = showFileHistory_1.ShowFileHistoryCommand;
var showQuickCommitDetails_1 = require("./commands/showQuickCommitDetails");
exports.ShowQuickCommitDetailsCommand = showQuickCommitDetails_1.ShowQuickCommitDetailsCommand;
var showQuickCommitFileDetails_1 = require("./commands/showQuickCommitFileDetails");
exports.ShowQuickCommitFileDetailsCommand = showQuickCommitFileDetails_1.ShowQuickCommitFileDetailsCommand;
var showQuickFileHistory_1 = require("./commands/showQuickFileHistory");
exports.ShowQuickFileHistoryCommand = showQuickFileHistory_1.ShowQuickFileHistoryCommand;
var showQuickRepoHistory_1 = require("./commands/showQuickRepoHistory");
exports.ShowQuickRepoHistoryCommand = showQuickRepoHistory_1.ShowQuickRepoHistoryCommand;
var showQuickRepoStatus_1 = require("./commands/showQuickRepoStatus");
exports.ShowQuickRepoStatusCommand = showQuickRepoStatus_1.ShowQuickRepoStatusCommand;
var toggleBlame_1 = require("./commands/toggleBlame");
exports.ToggleBlameCommand = toggleBlame_1.ToggleBlameCommand;
var toggleCodeLens_1 = require("./commands/toggleCodeLens");
exports.ToggleCodeLensCommand = toggleCodeLens_1.ToggleCodeLensCommand;
exports.CommandContext = {
    CanToggleCodeLens: 'gitlens:canToggleCodeLens',
    Enabled: 'gitlens:enabled',
    IsBlameable: 'gitlens:isBlameable',
    Key: 'gitlens:key'
};
function setCommandContext(key, value) {
    return vscode_1.commands.executeCommand(constants_1.BuiltInCommands.SetContext, key, value);
}
exports.setCommandContext = setCommandContext;
//# sourceMappingURL=commands.js.map