function isNullOrEmpty(s) {
    return s == null || s == "";
}
exports.isNullOrEmpty = isNullOrEmpty;
function startsWith(s, startsWith) {
    return !isNullOrEmpty(s) && !isNullOrEmpty(startsWith) && s.indexOf(startsWith) == 0;
}
exports.startsWith = startsWith;
//# sourceMappingURL=utils.js.map