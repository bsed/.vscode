var vscode = require('vscode');
var child_process = require('child_process');
var config;
function formatDocument(document) {
    var bin = config.bin === '' ? 'rustfmt' : config.bin;
    var result = child_process.spawnSync(bin, ['--write-mode', 'overwrite', document]);
    if (result.error) {
        vscode.window.showErrorMessage(result.error.toString());
    }
    else if (result.stderr.toString().length != 0) {
        var channel = vscode.window.createOutputChannel('Rustfmt Output');
        channel.append(result.stderr.toString());
        channel.show();
    }
}
function activate(context) {
    config = vscode.workspace.getConfiguration('rustfmt');
    // Manual fmt command
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('rustfmt.fmt', function (editor) {
        editor.document.save().then(function (fulfilled) {
            formatDocument(editor.document.fileName);
        });
    }));
    // Automatic save handler
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(function (target) {
        if (/\.rs$/.test(target.fileName) && (config.formatOnSave || true)) {
            formatDocument(target.fileName);
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map