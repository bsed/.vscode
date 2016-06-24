"use strict";
var import_1 = require('./import');
var vscode = require('vscode');
var DefinitionProvider = (function () {
    function DefinitionProvider() {
        var _this = this;
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        if (DefinitionProvider._instance)
            throw new Error("Error: Instantiation failed: Use .instance instead of new.");
        this._statusBarItem.command = 'genGetSet.popup';
        this._statusBarItem.show();
        this.refreshExports();
        vscode.workspace.onDidSaveTextDocument(function (event) {
            _this.refreshExports();
        });
        DefinitionProvider._instance = this;
    }
    Object.defineProperty(DefinitionProvider, "instance", {
        get: function () {
            return DefinitionProvider._instance;
        },
        enumerable: true,
        configurable: true
    });
    DefinitionProvider.prototype.refreshExports = function () {
        var _this = this;
        this._statusBarItem.text = '$(eye) $(sync)';
        import_1.analyzeWorkspace().then(function (exports) {
            _this._cachedExports = exports;
            _this._statusBarItem.text = '$(eye) ' + exports.length;
        });
    };
    Object.defineProperty(DefinitionProvider.prototype, "cachedExports", {
        get: function () {
            return this._cachedExports;
        },
        enumerable: true,
        configurable: true
    });
    DefinitionProvider.prototype.toQuickPickItemList = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var quickPickItemList = [];
            for (var i = 0; i < _this._cachedExports.length; i++) {
                if (_this._cachedExports[i].libraryName) {
                    if (_this._cachedExports[i].exported) {
                        for (var j = 0; j < _this._cachedExports[i].exported.length; j++) {
                            quickPickItemList.push({
                                label: _this._cachedExports[i].exported[j],
                                description: _this._cachedExports[i].libraryName
                            });
                        }
                    }
                    else {
                        quickPickItemList.push({
                            label: _this._cachedExports[i].asName,
                            description: _this._cachedExports[i].libraryName
                        });
                    }
                }
            }
            resolve(quickPickItemList);
        });
    };
    DefinitionProvider._instance = new DefinitionProvider();
    return DefinitionProvider;
}());
exports.DefinitionProvider = DefinitionProvider;
//# sourceMappingURL=provider.js.map