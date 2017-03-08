"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var di_1 = require('./common/di');
var appConfiguration_1 = require('./common/appConfiguration');
var commandFactory_1 = require('./providers/commandFactory');
var githubRequest_1 = require('./common/githubRequest');
var path = require('path');
var fs = require('fs');
var semver = require('semver');
var jsonParser = require('vscode-contrib-jsonc');
var httpRequest = require('request-light');
var npm = require('npm');
var bower = require('bower');
// external lib dependencies
di_1.register('path', path);
di_1.register('fs', fs);
di_1.register('semver', semver);
di_1.register('bower', bower);
di_1.register('npm', npm);
di_1.register('jsonParser', jsonParser);
di_1.register('httpRequest', httpRequest);
// app dependencies
di_1.register('appConfig', new appConfiguration_1.AppConfiguration());
di_1.register('commandFactory', new commandFactory_1.CommandFactory());
di_1.register('githubRequest', new githubRequest_1.GithubRequest());
exports.bootstrapLoaded = true;
//# sourceMappingURL=bootstrap.js.map