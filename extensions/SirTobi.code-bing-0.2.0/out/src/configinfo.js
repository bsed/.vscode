// Config keys.
exports.keys = {
    useDefaultProviderOnly: "useDefaultProviderOnly",
    defaultProvider: "defaultProvider",
    noInputBoxIfTextSelected: "noInputBoxIfTextSelected",
    alwaysUseDefaultForSelection: "alwaysUseDefaultForSelection",
    searchProviders: "searchProviders"
};
// Depricated config keys.
exports.depricatedKeys = {
    searchprovider: "searchprovider"
};
// The config group for the extension.
exports.group = "codebing";
// Creates a command string
function command(cmdName) {
    return exports.group + "." + cmdName;
}
exports.command = command;
//# sourceMappingURL=configinfo.js.map