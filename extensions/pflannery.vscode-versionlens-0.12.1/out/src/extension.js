"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var bootstrap_1 = require('./bootstrap');
var di_1 = require('./common/di');
var vscode_1 = require('vscode');
var npmCodeLensProvider_1 = require('./providers/npm/npmCodeLensProvider');
var bowerCodeLensProvider_1 = require('./providers/bower/bowerCodeLensProvider');
var dubCodeLensProvider_1 = require('./providers/dub/dubCodeLensProvider');
var dotNetCodeLensProvider_1 = require('./providers/dotnet/dotNetCodeLensProvider');
var commands_1 = require('./commands');
function activate(context) {
    if (bootstrap_1.bootstrapLoaded === false)
        throw ReferenceError("VersionCodelens: didnt execute it's bootstrap.");
    var config = di_1.resolve('appConfig');
    var disposables = [];
    var providers = [
        new npmCodeLensProvider_1.NpmCodeLensProvider(),
        new bowerCodeLensProvider_1.BowerCodeLensProvider(),
        new dubCodeLensProvider_1.DubCodeLensProvider(),
        new dotNetCodeLensProvider_1.DotNetCodeLensProvider()
    ];
    providers.forEach(function (provider) {
        disposables.push(vscode_1.languages.registerCodeLensProvider(provider.selector, provider));
    });
    disposables.push(vscode_1.commands.registerCommand("_" + config.extentionName + ".updateDependencyCommand", commands_1.updateDependencyCommand), vscode_1.commands.registerCommand("_" + config.extentionName + ".updateDependenciesCommand", commands_1.updateDependenciesCommand), vscode_1.commands.registerCommand("_" + config.extentionName + ".linkCommand", commands_1.linkCommand));
    (_a = context.subscriptions).push.apply(_a, disposables);
    var _a;
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map