'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const git_1 = require("./git");
const path = require("path");
class GitCommit {
    constructor(repoPath, sha, fileName, author, date, message, lines, originalFileName, previousSha, previousFileName) {
        this.repoPath = repoPath;
        this.sha = sha;
        this.fileName = fileName;
        this.author = author;
        this.date = date;
        this.message = message;
        this.fileName = this.fileName.replace(/, ?$/, '');
        this.lines = lines || [];
        this.originalFileName = originalFileName;
        this.previousSha = previousSha;
        this.previousFileName = previousFileName;
    }
    get isUncommitted() {
        if (this._isUncommitted === undefined) {
            this._isUncommitted = git_1.default.isUncommitted(this.sha);
        }
        return this._isUncommitted;
    }
    get previousUri() {
        return this.previousFileName ? vscode_1.Uri.file(path.join(this.repoPath, this.previousFileName)) : this.uri;
    }
    get uri() {
        return vscode_1.Uri.file(path.join(this.repoPath, this.originalFileName || this.fileName));
    }
    getFormattedPath(separator = ' \u00a0\u2022\u00a0 ') {
        const directory = path.dirname(this.fileName);
        return (!directory || directory === '.')
            ? path.basename(this.fileName)
            : `${path.basename(this.fileName)}${separator}${directory}`;
    }
}
exports.GitCommit = GitCommit;
class GitLogCommit extends GitCommit {
    constructor(type, repoPath, sha, fileName, author, date, message, status, fileStatuses, lines, originalFileName, previousSha, previousFileName) {
        super(repoPath, sha, fileName, author, date, message, lines, originalFileName, previousSha, previousFileName);
        this.type = type;
        this.status = status;
        if (fileStatuses) {
            this.fileStatuses = fileStatuses.filter(_ => !!_.fileName);
        }
        else {
            this.fileStatuses = [{ status: status, fileName: fileName }];
        }
    }
    get nextUri() {
        return this.nextFileName ? vscode_1.Uri.file(path.join(this.repoPath, this.nextFileName)) : this.uri;
    }
}
exports.GitLogCommit = GitLogCommit;
class GitFileStatusItem {
    constructor(repoPath, status) {
        this.repoPath = repoPath;
        this.fileName = status.substring(3);
        this.parseStatus(status);
    }
    parseStatus(status) {
        const indexStatus = status[0].trim();
        const workTreeStatus = status[1].trim();
        this.staged = !!indexStatus;
        this.status = (indexStatus || workTreeStatus || 'U');
    }
}
exports.GitFileStatusItem = GitFileStatusItem;
const statusOcticonsMap = {
    '?': '$(diff-ignored)',
    A: '$(diff-added)',
    C: '$(diff-added)',
    D: '$(diff-removed)',
    M: '$(diff-modified)',
    R: '$(diff-renamed)',
    U: '$(question)'
};
function getGitStatusIcon(status, missing = '\u00a0\u00a0\u00a0\u00a0') {
    return statusOcticonsMap[status] || missing;
}
exports.getGitStatusIcon = getGitStatusIcon;
//# sourceMappingURL=gitEnrichment.js.map