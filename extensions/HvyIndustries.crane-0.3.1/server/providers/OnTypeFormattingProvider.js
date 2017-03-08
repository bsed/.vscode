/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Hvy Industries. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *  "HVY", "HVY Industries" and "Hvy Industries" are trading names of JCKD (UK) Ltd
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class OnTypeFormattingProvider {
}
function activate(ctx) {
    ctx.subscriptions.push(vscode.languages.registerOnTypeFormattingEditProvider(GO_MODE, new OnTypeFormattingProvider()));
}
exports.activate = activate;
//# sourceMappingURL=OnTypeFormattingProvider.js.map