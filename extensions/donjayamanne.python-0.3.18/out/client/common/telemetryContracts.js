"use strict";
var Debugger;
(function (Debugger) {
    Debugger.Load = "DEBUGGER_LOAD";
    Debugger.Attach = "DEBUGGER_ATTACH";
})(Debugger = exports.Debugger || (exports.Debugger = {}));
var Commands;
(function (Commands) {
    Commands.SortImports = "COMMAND_SORT_IMPORTS";
    Commands.UnitTests = "COMMAND_UNIT_TEST";
})(Commands = exports.Commands || (exports.Commands = {}));
var IDE;
(function (IDE) {
    IDE.Completion = "CODE_COMPLETION";
    IDE.Definition = "CODE_DEFINITION";
    IDE.Format = "CODE_FORMAT";
    IDE.HoverDefinition = "CODE_HOVER_DEFINITION";
    IDE.Reference = "CODE_REFERENCE";
    IDE.Rename = "CODE_RENAME";
    IDE.Symbol = "CODE_SYMBOL";
    IDE.Lint = "LINTING";
})(IDE = exports.IDE || (exports.IDE = {}));
exports.EVENT_LOAD = "IDE_LOAD";
//# sourceMappingURL=telemetryContracts.js.map