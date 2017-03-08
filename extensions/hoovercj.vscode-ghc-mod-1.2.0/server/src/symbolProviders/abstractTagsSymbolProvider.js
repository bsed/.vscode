"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const cp = require('child_process');
class AbstractTagsSymbolProvider {
    constructor(executable, workspaceRoot, logger) {
        this.executable = executable;
        this.workspaceRoot = workspaceRoot;
        this.logger = logger;
    }
    getSymbolsForFile(documentSymbolParams) {
        let command = this.getFileSymbolsCommand(documentSymbolParams);
        return this.getSymbols(command);
    }
    getSymbolsForWorkspace(options, cancellationToken) {
        let command = this.getWorkspaceSymbolsCommand();
        return this.getSymbols(command).then(symbols => {
            return symbols.filter(documentSymbol => {
                return documentSymbol.name.toLowerCase().indexOf(options.query.toLowerCase()) >= 0;
            });
        });
    }
    getSymbols(command) {
        return new Promise((resolve, reject) => {
            this.logger.log(command);
            cp.exec(command, (error, stdout, stderr) => {
                let errorMessage = '';
                if (error) {
                    errorMessage += JSON.stringify(error);
                    errorMessage += '\n';
                }
                if (stderr) {
                    errorMessage += stderr.toString();
                }
                if (errorMessage) {
                    this.logger.error(errorMessage);
                    resolve([]);
                }
                this.logger.log(stdout.toString('UTF8'));
                resolve(this.parseTags(stdout.toString('UTF8')));
            });
        });
    }
}
exports.AbstractTagsSymbolProvider = AbstractTagsSymbolProvider;
//# sourceMappingURL=abstractTagsSymbolProvider.js.map