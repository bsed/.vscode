var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const editorconfig = require("editorconfig");
const path = require("path");
const vscode_1 = require("vscode");
const Utils = require("./Utils");
const transformations_1 = require("./transformations");
/**
 * Listens to vscode document open and maintains a map
 * (Document => editor config settings)
 */
class DocumentWatcher {
    constructor() {
        const subscriptions = [];
        // Listen for changes in the active text editor
        subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(textEditor => {
            if (textEditor && textEditor.document) {
                this._onDidOpenDocument(textEditor.document);
            }
        }));
        // Listen for changes in the configuration
        subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(this._onConfigChanged.bind(this)));
        // Listen for saves to ".editorconfig" files and rebuild the map
        subscriptions.push(vscode_1.workspace.onDidSaveTextDocument((savedDocument) => __awaiter(this, void 0, void 0, function* () {
            if (path.basename(savedDocument.fileName) === '.editorconfig') {
                yield this._rebuildConfigMap();
            }
        })));
        subscriptions.push(vscode_1.workspace.onWillSaveTextDocument(e => {
            e.waitUntil(calculatePreSaveTransformations.call(this, e.document));
        }));
        // dispose event subscriptons upon disposal
        this._disposable = vscode_1.Disposable.from.apply(this, subscriptions);
        // Build the map (cover the case that documents were opened before
        // my activation)
        this._rebuildConfigMap();
        // Load the initial workspace configuration
        this._onConfigChanged();
    }
    dispose() {
        this._disposable.dispose();
    }
    getSettingsForDocument(document) {
        return this._documentToConfigMap[document.fileName];
    }
    getDefaultSettings() {
        return this._defaults;
    }
    _rebuildConfigMap() {
        this._documentToConfigMap = {};
        return Promise.all(vscode_1.workspace.textDocuments.map(document => this._onDidOpenDocument(document)));
    }
    _onDidOpenDocument(document) {
        if (document.isUntitled) {
            // Does not have a fs path
            return Promise.resolve();
        }
        const path = document.fileName;
        if (this._documentToConfigMap[path]) {
            applyEditorConfigToTextEditor.call(this, vscode_1.window.activeTextEditor);
            return Promise.resolve();
        }
        return editorconfig.parse(path)
            .then((config) => {
            if (config.indent_size === 'tab') {
                config.indent_size = config.tab_width;
            }
            this._documentToConfigMap[path] = config;
            applyEditorConfigToTextEditor.call(this, vscode_1.window.activeTextEditor);
        });
    }
    _onConfigChanged() {
        const workspaceConfig = vscode_1.workspace.getConfiguration('editor');
        const detectIndentation = workspaceConfig.get('detectIndentation');
        this._defaults = (detectIndentation) ? {} : {
            tabSize: workspaceConfig.get('tabSize'),
            insertSpaces: workspaceConfig.get('insertSpaces')
        };
    }
}
function calculatePreSaveTransformations(textDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        const editorconfig = this.getSettingsForDocument(textDocument);
        if (!editorconfig) {
            // no configuration found for this file
            return Promise.resolve();
        }
        yield transformations_1.endOfLineTransform(editorconfig, textDocument);
        return [
            ...transformations_1.insertFinalNewlineTransform(editorconfig, textDocument),
            ...transformations_1.trimTrailingWhitespaceTransform(editorconfig, textDocument)
        ];
    });
}
function applyEditorConfigToTextEditor(textEditor) {
    if (!textEditor) {
        // No more open editors
        return;
    }
    const doc = textEditor.document;
    const editorconfig = this.getSettingsForDocument(doc);
    if (!editorconfig) {
        // no configuration found for this file
        return;
    }
    const newOptions = Utils.fromEditorConfig(editorconfig, this.getDefaultSettings());
    /* tslint:disable:no-any */
    textEditor.options = newOptions;
    /* tslint:enable */
}
exports.default = DocumentWatcher;
//# sourceMappingURL=DocumentWatcher.js.map