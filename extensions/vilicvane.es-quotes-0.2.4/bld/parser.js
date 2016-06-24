var vscode_1 = require('vscode');
var range_1 = require('./range');
var parsingRegex = /(\/\*[\s\S]*?(?:\*\/|$)|\/\/.*\r?\n)|(["'])((?:\\(?:\r\n|[^])|(?!\2|\\).)*)(\2)?|\/(?:\\.|\[(?:\\.|[^\]\\\r\n])*\]?|[^\\\/\r\n])+\/|(`)|([()\[\]{}])|([?&|+-]|&&|\|\||<<<?|>>>?)|(\s+)|[^]/g;
var templateStringRegex = /([`}])((?:\\[^]|(?!\$\{)[^`])*)(`|\$\{)?/g; // This comment is to fix highlighting: `
var bracketConsumptionPair = {
    '}': '{',
    ']': '[',
    ')': '('
};
function parse(source) {
    var rangeBuilder = new range_1.RangeBuilder(source);
    var rootStringTargets = [];
    var nestedStringTargetStack = [];
    var currentGroupTarget;
    var currentStringTargets = rootStringTargets;
    var currentBracketStack;
    var isNewGroupTarget;
    var groups;
    var doubleQuotedCount = 0;
    var singleQuotedCount = 0;
    while (groups = parsingRegex.exec(source)) {
        var text = groups[0];
        isNewGroupTarget = false;
        if (groups[1 /* comment */]) {
        }
        else if (groups[2 /* quote */]) {
            var quote = groups[2 /* quote */];
            var body = groups[3 /* stringBody */];
            var range = rangeBuilder.getRange(parsingRegex.lastIndex - text.length, parsingRegex.lastIndex);
            // TODO:
            // if (currentBracketStack && currentBracketStack.length) {
            //     pushNestedTargetStack();
            // }
            var type = void 0;
            if (quote === '"') {
                type = 1 /* doubleQuoted */;
                doubleQuotedCount++;
            }
            else {
                type = 0 /* singleQuoted */;
                singleQuotedCount++;
            }
            var target = {
                body: body,
                range: range,
                opening: quote,
                closing: quote,
                type: type
            };
            currentStringTargets.push(target);
        }
        else if (groups[5 /* templateStringQuote */] || (nestedStringTargetStack.length &&
            currentBracketStack.indexOf('{') < 0 &&
            groups[6 /* bracket */] === '}')) {
            if (groups[5 /* templateStringQuote */]) {
                // `abc${123}def`
                // ^
                pushNestedTargetStack();
            }
            else {
                // `abc${123}def`
                //          ^
                popNestedTargetStack();
            }
            templateStringRegex.lastIndex = parsingRegex.lastIndex - groups[0].length;
            // The match below should always success.
            var templateStringGroups = templateStringRegex.exec(source);
            var templateStringText = templateStringGroups[0];
            parsingRegex.lastIndex = templateStringRegex.lastIndex;
            var body = templateStringGroups[2 /* stringBody */];
            var range = rangeBuilder.getRange(templateStringRegex.lastIndex - templateStringText.length, templateStringRegex.lastIndex);
            var openingQuote = templateStringGroups[1 /* quote */];
            var closingQuote = templateStringGroups[3 /* closingQuote */] || '`';
            var target = {
                body: body,
                range: range,
                opening: openingQuote,
                closing: closingQuote,
                type: 2 /* template */
            };
            currentStringTargets.push(target);
            if (closingQuote === '${') {
                // `abc${123}def`
                //     ^
                pushNestedTargetStack();
            }
            else {
                // `abc${123}def`
                //              ^
                popNestedTargetStack();
            }
        }
        else if (currentBracketStack) {
            if (groups[6 /* bracket */]) {
                var bracket = groups[6 /* bracket */];
                if (bracket in bracketConsumptionPair) {
                    var bra = bracketConsumptionPair[bracket];
                    if (currentBracketStack.length && bra === currentBracketStack[currentBracketStack.length - 1]) {
                        currentBracketStack.pop();
                    }
                    else {
                        // Otherwise there might be some syntax error, but we don't really care.
                        console.warn("Mismatched right bracket \"" + bracket + "\".");
                    }
                }
                else {
                    currentBracketStack.push(bracket);
                }
            }
            else if (!currentBracketStack.length && groups[7 /* operator */]) {
                currentGroupTarget.hasLowPriorityOperator = true;
            }
        }
        if (currentGroupTarget) {
            if (groups[8 /* whitespace */]) {
                var range = rangeBuilder.getRange(parsingRegex.lastIndex - text.length, parsingRegex.lastIndex);
                if (currentGroupTarget.whitespacesRangeAtBeginning instanceof vscode_1.Range) {
                    currentGroupTarget.whitespacesRangeAtEnd = range;
                }
                else {
                    currentGroupTarget.whitespacesRangeAtBeginning = range;
                }
            }
            else if (!isNewGroupTarget) {
                if (currentGroupTarget.whitespacesRangeAtBeginning instanceof vscode_1.Range) {
                    var start = rangeBuilder.getPosition(parsingRegex.lastIndex);
                    var range = new vscode_1.Range(start, start);
                    currentGroupTarget.whitespacesRangeAtEnd = range;
                }
                else {
                    var end = rangeBuilder.getPosition(parsingRegex.lastIndex - text.length);
                    var range = new vscode_1.Range(end, end);
                    currentGroupTarget.whitespacesRangeAtBeginning = range;
                }
            }
        }
    }
    finalizeTargets(rootStringTargets);
    return {
        defaultQuote: singleQuotedCount < doubleQuotedCount ? '"' : "'",
        stringTargets: rootStringTargets
    };
    function pushNestedTargetStack() {
        var target = {
            partials: [],
            bracketStack: [],
            hasLowPriorityOperator: false,
            whitespacesRangeAtBeginning: undefined,
            whitespacesRangeAtEnd: undefined
        };
        currentStringTargets.push(target);
        currentGroupTarget = target;
        currentStringTargets = target.partials;
        currentBracketStack = target.bracketStack;
        nestedStringTargetStack.push(target);
        isNewGroupTarget = true;
    }
    function popNestedTargetStack() {
        nestedStringTargetStack.pop();
        var lastIndex = nestedStringTargetStack.length - 1;
        if (lastIndex < 0) {
            currentGroupTarget = undefined;
            currentStringTargets = rootStringTargets;
            currentBracketStack = undefined;
        }
        else {
            var target = nestedStringTargetStack[lastIndex];
            currentGroupTarget = target;
            currentStringTargets = target.partials;
            currentBracketStack = target.bracketStack;
        }
    }
    function finalizeTargets(targets) {
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (target.partials) {
                delete target.bracketStack;
                finalizeTargets(target.partials);
            }
        }
    }
}
exports.parse = parse;
function isStringGroupTarget(target) {
    return !!target.partials;
}
exports.isStringGroupTarget = isStringGroupTarget;
function isStringBodyTarget(target) {
    return !target.partials;
}
exports.isStringBodyTarget = isStringBodyTarget;
//# sourceMappingURL=parser.js.map