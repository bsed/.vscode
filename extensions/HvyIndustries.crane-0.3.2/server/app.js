/*!
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
const events = require("events");
const Settings_1 = require("./options/Settings");
const php_reflection_1 = require("php-reflection");
/**
 * The main application instance
 */
class App extends events.EventEmitter {
    /**
     * Initialize the workspace
     */
    constructor(path, settings = null) {
        super();
        this.setPath(path);
        this.setSettings(settings || new Settings_1.default());
    }
    /**
     * Make an absolute path relative to current root repository
     */
    resolveUri(uri) {
        let filename = uri;
        if (filename.substring(0, 7) === 'file://') {
            filename = filename.substring(7);
        }
        if (filename.startsWith(this.path)) {
            filename = filename.substring(this.path.length);
            if (filename[0] === '/') {
                filename = filename.substring(1);
            }
        }
        return filename;
    }
    /**
     * Changing the current path
     */
    setPath(path) {
        this.path = path;
        if (this.settings) {
            // rebuilds the workspace
            this.setSettings(this.settings);
        }
    }
    /**
     * Update settings
     */
    setSettings(settings) {
        this.settings = settings;
        this.workspace = new php_reflection_1.Repository(this.path, {
            // @todo : bind parameters
            cacheByFileHash: true,
            lazyCache: function (type, name) {
            }
        });
        // forward events :
        this.workspace.on('read', this.emit.bind(this, ['read']));
        this.workspace.on('cache', this.emit.bind(this, ['cache']));
        this.workspace.on('parse', this.emit.bind(this, ['parse']));
        this.workspace.on('error', this.emit.bind(this, ['error']));
        this.workspace.on('progress', this.emit.bind(this, ['progress']));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
//# sourceMappingURL=app.js.map