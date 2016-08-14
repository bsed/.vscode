//import * as vscode from 'vscode';
var position;
var vscode;
function example2() {
    vscode.window.activeTextEditor.edit(function (editBuilder) {
        editBuilder.insert(position, 'Hello World!');
    });
}
function example3() {
    vscode.showInformationMessage('Foo');
    vscode.setStatusBarMessage('Bar');
}
function example4() {
    vscode.Shell.showInformationMessage('Foo');
    vscode.Shell.setStatusBarMessage('Bar');
}
function example1() {
    vscode.editor.insertText('foo');
}
//# sourceMappingURL=apiStudies.js.map