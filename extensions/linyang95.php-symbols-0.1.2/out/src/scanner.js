/**
 * Copyright (C) 2016 Yang Lin (MIT License)
 * @author Yang Lin <linyang95@aol.com>
 */
"use strict";
var fs = require('fs');
// import 'process';
var NIL = '';
var regExp = {
    LABEL: /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
    TOKENS: /[;:,.\[\]()|^&+-/*=%!~$<>?@]/,
    NEWLINE: /(\r|\n|\r\n)/,
    TABS_AND_SPACES: /[ \t]*/,
    WHITESPACE: /[ \n\r\t]+/,
    FUNCTION: /^(function)$/i,
    CLASS: /^(class)$/i
};
var lexerEnum;
(function (lexerEnum) {
    lexerEnum[lexerEnum["LABEL"] = 0] = "LABEL";
    lexerEnum[lexerEnum["TOKENS"] = 1] = "TOKENS";
    lexerEnum[lexerEnum["NEWLINE"] = 2] = "NEWLINE";
    lexerEnum[lexerEnum["TABS_AND_SPACES"] = 3] = "TABS_AND_SPACES";
    lexerEnum[lexerEnum["WHITESPACE"] = 4] = "WHITESPACE";
})(lexerEnum || (lexerEnum = {}));
(function (tokenEnum) {
    tokenEnum[tokenEnum["T_OPEN_TAG"] = 0] = "T_OPEN_TAG";
    tokenEnum[tokenEnum["T_CLOSE_TAG"] = 1] = "T_CLOSE_TAG";
    tokenEnum[tokenEnum["T_FUNCTION"] = 2] = "T_FUNCTION";
    tokenEnum[tokenEnum["T_CLASS"] = 3] = "T_CLASS";
})(exports.tokenEnum || (exports.tokenEnum = {}));
var tokenEnum = exports.tokenEnum;
var stateEnum;
(function (stateEnum) {
    stateEnum[stateEnum["IN_SCRIPTING"] = 0] = "IN_SCRIPTING";
    stateEnum[stateEnum["LOOKING_FOR_PROPERTY"] = 1] = "LOOKING_FOR_PROPERTY";
    stateEnum[stateEnum["BACKQUOTE"] = 2] = "BACKQUOTE";
    stateEnum[stateEnum["DOUBLE_QUOTES"] = 3] = "DOUBLE_QUOTES";
    stateEnum[stateEnum["HEREDOC"] = 4] = "HEREDOC";
    stateEnum[stateEnum["LOOKING_FOR_VARNAME"] = 5] = "LOOKING_FOR_VARNAME";
    stateEnum[stateEnum["VAR_OFFSET"] = 6] = "VAR_OFFSET";
    stateEnum[stateEnum["INITIAL"] = 7] = "INITIAL";
    stateEnum[stateEnum["END_HEREDOC"] = 8] = "END_HEREDOC";
    stateEnum[stateEnum["NOWDOC"] = 9] = "NOWDOC";
})(stateEnum || (stateEnum = {}));
var Scanner = (function () {
    function Scanner(file, callback) {
        var _this = this;
        this.init();
        var readable = fs.createReadStream(file, {
            encoding: 'utf8'
        });
        readable.on('data', function (chunk) {
            readable.pause();
            var pos = 0;
            var len = chunk.length;
            while (pos <= len) {
                _this.scan(chunk[pos]);
                pos++;
            }
            readable.resume();
        });
        readable.on('end', function () {
            callback(_this.codeSymbols);
            // console.log(this.lexerStack.length);
            // console.log(JSON.stringify(this.codeSymbols));
            // console.log(JSON.stringify(this.expectTokenStack));
            // console.log(this.stateStack);
            // console.log(process.memoryUsage());
        });
    }
    Scanner.prototype.init = function () {
        this.text = NIL;
        this.stateStack = [];
        this.expectTokenStack = [];
        this.lexerStack = [];
        this.codeSymbols = [];
        this.lineNo = 1;
        this.column = 0;
        this.level = 0;
        this.setState(stateEnum.INITIAL);
    };
    Scanner.prototype.debug = function (msg) {
        console.log("line " + this.lineNo + " : " + msg);
    };
    Scanner.prototype.setState = function (s) {
        // this.debug("setState " + stateEnum[s]);
        this.state = s;
        this.stateStack.push(s);
    };
    Scanner.prototype.popState = function () {
        this.stateStack.pop();
        this.state = this.stateStack[this.stateStack.length - 1];
        // this.debug("popState " + stateEnum[this.state]);
    };
    Scanner.prototype.isState = function (s) {
        return this.state == s;
    };
    Scanner.prototype.isNotState = function (s) {
        return this.state != s;
    };
    Scanner.prototype.pushExpectToken = function (t) {
        this.expectTokenStack.push(t);
    };
    Scanner.prototype.pushLexerStack = function (type) {
        var _this = this;
        // this.debug("pushLexerStack: " + this.text);
        this.lexerStack.push({
            text: this.text,
            lineNo: this.lineNo,
            type: type,
            col: this.column,
            level: this.level
        });
        var temp = this.expectTokenStack;
        var find;
        this.expectTokenStack.forEach(function (v, i) {
            switch (v) {
                case tokenEnum.T_CLASS:
                case tokenEnum.T_FUNCTION:
                    find = _this.lexerStack[_this.lexerStack.length - 1];
                    _this.pushCodeSymbols(find, v);
                    temp = temp.slice(i + 1, 1);
                    break;
                default:
                    break;
            }
        });
        this.expectTokenStack = temp;
        switch (this.text.toLowerCase()) {
            case 'function':
                if (this.isState(stateEnum.IN_SCRIPTING))
                    this.pushExpectToken(tokenEnum.T_FUNCTION);
                break;
            case 'class':
                if (this.isState(stateEnum.IN_SCRIPTING))
                    this.pushExpectToken(tokenEnum.T_CLASS);
                break;
        }
    };
    Scanner.prototype.pushCodeSymbols = function (l, type) {
        this.codeSymbols.push({
            text: l.text,
            lineNo: l.lineNo,
            start: Math.max(0, l.col - l.text.length),
            end: l.col,
            type: type,
            level: l.level
        });
    };
    Scanner.prototype.scan = function (bit) {
        var _this = this;
        this.column++;
        var tmpExpectTokenStack = this.expectTokenStack;
        tmpExpectTokenStack.forEach(function (v, i) {
            var action = false;
            switch (v) {
                case tokenEnum.T_OPEN_TAG:
                    if (_this.text == '<?') {
                        _this.setState(stateEnum.IN_SCRIPTING);
                    }
                    if (_this.text.length >= 2) {
                        action = true;
                    }
                    break;
                case tokenEnum.T_CLOSE_TAG:
                    if (_this.text == '?>') {
                        _this.setState(stateEnum.INITIAL);
                    }
                    if (_this.text.length >= 2) {
                        action = true;
                    }
                    break;
                default:
                    break;
            }
            if (action) {
                _this.expectTokenStack = tmpExpectTokenStack.splice(i + 1, 1);
            }
        });
        if (regExp.TOKENS.test(bit)) {
            switch (bit) {
                case '<':
                    if (this.isState(stateEnum.INITIAL))
                        this.pushExpectToken(tokenEnum.T_OPEN_TAG);
                    break;
                case '?':
                    if (this.isState(stateEnum.IN_SCRIPTING))
                        this.pushExpectToken(tokenEnum.T_CLOSE_TAG);
                    break;
                case '{':
                case '}':
                case '(':
                    if (this.isState(stateEnum.IN_SCRIPTING)) {
                        if (regExp.LABEL.test(this.text)) {
                            this.pushLexerStack(lexerEnum.LABEL);
                        }
                        else {
                            var token = this.expectTokenStack[this.expectTokenStack.length - 1];
                            if (token == tokenEnum.T_FUNCTION) {
                                this.expectTokenStack.pop();
                            }
                        }
                        bit = '';
                        this.text = NIL;
                    }
                    break;
                default:
                    break;
            }
        }
        if (regExp.WHITESPACE.test(bit)) {
            if (regExp.LABEL.test(this.text)) {
                this.pushLexerStack(lexerEnum.LABEL);
                this.text = NIL;
            }
        }
        else {
            this.text += bit;
        }
        if (/\n/.test(bit)) {
            this.lineNo++;
            this.column = 0;
            this.text = NIL;
        }
    };
    return Scanner;
}());
exports.Scanner = Scanner;
//# sourceMappingURL=scanner.js.map