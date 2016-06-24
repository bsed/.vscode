var vscode_1 = require('vscode');
var parser_1 = require('./parser');
var es_quotes_1 = require('./es-quotes');
var transform_1 = require('./transform');
var CONFIG_DEFAULT_QUOTE = 'esQuotes.defaultQuote';
function activate() {
    var config = vscode_1.workspace.getConfiguration();
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformToTemplateString', function (editor, edit) {
        var result = es_quotes_1.findActiveStringTargetInEditor(editor);
        var activeTarget = result.target;
        if (!activeTarget) {
            return;
        }
        if (activeTarget.type === 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is already a template string.');
            return;
        }
        var value = transform_1.transform(activeTarget.body, activeTarget.type, 2 /* template */);
        edit.replace(activeTarget.range, value);
    });
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformToNormalString', function (editor, edit) {
        var result = es_quotes_1.findActiveStringTargetsInEditor(editor);
        var activeTargets = result.targets;
        if (!activeTargets) {
            return;
        }
        var firstTarget = activeTargets[0];
        if (parser_1.isStringBodyTarget(firstTarget) && firstTarget.type !== 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is already a normal string.');
            return;
        }
        var quote = config.get(CONFIG_DEFAULT_QUOTE);
        if (!/^["']$/.test(quote)) {
            quote = result.defaultQuote;
        }
        var type = quote === '"' ? 1 /* doubleQuoted */ : 0 /* singleQuoted */;
        var editInfos = [];
        var hasNonEmptyStringBody = false;
        for (var i = 0; i < activeTargets.length; i++) {
            var target = activeTargets[i];
            if (parser_1.isStringBodyTarget(target)) {
                if (target.body && !hasNonEmptyStringBody) {
                    hasNonEmptyStringBody = true;
                }
                var value = target.body && transform_1.transform(target.body, 2 /* template */, type);
                if (i > 0) {
                    value = value && ' + ' + value;
                    var previousTarget = activeTargets[i - 1];
                    if (parser_1.isStringGroupTarget(previousTarget)) {
                        if (previousTarget.hasLowPriorityOperator) {
                            value = ')' + value;
                        }
                        if (previousTarget.whitespacesRangeAtEnd && !previousTarget.whitespacesRangeAtEnd.isEmpty) {
                            target.range = new vscode_1.Range(previousTarget.whitespacesRangeAtEnd.start, target.range.end);
                        }
                    }
                }
                if (i < activeTargets.length - 1) {
                    value = value && value + ' + ';
                    var nextTarget = activeTargets[i + 1];
                    if (parser_1.isStringGroupTarget(nextTarget)) {
                        if (nextTarget.hasLowPriorityOperator) {
                            value += '(';
                        }
                        if (nextTarget.whitespacesRangeAtBeginning && !nextTarget.whitespacesRangeAtBeginning.isEmpty) {
                            target.range = new vscode_1.Range(target.range.start, nextTarget.whitespacesRangeAtBeginning.end);
                        }
                    }
                }
                editInfos.push({
                    range: target.range,
                    value: value
                });
            }
        }
        if (!hasNonEmptyStringBody) {
            var firstEditInfo = editInfos[0];
            var value = quote + quote;
            if (activeTargets.length > 1) {
                value += ' + ' + firstEditInfo.value;
            }
            firstEditInfo.value = value;
        }
        editor
            .edit(function (edit) {
            for (var _i = 0, editInfos_1 = editInfos; _i < editInfos_1.length; _i++) {
                var editInfo = editInfos_1[_i];
                edit.replace(editInfo.range, editInfo.value);
            }
        })
            .then(undefined, function (reason) {
            console.error(reason);
            vscode_1.window.showInformationMessage('Failed to transform selected template string.');
        });
    });
    vscode_1.commands.registerTextEditorCommand('esQuotes.transformBetweenSingleDoubleQuotes', function (editor, edit) {
        var result = es_quotes_1.findActiveStringTargetInEditor(editor);
        var activeTarget = result.target;
        if (!activeTarget) {
            return;
        }
        if (activeTarget.type === 2 /* template */) {
            vscode_1.window.showInformationMessage('The string at selected range is a template string.');
            return;
        }
        var type = activeTarget.type === 1 /* doubleQuoted */ ? 0 /* singleQuoted */ : 1 /* doubleQuoted */;
        var value = transform_1.transform(activeTarget.body, activeTarget.type, type);
        edit.replace(activeTarget.range, value);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map