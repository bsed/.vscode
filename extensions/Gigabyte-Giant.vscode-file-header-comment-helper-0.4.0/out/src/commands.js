"use strict";
var vscode = require("vscode");
var configPrefix = "fileHeaderCommentHelper";
function insertFileHeaderComment() {
    var _workspace = vscode.workspace;
    var _window = vscode.window;
    var _editor = _window.activeTextEditor;
    var _root = _workspace.rootPath;
    var projConf = _workspace.getConfiguration((configPrefix + ".projectSettings"));
    var langConfs = _workspace.getConfiguration((configPrefix + ".languageConfigs"));
    var values = {
        "projectName": undefined,
        "currentFile": undefined
    };
    if (_root !== undefined && _editor !== undefined) {
        var languageStr = ("language_" + _editor.document.languageId);
        if (projConf.has("projectName") && projConf.get("projectName") !== null) {
            values.projectName = projConf.get("projectName");
        }
        else {
            values.projectName = _root.substr(_root.lastIndexOf("/") + 1);
        }
        values.currentFile = _editor.document.fileName.replace(_root, "").substr(1);
        if (langConfs.has(languageStr)) {
            var template = langConfs.get(languageStr + ".template").join("\n");
            _editor.edit(function (edit) {
                edit.insert(new vscode.Position(1, 1), template
                    .replace("$(projectName)", values.projectName)
                    .replace("$(currentFile)", values.currentFile));
            });
            vscode.commands.executeCommand("workbench.action.files.save");
        }
        else {
            var openGlobalSettingsItem = {
                "title": "Open Global Settings"
            };
            var openWorkspaceSettingsItem = {
                "title": "Open Workspace Settings"
            };
            vscode.window.showErrorMessage(("Unable to locate file-header-comment template for " +
                _editor.document.languageId + "."), openGlobalSettingsItem, openWorkspaceSettingsItem).then(function (selectedItem) {
                if (selectedItem === openGlobalSettingsItem) {
                    vscode.commands.executeCommand("workbench.action.openGlobalSettings");
                }
                else if (selectedItem === openWorkspaceSettingsItem) {
                    vscode.commands.executeCommand("workbench.action.openWorkspaceSettings");
                }
            });
        }
    }
}
exports.insertFileHeaderComment = insertFileHeaderComment;
//# sourceMappingURL=commands.js.map