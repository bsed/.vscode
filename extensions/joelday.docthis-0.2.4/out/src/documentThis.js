var vscode = require("vscode");
var path = require("path");
var ts = require("typescript");
var utils = require("./utilities");
var fs = require("fs");
var TS_CONFIG_FILENAME = "tsconfig.json";
function documentThis() {
    var textEditor = vscode.window.activeTextEditor;
    var document = textEditor.document;
    if (!document.fileName) {
        return;
    }
    var selection = textEditor.selection;
    // Null check the selection
    var carat = selection.start;
    var fileName = utils.fixWinPath(document.fileName);
    var config = resolveAndLoadConfig(fileName);
    var files = {};
    var rootFileNames = config ? config.fileNames : [fileName];
    rootFileNames = rootFileNames.map(function (f) { return utils.fixWinPath(f); });
    // initialize the list of files
    rootFileNames.forEach(function (fileName) {
        files[fileName] = { version: 0 };
    });
    // Create the language service host to allow the LS to communicate with the host
    var servicesHost = {
        getScriptFileNames: function () { return rootFileNames; },
        getScriptVersion: function (fileName) { return files[fileName] && files[fileName].version.toString(); },
        getScriptSnapshot: function (fileName) {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getCurrentDirectory: function () { return vscode.workspace.rootPath ? utils.fixWinPath(path.resolve(vscode.workspace.rootPath)) : process.cwd(); },
        getCompilationSettings: function () { return config ? config.options : {}; },
        getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); },
    };
    // Create the language service files
    var services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    //const program = services.getProgram();
    // const sourceFile = services.getSourceFile(fileName);
    // //services.getQuickInfoAtPosition
    // //const definitions = services.getDefinitionAtPosition(document.fileName, carat.character);
    // const f = services.getTypeDefinitionAtPosition(fileName, carat.character);
    //services.getDefinitionAtPosition(utils.fixWinPath(document.fileName), carat.character);
    var program = services.getProgram();
    var typeChecker = program.getTypeChecker();
    var sourceFile = services.getSourceFile(fileName);
    var position = ts.getPositionOfLineAndCharacter(sourceFile, carat.line, carat.character);
    var node = utils.findChildForPosition(sourceFile, position);
    //const signatureHelpItems = services.getSignatureHelpItems(fileName, position);
    //const symbol = typeChecker.getSymbolAtLocation()
    ///const output = services.getEmitOutput(fileName);
    //console.log("whee");
    //let t = sourceFile.getFirstToken(sourceFile);
    //let qi = services.getQuickInfoAtPosition(fileName, )
    //tc.getSymbolAtLocation()
    //     let allDiagnostics = services.getCompilerOptionsDiagnostics()
    //         .concat(services.getSyntacticDiagnostics(fileName))
    //         .concat(services.getSemanticDiagnostics(fileName));
    // 
    //     allDiagnostics.forEach(diagnostic => {
    //         let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    //         if (diagnostic.file) {
    //             let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    //             console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    //         }
    //         else {
    //             console.log(`  Error: ${message}`);
    //         }
    //     });
}
exports.documentThis = documentThis;
function resolveAndLoadConfig(fileName) {
    var tsConfigFileName = resolveTsConfigFileName(fileName);
    if (!tsConfigFileName) {
        return null;
    }
    return loadTsConfig(tsConfigFileName);
}
function resolveTsConfigFileName(fileName) {
    var searchPath = path.resolve(vscode.workspace.rootPath);
    if (utils.isUndefined(vscode.workspace.rootPath)) {
        return null;
    }
    var docPath = path.dirname(fileName);
    while (true) {
        var localTsConfig = path.resolve(path.join(docPath, TS_CONFIG_FILENAME));
        if (ts.sys.fileExists(localTsConfig)) {
            return localTsConfig;
        }
        if (path.resolve(docPath) === searchPath) {
            break;
        }
        docPath = path.join(docPath, "..");
    }
    return null;
}
function loadTsConfig(fileName) {
    var fileParseResult = ts.parseConfigFileTextToJson(fileName, ts.sys.readFile(fileName));
    return ts.parseJsonConfigFileContent(fileParseResult.config, ts.sys, path.dirname(fileName));
}
//# sourceMappingURL=documentThis.js.map