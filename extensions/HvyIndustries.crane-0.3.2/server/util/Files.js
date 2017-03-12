/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class Files {
    static getPathFromUri(uri) {
        var path = uri;
        path = path.replace("file:///", "");
        path = path.replace("%3A", ":");
        // Handle Windows and Unix paths
        switch (process.platform) {
            case 'darwin':
            case 'linux':
                path = "/" + path;
                break;
            case 'win32':
                path = path.replace(/\//g, "\\");
                break;
        }
        return path;
    }
    static getUriFromPath(path) {
        path = path.replace(":", "%3A");
        let pathStart = "file://";
        // Handle Windows paths with backslashes
        switch (process.platform) {
            case 'win32':
                path = path.replace(/\\/g, "\/");
                pathStart = "file:///";
                break;
        }
        path = pathStart + path;
        return path;
    }
}
exports.Files = Files;
//# sourceMappingURL=Files.js.map