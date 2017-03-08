/**
 * Copyright (c) Hvy Industries. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 */
"use strict";
/**
 * With a context resolves everything
 */
class Context {
    /**
     * Retrieves current state from the specified offset
     */
    constructor(text, offset) {
        this.text = text;
        this.offset = offset;
        this.char = text[offset];
        if (this.char === '$' || this.char === ' ') {
            this.word = '';
            this.prefix = this.consumeWord(offset - 1);
        }
        else {
        }
        this.word =
        ;
        for (; i > 0; i--) {
            const ch = text[i];
            if (ch === '\r' || '\n') {
                // ignore line breaks
                return;
            }
            if (ch !== ' ' && ch !== '\t') {
                // strip white spaces
                break;
            }
        }
        for (; i > 0; i--) {
            const ch = text.charCodeAt(i);
            if (!((ch > 96 && ch < 123)
                || (ch > 64 && ch < 91)
                || ch === 95
                || (ch > 47 && ch < 58)
                || ch > 126)) {
                break;
            }
        }
        this.word = text.substring(i, offset).trim();
    }
    consumeWord(position) {
        let result = '';
        return result;
    }
    /**
     * Checks if is in a namespace context
     */
    inNamespace() {
        return this.scope.namespace !== null;
    }
    /**
     * Checks if is in a class/trait context
     */
    inClassOrTrait() {
        return this.scope.class !== null || this.scope.trait !== null;
    }
    /**
     * Checks if is in a method context
     */
    inMethod() {
        return this.inClassOrTrait() && this.scope.method !== null;
    }
    /**
     * Resolves the current context
     */
    resolve(app, filename, offset) {
        return new Promise((done, reject) => {
            app.message.trace('Autocomplete from ' + offset + ' @ "' + this.char + '" / ' + this.word);
            // search the file
            let file = app.workspace.getFile(filename);
            if (!file) {
                return app.workspace.sync(filename, this.text).then((file) => {
                    this.scope = file.getScope(offset);
                    done();
                });
            }
            this.scope = file.getScope(offset);
            done();
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Context;
//# sourceMappingURL=Context.js.map