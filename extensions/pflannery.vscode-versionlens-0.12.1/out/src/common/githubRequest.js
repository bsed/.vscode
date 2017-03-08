"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Peter Flannery. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var di_1 = require('./di');
var cacheMap_1 = require('./cacheMap');
var GithubRequest = (function () {
    function GithubRequest() {
        this.cache = new cacheMap_1.CacheMap();
        this.headers = {
            accept: 'application\/vnd.github.v3+json',
            'user-agent': 'vscode-contrib/vscode-versionlens'
        };
    }
    GithubRequest.prototype.getCommitBySha = function (userRepo, sha) {
        return this.httpGet(userRepo, "commits/" + sha)
            .then(function (firstEntry) {
            return {
                sha: firstEntry.sha,
                date: firstEntry.commit.committer.date
            };
        });
    };
    GithubRequest.prototype.getLatestCommit = function (userRepo) {
        return this.httpGet(userRepo, 'commits', { page: 1, per_page: 1 })
            .then(function (entries) {
            var firstEntry = entries[0];
            return {
                category: 'commit',
                version: firstEntry.sha.substring(0, 7)
            };
        });
    };
    GithubRequest.prototype.getLatestPreRelease = function (userRepo) {
        return this.httpGet(userRepo, 'releases/latest')
            .then(function (result) {
            if (Array.isArray(result))
                result = result[0];
            return result && {
                category: 'prerelease',
                version: result.tag_name
            };
        });
    };
    GithubRequest.prototype.getLatestRelease = function (userRepo) {
        return this.httpGet(userRepo, 'releases', { page: 1, per_page: 1 })
            .then(function (result) {
            if (Array.isArray(result))
                result = result[0];
            return result && {
                category: 'release',
                version: result.tag_name
            };
        });
    };
    GithubRequest.prototype.getLatestTag = function (userRepo) {
        var _this = this;
        return this.httpGet(userRepo, 'tags', { page: 1, per_page: 1 })
            .then(function (entries) {
            if (!entries || entries.length === 0)
                return null;
            var firstEntry = entries[0];
            return _this.getCommitBySha(userRepo, firstEntry.commit.sha)
                .then(function (entry) { return ({ category: 'tag', version: firstEntry.name }); });
        });
    };
    GithubRequest.prototype.repoExists = function (userRepo) {
        return this.httpHead(userRepo)
            .then(function (resp) { return true; })
            .catch(function (resp) { return resp.status !== 403; });
    };
    GithubRequest.prototype.httpGet = function (userRepo, category, queryParams) {
        var _this = this;
        return this.request('GET', userRepo, category, queryParams)
            .catch(function (error) {
            // handles any 404 errors during a request for the latest release
            if (error.status = 404 && category === 'releases/latest') {
                return _this.cache.set(url, null);
            }
            // check if the request was not found and report back
            error.notFound = (error.status = 404 &&
                error.data.message.includes('Not Found'));
            // check if we have exceeded the rate limit
            error.rateLimitExceeded = (error.status = 403 &&
                error.data.message.includes('API rate limit exceeded'));
            // reject all other errors
            return Promise.reject(error);
        });
    };
    GithubRequest.prototype.httpHead = function (userRepo) {
        return this.request('HEAD', userRepo, null, null);
    };
    GithubRequest.prototype.request = function (method, userRepo, category, queryParams) {
        var _this = this;
        if (this.appConfig.githubAccessToken) {
            !queryParams && (queryParams = {});
            queryParams["access_token"] = this.appConfig.githubAccessToken;
        }
        var url = generateGithubUrl(userRepo, category, queryParams);
        var cacheKey = method + '_' + url;
        if (this.cache.expired(url) === false)
            return Promise.resolve(this.cache.get(cacheKey));
        return this.httpRequest.xhr({ url: url, type: method, headers: this.headers })
            .then(function (response) {
            return _this.cache.set(cacheKey, response.responseText && JSON.parse(response.responseText));
        })
            .catch(function (response) {
            return Promise.reject({
                status: response.status,
                data: _this.cache.set(cacheKey, JSON.parse(response.responseText))
            });
        });
    };
    GithubRequest = __decorate([
        di_1.inject('httpRequest', 'appConfig')
    ], GithubRequest);
    return GithubRequest;
}());
exports.GithubRequest = GithubRequest;
function generateGithubUrl(userRepo, path, queryParams) {
    var query = '';
    if (queryParams)
        query = '?' + Object.keys(queryParams)
            .map(function (key) { return (key + "=" + queryParams[key]); })
            .join('&');
    return "https://api.github.com/repos/" + userRepo + "/" + path + query;
}
//# sourceMappingURL=githubRequest.js.map