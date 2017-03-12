'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const gitProvider_1 = require("../gitProvider");
const quickPicks_1 = require("./quickPicks");
const moment = require("moment");
const path = require("path");
class CommitQuickPickItem {
    constructor(commit, descriptionSuffix = '') {
        this.commit = commit;
        this.label = `${commit.author}, ${moment(commit.date).fromNow()}`;
        this.description = `\u00a0 \u2014 \u00a0\u00a0 $(git-commit) ${commit.sha}${descriptionSuffix}`;
        this.detail = commit.message;
    }
}
exports.CommitQuickPickItem = CommitQuickPickItem;
class CommitWithFileStatusQuickPickItem extends quickPicks_1.OpenFileCommandQuickPickItem {
    constructor(commit, fileName, status) {
        const icon = gitProvider_1.getGitStatusIcon(status);
        let directory = path.dirname(fileName);
        if (!directory || directory === '.') {
            directory = undefined;
        }
        super(gitProvider_1.GitProvider.toGitContentUri(commit.sha, fileName, commit.repoPath, commit.originalFileName), {
            label: `\u00a0\u00a0\u00a0\u00a0${icon}\u00a0\u00a0 ${path.basename(fileName)}`,
            description: directory
        });
        this.fileName = fileName;
        this.gitUri = new gitProvider_1.GitUri(vscode_1.Uri.file(path.resolve(commit.repoPath, fileName)));
        this.sha = commit.sha;
        this.status = status;
    }
}
exports.CommitWithFileStatusQuickPickItem = CommitWithFileStatusQuickPickItem;
//# sourceMappingURL=gitQuickPicks.js.map