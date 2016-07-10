'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var PHPCSFixer = (function () {
    function PHPCSFixer() {
        var config = vscode.workspace.getConfiguration('phpcsfixer');
        this.save = config.get('onsave', false);
        this.executable = config.get('executablePath', 'php-cs-fixer');
        this.level = config.get('level', 'psr2');
        this.fixers = config.get('fixers', '');
    }
    PHPCSFixer.prototype.dispose = function () {
        this.command.dispose();
        this.saveCommand.dispose();
    };
    PHPCSFixer.prototype.activate = function (context) {
        var _this = this;
        if (this.save) {
            this.saveCommand = vscode.workspace.onDidSaveTextDocument(function (document) {
                _this.fix(document);
            });
        }
        this.command = vscode.commands.registerTextEditorCommand('phpcsfixer.fix', function (textEditor) {
            _this.fix(textEditor.document);
        });
        context.subscriptions.push(this);
    };
    PHPCSFixer.prototype.fix = function (document) {
        if (document.languageId !== 'php') {
            return;
        }
        var stdout = '';
        var args = ['fix', document.fileName];
        if (this.level) {
            args.push('--level=' + this.level);
        }
        if (this.fixers) {
            args.push('--fixers=' + this.fixers);
        }
        var exec = cp.spawn(this.executable, args);
        exec.stdout.on('data', function (buffer) {
            stdout += buffer.toString();
        });
        exec.stderr.on('data', function (buffer) {
            console.log(buffer.toString());
        });
        exec.on('close', function (code) {
            if (code <= 1) {
                vscode.window.activeTextEditor.hide();
                vscode.window.activeTextEditor.show();
                vscode.window.setStatusBarMessage('PHP CS Fixer: ' + stdout.match(/^Fixed.*/m)[0] + '.', 4000);
                return;
            }
            if (code === 16) {
                vscode.window.showErrorMessage('PHP CS Fixer: Configuration error of the application.');
                return;
            }
            if (code === 32) {
                vscode.window.showErrorMessage('PHP CS Fixer: Configuration error of a Fixer.');
                return;
            }
            vscode.window.showErrorMessage('PHP CS Fixer unknown error.');
        });
    };
    return PHPCSFixer;
}());
function activate(context) {
    var phpcsfixer = new PHPCSFixer();
    phpcsfixer.activate(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map