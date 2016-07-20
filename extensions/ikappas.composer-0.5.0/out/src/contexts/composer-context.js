/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var path = require("path");
var fs = require("fs");
var ComposerContext = (function () {
    function ComposerContext(rootPath) {
        this._isComposerProject = false;
        this._isComposerProject = false;
        if (rootPath !== null) {
            var composerJsonPath = path.join(rootPath, 'composer.json');
            if (fs.exists(composerJsonPath)) {
                this._composerJsonPath = composerJsonPath;
                this._isComposerProject = true;
            }
        }
    }
    return ComposerContext;
}());
exports.ComposerContext = ComposerContext;
//# sourceMappingURL=composer-context.js.map