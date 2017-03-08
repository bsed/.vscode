'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const system_1 = require("../system");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const gitProvider_1 = require("../gitProvider");
const path = require("path");
class GitUri extends vscode_1.Uri {
    constructor(uri, commit) {
        super();
        if (!uri)
            return;
        const base = this;
        base._scheme = uri.scheme;
        base._authority = uri.authority;
        base._path = uri.path;
        base._query = uri.query;
        base._fragment = uri.fragment;
        this.offset = 0;
        if (uri.scheme === constants_1.DocumentSchemes.GitLensGit) {
            const data = gitProvider_1.GitProvider.fromGitContentUri(uri);
            base._fsPath = data.originalFileName || data.fileName;
            this.offset = (data.decoration && data.decoration.split('\n').length) || 0;
            if (!gitProvider_1.Git.isUncommitted(data.sha)) {
                this.sha = data.sha;
                this.repoPath = data.repoPath;
            }
            else {
                base._fsPath = path.join(data.repoPath, base._fsPath);
            }
        }
        else if (commit) {
            base._fsPath = commit.originalFileName || commit.fileName;
            if (!gitProvider_1.Git.isUncommitted(commit.sha)) {
                this.sha = commit.sha;
                this.repoPath = commit.repoPath;
            }
            else {
                base._fsPath = path.join(commit.repoPath, base._fsPath);
            }
        }
    }
    fileUri() {
        return vscode_1.Uri.file(this.sha ? this.path : this.fsPath);
    }
    static fromUri(uri, git) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uri instanceof GitUri)
                return uri;
            const gitUri = git.getGitUriForFile(uri.fsPath);
            if (gitUri)
                return gitUri;
            if (uri.scheme === 'git' && uri.query === '~') {
                const log = yield git.getLogForFile(uri.fsPath, undefined, undefined, undefined, 1);
                const commit = log && system_1.Iterables.first(log.commits.values());
                if (commit)
                    return new GitUri(uri, commit);
            }
            return new GitUri(uri);
        });
    }
}
exports.GitUri = GitUri;
//# sourceMappingURL=gitUri.js.map