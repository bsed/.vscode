'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const gitLocator_1 = require("./gitLocator");
const logger_1 = require("../logger");
const spawn_rx_1 = require("spawn-rx");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");
__export(require("./gitEnrichment"));
__export(require("./enrichers/blameParserEnricher"));
__export(require("./enrichers/logParserEnricher"));
let git;
const UncommittedRegex = /^[0]+$/;
const DefaultLogParams = [`log`, `--name-status`, `--full-history`, `-m`, `--date=iso8601-strict`, `--format=%H -%nauthor %an%nauthor-date %ai%ncommitter %cn%ncommitter-date %ci%nsummary %B%nfilename ?`];
function gitCommand(cwd, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const s = yield spawn_rx_1.spawnPromise(git.path, args, { cwd: cwd });
            logger_1.Logger.log('git', ...args, `  cwd='${cwd}'`);
            return s;
        }
        catch (ex) {
            const msg = ex && ex.toString();
            if (msg && (msg.includes('Not a git repository') || msg.includes('is outside repository') || msg.includes('no such path'))) {
                logger_1.Logger.warn('git', ...args, `  cwd='${cwd}'`, msg && `\n  ${msg.replace(/\r?\n|\r/g, ' ')}`);
            }
            else {
                logger_1.Logger.error('git', ...args, `  cwd='${cwd}'`, msg && `\n  ${msg.replace(/\r?\n|\r/g, ' ')}`);
            }
            throw ex;
        }
    });
}
exports.GitBlameFormat = {
    incremental: '--incremental',
    linePorcelain: '--line-porcelain',
    porcelain: '--porcelain'
};
class Git {
    static normalizePath(fileName, repoPath) {
        return fileName.replace(/\\/g, '/');
    }
    static splitPath(fileName, repoPath) {
        if (repoPath) {
            return [
                fileName.replace(repoPath.endsWith('/') ? repoPath : `${repoPath}/`, ''),
                repoPath
            ];
        }
        return [
            path.basename(fileName).replace(/\\/g, '/'),
            path.dirname(fileName).replace(/\\/g, '/')
        ];
    }
    static repoPath(cwd, gitPath) {
        return __awaiter(this, void 0, void 0, function* () {
            git = yield gitLocator_1.findGitPath(gitPath);
            logger_1.Logger.log(`Git found: ${git.version} @ ${git.path === 'git' ? 'PATH' : git.path}`);
            let data = yield gitCommand(cwd, 'rev-parse', '--show-toplevel');
            data = data.replace(/\r?\n|\r/g, '').replace(/\\/g, '/');
            return data;
        });
    }
    static blame(format, fileName, sha, repoPath) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        const params = [`blame`, `--root`, format];
        if (sha) {
            params.push(sha);
        }
        return gitCommand(root, ...params, `--`, file);
    }
    static blameLines(format, fileName, startLine, endLine, sha, repoPath) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        const params = [`blame`, `--root`, format, `-L ${startLine},${endLine}`];
        if (sha) {
            params.push(sha);
        }
        return gitCommand(root, ...params, `--`, file);
    }
    static diffDir(repoPath, sha1, sha2) {
        const params = [`difftool`, `--dir-diff`, sha1];
        if (sha2) {
            params.push(sha2);
        }
        return gitCommand(repoPath, ...params);
    }
    static diffStatus(repoPath, sha1, sha2) {
        const params = [`diff`, `--name-status`, `-M`];
        if (sha1) {
            params.push(sha1);
        }
        if (sha2) {
            params.push(sha2);
        }
        return gitCommand(repoPath, ...params);
    }
    static getVersionedFile(fileName, repoPath, sha) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Git.getVersionedFileText(fileName, repoPath, sha);
            const ext = path.extname(fileName);
            return new Promise((resolve, reject) => {
                tmp.file({ prefix: `${path.basename(fileName, ext)}-${sha}__`, postfix: ext }, (err, destination, fd, cleanupCallback) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    logger_1.Logger.log(`getVersionedFile(${fileName}, ${repoPath}, ${sha}); destination=${destination}`);
                    fs.appendFile(destination, data, err => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(destination);
                    });
                });
            });
        });
    }
    static getVersionedFileText(fileName, repoPath, sha) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        sha = sha.replace('^', '');
        if (Git.isUncommitted(sha))
            return Promise.reject(new Error(`sha=${sha} is uncommitted`));
        return gitCommand(root, 'show', `${sha}:./${file}`);
    }
    static gitInfo() {
        return git;
    }
    static log(fileName, sha, repoPath, maxCount, reverse = false) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        const params = [...DefaultLogParams, `--follow`];
        if (maxCount) {
            params.push(`-n${maxCount}`);
        }
        if (sha) {
            if (reverse) {
                params.push(`${sha}..HEAD`);
            }
            else {
                params.push(sha);
            }
            params.push(`--`);
        }
        return gitCommand(root, ...params, file);
    }
    static logRange(fileName, start, end, sha, repoPath, maxCount) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        const params = [...DefaultLogParams];
        if (maxCount) {
            params.push(`-n${maxCount}`);
        }
        if (sha) {
            params.push(`--follow`);
            params.push(sha);
        }
        params.push(`-L ${start},${end}:${file}`);
        return gitCommand(root, ...params);
    }
    static logRepo(repoPath, sha, maxCount) {
        const params = [...DefaultLogParams];
        if (maxCount) {
            params.push(`-n${maxCount}`);
        }
        if (sha) {
            params.push(`${sha}^!`);
        }
        return gitCommand(repoPath, ...params);
    }
    static statusFile(fileName, repoPath) {
        const [file, root] = Git.splitPath(Git.normalizePath(fileName), repoPath);
        const params = ['status', file, '--short'];
        return gitCommand(root, ...params);
    }
    static statusRepo(repoPath) {
        const params = ['status', '--short'];
        return gitCommand(repoPath, ...params);
    }
    static isUncommitted(sha) {
        return UncommittedRegex.test(sha);
    }
}
exports.default = Git;
//# sourceMappingURL=git.js.map