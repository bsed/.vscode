var path = require("path");
var ts = require("typescript");
var supportedNodeKinds = [
    214 /* ClassDeclaration */,
    141 /* PropertyDeclaration */,
    145 /* GetAccessor */,
    146 /* SetAccessor */,
    215 /* InterfaceDeclaration */,
    217 /* EnumDeclaration */,
    247 /* EnumMember */,
    213 /* FunctionDeclaration */,
    174 /* ArrowFunction */,
    143 /* MethodDeclaration */,
    142 /* MethodSignature */,
    140 /* PropertySignature */,
    144 /* Constructor */,
    173 /* FunctionExpression */];
function fixWinPath(filePath) {
    if (path.sep === "\\") {
        return filePath.replace(/\\/g, "/");
    }
    return filePath;
}
exports.fixWinPath = fixWinPath;
function findChildForPosition(node, position) {
    var lastMatchingNode;
    var findChildFunc = function (n) {
        var start = n.pos;
        var end = n.end;
        if (start > position) {
            return;
        }
        if (start <= position && end >= position) {
            lastMatchingNode = n;
        }
        n.getChildren().forEach(findChildFunc);
    };
    findChildFunc(node);
    return lastMatchingNode;
}
exports.findChildForPosition = findChildForPosition;
function findFirstChildOfKindDepthFirst(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = node.getChildren();
    for (var _i = 0; _i < children.length; _i++) {
        var c = children[_i];
        if (nodeIsOfKind(c, kinds)) {
            return c;
        }
        var matching = findFirstChildOfKindDepthFirst(c, kinds);
        if (matching) {
            return matching;
        }
    }
    return null;
}
exports.findFirstChildOfKindDepthFirst = findFirstChildOfKindDepthFirst;
function findChildrenOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = [];
    node.getChildren().forEach(function (c) {
        if (nodeIsOfKind(c, kinds)) {
            children.push(c);
        }
        children = children.concat(findChildrenOfKind(c, kinds));
    });
    return children;
}
exports.findChildrenOfKind = findChildrenOfKind;
function findNonVoidReturnInCurrentScope(node) {
    var returnNode;
    var children = node.getChildren();
    returnNode = children.find(function (n) { return n.kind === 204 /* ReturnStatement */; });
    if (returnNode) {
        if (returnNode.getChildren().length > 1) {
            return returnNode;
        }
    }
    for (var _i = 0; _i < children.length; _i++) {
        var child = children[_i];
        if (child.kind === 213 /* FunctionDeclaration */ || child.kind === 173 /* FunctionExpression */ || child.kind === 174 /* ArrowFunction */) {
            continue;
        }
        returnNode = findNonVoidReturnInCurrentScope(child);
        if (returnNode) {
            return returnNode;
        }
    }
    return returnNode;
}
exports.findNonVoidReturnInCurrentScope = findNonVoidReturnInCurrentScope;
function findVisibleChildrenOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = findChildrenOfKind(node, kinds);
    return children.filter(function (child) {
        if (child.modifiers && child.modifiers.find(function (m) { return m.kind === 110 /* PrivateKeyword */; })) {
            return false;
        }
        if (child.kind === 214 /* ClassDeclaration */ ||
            child.kind === 215 /* InterfaceDeclaration */ ||
            child.kind === 213 /* FunctionDeclaration */) {
            if (!child.modifiers || !child.modifiers.find(function (m) { return m.kind === 82 /* ExportKeyword */; })) {
                return false;
            }
        }
        return true;
    });
}
exports.findVisibleChildrenOfKind = findVisibleChildrenOfKind;
function nodeIsOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    return !!node && !!kinds.find(function (k) { return node.kind === k; });
}
exports.nodeIsOfKind = nodeIsOfKind;
function findFirstParent(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var parent = node.parent;
    while (parent) {
        if (nodeIsOfKind(parent, kinds)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}
exports.findFirstParent = findFirstParent;
var StringBuilder = (function () {
    function StringBuilder() {
        this._text = "";
    }
    StringBuilder.prototype.append = function (text) {
        if (text === void 0) { text = ""; }
        this._text += text;
    };
    StringBuilder.prototype.appendLine = function (text) {
        if (text === void 0) { text = ""; }
        this._text += text + "\n";
    };
    StringBuilder.prototype.toString = function () {
        return this._text;
    };
    StringBuilder.prototype.toCommentString = function (indent) {
        if (indent === void 0) { indent = ""; }
        var sb = new StringBuilder();
        sb.appendLine("/**");
        this._text.trim().split("\n").forEach(function (line) {
            sb.append(indent + " * ");
            sb.appendLine(line);
        });
        sb.appendLine(indent + " */");
        sb.append(indent);
        return sb.toString();
    };
    return StringBuilder;
})();
exports.StringBuilder = StringBuilder;
function formatTypeName(typeName) {
    typeName = typeName.trim();
    if (typeName === "") {
        return null;
    }
    if (typeName === "any") {
        return "{*}";
    }
    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }
    return "{" + typeName + "}";
}
exports.formatTypeName = formatTypeName;
//# sourceMappingURL=utilities.js.map