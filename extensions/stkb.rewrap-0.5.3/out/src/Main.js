"use strict";
var vscode_1 = require('vscode');
require('./extensions');
var documentTypes_1 = require('./documentTypes');
var FixSelections_1 = require('./FixSelections');
var Section_1 = require('./Section');
/** Is called when the extension is activated, the very first time the
 *  command is executed */
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand('rewrap.rewrapComment', function (editor) { return wrapSomething(editor); }));
}
exports.activate = activate;
/** Finds the processor for the document and does the wrapping */
function wrapSomething(editor, wrappingColumn) {
    var handler = documentTypes_1.default(editor.document), tabSize = editor.options.tabSize;
    wrappingColumn = wrappingColumn || getWrappingColumn();
    var sections = handler.findSections(editor.document), sectionsToEdit = Section_1.default.sectionsInSelections(sections.primary, sections.secondary, editor.selections);
    var edits = sectionsToEdit
        .map(function (sectionToEdit) {
        return handler.editSection(wrappingColumn, tabSize, sectionToEdit);
    })
        .sort(function (e1, e2) { return e1.startLine > e2.startLine ? -1 : 1; });
    var oldSelections = FixSelections_1.saveSelections(editor);
    return (editor
        .edit(function (builder) {
        return edits.forEach(function (e) {
            var range = editor.document.validateRange(new vscode_1.Range(e.startLine, 0, e.endLine, Number.MAX_VALUE)), text = e.lines.join('\n');
            builder.replace(range, text);
        });
    })
        .then(function () { return FixSelections_1.restoreSelections(editor, oldSelections); }));
}
exports.wrapSomething = wrapSomething;
/** Gets the wrapping column (eg 80) from the user's setting */
function getWrappingColumn() {
    var editorColumn = vscode_1.workspace.getConfiguration('editor').get('wrappingColumn'), extensionColumn = vscode_1.workspace.getConfiguration('rewrap').get('wrappingColumn');
    return extensionColumn
        || (0 < editorColumn && editorColumn <= 120) && editorColumn
        || 80;
}
//# sourceMappingURL=Main.js.map