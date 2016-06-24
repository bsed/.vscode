var vscode_1 = require('vscode');
var parser_1 = require('./parser');
var supportedLanguages = [
    'typescript',
    'javascript'
];
function findActiveStringTarget(targets, selection) {
    for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
        var target = targets_1[_i];
        var partials = target.partials;
        if (partials) {
            var foundTarget = findActiveStringTarget(partials, selection);
            if (foundTarget) {
                return foundTarget;
            }
        }
        else {
            if (target.range.contains(selection)) {
                return target;
            }
        }
    }
    return undefined;
}
exports.findActiveStringTarget = findActiveStringTarget;
function findActiveStringTargets(targets, selection) {
    for (var _i = 0, targets_2 = targets; _i < targets_2.length; _i++) {
        var target = targets_2[_i];
        var partials = target.partials;
        if (partials) {
            var foundTargets = findActiveStringTargets(partials, selection);
            if (foundTargets) {
                return foundTargets;
            }
        }
        else {
            if (target.range.contains(selection)) {
                return target.type === 2 /* template */ ?
                    targets : [target];
            }
        }
    }
    return undefined;
}
exports.findActiveStringTargets = findActiveStringTargets;
function findActiveStringTargetInEditor(editor) {
    var document = editor.document;
    var language = document.languageId;
    if (supportedLanguages.indexOf(language) < 0) {
        vscode_1.window.showInformationMessage('Language not supported.');
        return;
    }
    var source = document.getText();
    var selection = editor.selection;
    var result = parser_1.parse(source);
    var stringTargets = result.stringTargets;
    var activeTarget = findActiveStringTarget(stringTargets, selection);
    if (!activeTarget) {
        vscode_1.window.showInformationMessage('No string found at selected range.');
    }
    return {
        defaultQuote: result.defaultQuote,
        target: activeTarget
    };
}
exports.findActiveStringTargetInEditor = findActiveStringTargetInEditor;
function findActiveStringTargetsInEditor(editor) {
    var document = editor.document;
    var language = document.languageId;
    if (supportedLanguages.indexOf(language) < 0) {
        vscode_1.window.showInformationMessage('Language not supported.');
        return;
    }
    var source = document.getText();
    var selection = editor.selection;
    var result = parser_1.parse(source);
    var stringTargets = result.stringTargets;
    var activeTargets = findActiveStringTargets(stringTargets, selection);
    if (!activeTargets) {
        vscode_1.window.showInformationMessage('No string found at selected range.');
    }
    return {
        defaultQuote: result.defaultQuote,
        targets: activeTargets
    };
}
exports.findActiveStringTargetsInEditor = findActiveStringTargetsInEditor;
//# sourceMappingURL=es-quotes.js.map