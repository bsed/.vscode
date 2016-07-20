/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var path = require("path");
var fs = require("fs");
var ComposerContext = (function () {
    function ComposerContext(rootPath) {
        var _this = this;
        this._isComposerProject = false;
        this._isComposerProject = false;
        if (typeof (rootPath) !== 'undefined') {
            var composerJsonPath_1 = path.join(rootPath, 'composer.json');
            fs.access(composerJsonPath_1, function (err) {
                _this._composerJsonPath = composerJsonPath_1;
                _this._isComposerProject = true;
            });
        }
    }
    Object.defineProperty(ComposerContext.prototype, "composerJsonPath", {
        get: function () {
            return this._composerJsonPath;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComposerContext.prototype, "isComposerProject", {
        get: function () {
            return this._isComposerProject;
        },
        enumerable: true,
        configurable: true
    });
    return ComposerContext;
}());
exports.ComposerContext = ComposerContext;
//# sourceMappingURL=composercontext.js.map