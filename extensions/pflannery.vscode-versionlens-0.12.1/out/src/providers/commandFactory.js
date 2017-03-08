"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var di_1 = require('../common/di');
var utils_1 = require('../common/utils');
var CommandFactory = (function () {
    function CommandFactory() {
    }
    CommandFactory.prototype.makeErrorCommand = function (errorMsg, codeLens) {
        return codeLens.setCommand("" + errorMsg);
    };
    CommandFactory.prototype.makeVersionCommand = function (localVersion, serverVersion, codeLens) {
        var isLocalValid = this.semver.valid(localVersion);
        var isLocalValidRange = this.semver.validRange(localVersion);
        var isServerValid = this.semver.valid(serverVersion);
        var isServerValidRange = this.semver.validRange(serverVersion);
        if (!isLocalValid && !isLocalValidRange && localVersion !== 'latest')
            return this.makeErrorCommand("Invalid semver version entered", codeLens);
        if (!isServerValid && !isServerValidRange && serverVersion !== 'latest')
            return this.makeErrorCommand("Invalid semver server version received, " + serverVersion, codeLens);
        if (localVersion === 'latest')
            return this.makeLatestCommand(codeLens);
        if (isLocalValidRange && !isLocalValid) {
            if (this.semver.satisfies(serverVersion, localVersion)) {
                try {
                    var matches = utils_1.stripSymbolFromVersionRegex.exec(localVersion);
                    var cleanLocalVersion = (matches && matches[1]) || this.semver.clean(localVersion) || localVersion;
                    if (cleanLocalVersion && this.semver.eq(serverVersion, cleanLocalVersion)) {
                        return this.makeSatisfiedCommand(serverVersion, codeLens);
                    }
                }
                catch (ex) {
                    return this.makeSatisfiedCommand(serverVersion, codeLens);
                }
                return this.makeSatisfiedWithNewerCommand(serverVersion, codeLens);
            }
            else
                return this.makeNewVersionCommand(serverVersion, codeLens);
        }
        var hasNewerVersion = this.semver.gt(serverVersion, localVersion) === true
            || this.semver.lt(serverVersion, localVersion) === true;
        if (serverVersion !== localVersion && hasNewerVersion)
            return this.makeNewVersionCommand(serverVersion, codeLens);
        return this.makeLatestCommand(codeLens);
    };
    CommandFactory.prototype.makeNewVersionCommand = function (newVersion, codeLens) {
        var prefix = this.appConfig.versionPrefix;
        var replaceWithVersion = codeLens.generateNewVersion(newVersion);
        if (!replaceWithVersion.startsWith(prefix))
            replaceWithVersion = "" + prefix + replaceWithVersion;
        return codeLens.setCommand(this.appConfig.updateIndicator + " " + this.appConfig.versionPrefix + newVersion, "_" + this.appConfig.extentionName + ".updateDependencyCommand", [codeLens, ("\"" + replaceWithVersion + "\"")]);
    };
    CommandFactory.prototype.makeSatisfiedCommand = function (serverVersion, codeLens) {
        return codeLens.setCommand("satisfies v" + serverVersion);
    };
    CommandFactory.prototype.makeSatisfiedWithNewerCommand = function (serverVersion, codeLens) {
        var prefix = this.appConfig.versionPrefix;
        var replaceWithVersion = codeLens.generateNewVersion(serverVersion);
        if (!replaceWithVersion.startsWith(prefix))
            replaceWithVersion = "" + prefix + replaceWithVersion;
        return codeLens.setCommand(this.appConfig.updateIndicator + " satisfies v" + serverVersion, "_" + this.appConfig.extentionName + ".updateDependencyCommand", [codeLens, ("\"" + replaceWithVersion + "\"")]);
    };
    CommandFactory.prototype.makeLatestCommand = function (codeLens) {
        return codeLens.setCommand('latest');
    };
    CommandFactory.prototype.makeTagCommand = function (tag, codeLens) {
        return codeLens.setCommand(tag);
    };
    CommandFactory.prototype.makeUpdateDependenciesCommand = function (propertyName, codeLens, codeLenCollection) {
        return codeLens.setCommand(this.appConfig.updateIndicator + " Update " + propertyName, "_" + this.appConfig.extentionName + ".updateDependenciesCommand", [codeLens, codeLenCollection]);
    };
    CommandFactory.prototype.makeLinkCommand = function (codeLens) {
        var isFile = codeLens.package.meta.type === 'file';
        var title;
        var cmd = "_" + this.appConfig.extentionName + ".linkCommand";
        if (isFile) {
            var filePath = this.path.resolve(this.path.dirname(codeLens.documentUrl.fsPath), codeLens.package.meta.remoteUrl);
            var fileExists = this.fs.existsSync(filePath);
            if (fileExists == false)
                title = (cmd = null) || 'Specified resource does not exist';
            else
                title = this.appConfig.openNewWindowIndicator + " " + codeLens.package.version;
        }
        else
            title = this.appConfig.openNewWindowIndicator + " " + codeLens.package.meta.remoteUrl;
        return codeLens.setCommand(title, cmd, [codeLens]);
    };
    CommandFactory.prototype.makeGithubCommand = function (codeLens) {
        var _this = this;
        var meta = codeLens.package.meta;
        var fnName = "getLatest" + meta.category;
        return this.githubRequest[fnName](meta.userRepo)
            .then(function (entry) {
            if (!entry)
                return _this.makeTagCommand(meta.category + ": none", codeLens);
            if (meta.commitish === '' ||
                (utils_1.semverLeadingChars.includes(meta.commitish[0]) ? meta.commitish[0] : '') + entry.version === meta.commitish)
                return _this.makeTagCommand(meta.category + ": latest", codeLens);
            var newVersion = codeLens.generateNewVersion(entry.version);
            return codeLens.setCommand(meta.category + ": " + _this.appConfig.updateIndicator + " " + entry.version, "_" + _this.appConfig.extentionName + ".updateDependencyCommand", [codeLens, ("\"" + newVersion + "\"")]);
        })
            .catch(function (error) {
            if (error.rateLimitExceeded)
                return _this.makeTagCommand('Rate limit exceeded', codeLens);
            if (error.notFound)
                return _this.makeTagCommand('Resource not found', codeLens);
            return Promise.reject(error);
        });
    };
    CommandFactory = __decorate([
        di_1.inject('fs', 'path', 'semver', 'githubRequest', 'appConfig')
    ], CommandFactory);
    return CommandFactory;
}());
exports.CommandFactory = CommandFactory;
//# sourceMappingURL=commandFactory.js.map