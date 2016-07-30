/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var goImport_1 = require('./goImport');
var _ = require('lodash');
var GoCodeActionProvider = (function () {
    function GoCodeActionProvider() {
    }
    GoCodeActionProvider.prototype.provideCodeActions = function (document, range, context, token) {
        var promises = context.diagnostics.map(function (diag) {
            // When a name is not found but could refer to a package, offer to add import 
            if (diag.message.indexOf('undefined: ') === 0) {
                var _a = /^undefined: (\S*)/.exec(diag.message), _1 = _a[0], name_1 = _a[1];
                return goImport_1.listPackages().then(function (packages) {
                    var commands = packages
                        .filter(function (pkg) { return pkg === name_1 || pkg.endsWith('/' + name_1); })
                        .map(function (pkg) {
                        return {
                            title: 'import "' + pkg + '"',
                            command: 'go.import.add',
                            arguments: [pkg]
                        };
                    });
                    return commands;
                });
            }
            return [];
        });
        return Promise.all(promises).then(function (arrs) {
            return _.sortBy(_.uniq(_.flatten(arrs), function (x) { return x.title; }), function (x) { return x.title; });
        });
    };
    return GoCodeActionProvider;
}());
exports.GoCodeActionProvider = GoCodeActionProvider;
//# sourceMappingURL=goCodeAction.js.map