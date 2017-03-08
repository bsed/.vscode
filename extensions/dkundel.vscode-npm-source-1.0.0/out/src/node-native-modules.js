"use strict";
exports.NativeModules = [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'crypto',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'punycode',
    'querystring',
    'readline',
    'stream',
    'string_decoder',
    'tls',
    'dgram',
    'url',
    'util',
    'vm',
    'zlib'
];
function getApiUrl(packageName) {
    return "https://nodejs.org/api/" + packageName + ".html";
}
exports.getApiUrl = getApiUrl;
//# sourceMappingURL=node-native-modules.js.map