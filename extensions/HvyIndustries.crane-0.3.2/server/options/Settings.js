/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
/**
 * List of default settings
 */
class Settings {
    constructor() {
        this.debugMode = false;
        this.phpstubsZipFile = "https://codeload.github.com/HvyIndustries/crane-php-stubs/zip/master";
        this.maxSuggestionSize = 1024;
        this.exclude = [".git", ".svn", "node_modules"];
        this.include = ["./"];
        this.extensions = ['*.php', '*.php3', '*.php5', '*.phtml', '*.inc', '*.class', '*.req'];
        this.scanVars = true;
        this.scanExpr = true;
        this.encoding = "utf8";
        this.forkWorker = -1;
        this.enableCache = true;
        this.cacheByFileDate = true;
        this.cacheByFileSize = true;
        this.cacheByFileHash = true;
        this.php7 = true;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Settings;
//# sourceMappingURL=Settings.js.map