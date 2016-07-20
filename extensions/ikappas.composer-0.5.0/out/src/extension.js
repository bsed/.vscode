/*---------------------------------------------------------
 * Copyright (C) Ioannis Kappas. All rights reserved.
 *--------------------------------------------------------*/
"use strict";
var composer_extension_1 = require("./composer-extension");
function activate(context) {
    var composer = new composer_extension_1.ComposerExtension();
    context.subscriptions.push(composer);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map