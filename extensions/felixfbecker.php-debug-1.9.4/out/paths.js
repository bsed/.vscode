'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.convertDebuggerPathToClient = convertDebuggerPathToClient;
exports.convertClientPathToDebugger = convertClientPathToDebugger;
exports.isSameUri = isSameUri;

var _urlRelative = require('url-relative');

var _urlRelative2 = _interopRequireDefault(_urlRelative);

var _fileUrl = require('file-url');

var _fileUrl2 = _interopRequireDefault(_fileUrl);

var _url = require('url');

var url = _interopRequireWildcard(_url);

var _path = require('path');

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** converts a server-side XDebug file URI to a local path for VS Code with respect to source root settings */
function convertDebuggerPathToClient(fileUri, localSourceRoot, serverSourceRoot) {
    if (typeof fileUri === 'string') {
        fileUri = url.parse(fileUri);
    }
    // convert the file URI to a path
    let serverPath = decodeURI(fileUri.pathname);
    // strip the trailing slash from Windows paths (indicated by a drive letter with a colon)
    const serverIsWindows = /^\/[a-zA-Z]:\//.test(serverPath);
    if (serverIsWindows) {
        serverPath = serverPath.substr(1);
    }
    let localPath;
    if (serverSourceRoot && localSourceRoot) {
        // get the part of the path that is relative to the source root
        const pathRelativeToSourceRoot = (serverIsWindows ? path.win32 : path.posix).relative(serverSourceRoot, serverPath);
        // resolve from the local source root
        localPath = path.resolve(localSourceRoot, pathRelativeToSourceRoot);
    } else {
        localPath = path.normalize(serverPath);
    }
    return localPath;
}
/** converts a local path from VS Code to a server-side XDebug file URI with respect to source root settings */
function convertClientPathToDebugger(localPath, localSourceRoot, serverSourceRoot) {
    let localFileUri = (0, _fileUrl2.default)(localPath, { resolve: false });
    let serverFileUri;
    if (serverSourceRoot && localSourceRoot) {
        let localSourceRootUrl = (0, _fileUrl2.default)(localSourceRoot, { resolve: false });
        if (!localSourceRootUrl.endsWith('/')) {
            localSourceRootUrl += '/';
        }
        let serverSourceRootUrl = (0, _fileUrl2.default)(serverSourceRoot, { resolve: false });
        if (!serverSourceRootUrl.endsWith('/')) {
            serverSourceRootUrl += '/';
        }
        // get the part of the path that is relative to the source root
        const urlRelativeToSourceRoot = (0, _urlRelative2.default)(localSourceRootUrl, localFileUri);
        // resolve from the server source root
        serverFileUri = url.resolve(serverSourceRootUrl, urlRelativeToSourceRoot);
    } else {
        serverFileUri = localFileUri;
    }
    return serverFileUri;
}
function isSameUri(clientUri, debuggerUri) {
    if (/^file:\/\/\/[a-zA-Z]:\//.test(debuggerUri)) {
        // compare case-insensitive on Windows
        return debuggerUri.toLowerCase() === clientUri.toLowerCase();
    } else {
        return debuggerUri === clientUri;
    }
}
//# sourceMappingURL=paths.js.map
