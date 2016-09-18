"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var Files;
(function (Files) {
    let Path = require('path');
    function filepathToUri(filepath, workspaceRoot) {
        if (!Path.isAbsolute(filepath)) {
            filepath = Path.join(workspaceRoot || '', filepath || '');
        }
        return `file:///${filepath.replace('\\', '/')}`;
    }
    Files.filepathToUri = filepathToUri;
})(Files = exports.Files || (exports.Files = {}));
//# sourceMappingURL=files.js.map