/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class PhpOnTypeFormattingProvider {
    provideOnTypeFormattingEdits(document, position, ch, options, token) {
        return new Promise((resolve, reject) => {
            let line = document.lineAt(position.line);
            resolve();
        });
    }
}
exports.default = PhpOnTypeFormattingProvider;
//# sourceMappingURL=PhpOnTypeFormattingProvider.js.map