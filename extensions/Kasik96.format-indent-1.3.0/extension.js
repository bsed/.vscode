var vscode = require('vscode');
var level = 0;
var LOOP_SIZE = 100;
var codeS;
var i = 0;
var out;
var infor, instring, incomment, forcount;

function format(document, range, options) {
  if (range === null) {
    var start = new vscode.Position(0, 0);
    var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
    range = new vscode.Range(start, end);
  }
  var result = [];
  var content = document.getText(range);

  var config = vscode.workspace.getConfiguration("editor");
  var tabSize = config.get("tabSize", "auto");

  var fieldPHP = new Array();
  var stringHTML = content.split('<?PHP').join('<?php');
  
  stringHTML = stringHTML.replace(/(^[ \t]*\n)/gm, 'llllllllllllll;');

  var nextNumber = -1;

  if (stringHTML.indexOf("<?php") > -1 && stringHTML.indexOf("?>") == -1) {
    stringHTML = Indentation(stringHTML, tabSize);
  } else {
    while (stringHTML.indexOf("<?php") != -1) {
      nextNumber++;
      var firstBracket = stringHTML.indexOf("<?php");
      var secondBracket = stringHTML.indexOf("?>");
      fieldPHP.push(stringHTML.substring(firstBracket, secondBracket + 2));
      var find = stringHTML.substring(firstBracket, secondBracket + 2);
      stringHTML = stringHTML.replace(find, "//Replace" + nextNumber);
    }
    for (var index = 0; index < fieldPHP.length; index++) {
      stringHTML = stringHTML.replace("//Replace" + index, Indentation(fieldPHP[index], tabSize));
    }
  }
  
  stringHTML = stringHTML.split('llllllllllllll;').join('');

  if (stringHTML) {
    result.push(new vscode.TextEdit(range, stringHTML));
  }

  return result;
}

function tabs() {
  var s = '';
  for (var j = 0; j < level; j++) s += '\t';
  return s;
}

var ownLine = ['area', 'body', 'head', 'hr', 'i?frame', 'link', 'meta',
  'noscript', 'style', 'table', 'tbody', 'thead', 'tfoot'];

var contOwnLine = ['li', 'dt', 'dt', 'h[1-6]', 'option', 'script'];

var lineBefore = new RegExp(
  '^<(/?' + ownLine.join('|/?') + '|' + contOwnLine.join('|') + ')[ >]'
);

var lineAfter = new RegExp(
  '^<(br|/?' + ownLine.join('|/?') + '|/' + contOwnLine.join('|/') + ')[ >]'
);

var newLevel = ['blockquote', 'div', 'dl', 'fieldset', 'form', 'frameset',
  'map', 'ol', 'p', 'pre', 'select', 'td', 'th', 'tr', 'ul'];
newLevel = new RegExp('^</?(' + newLevel.join('|') + ')[ >]');

function placeTag(tag, out2) {
  var nl = tag.match(newLevel);
  if (tag.match(lineBefore) || nl) {
    out2 = out2.replace(/\s*$/, '');
    out2 += "\n";
  }

  if (nl && '/' == tag.charAt(1)) level--;
  if ('\n' == out2.charAt(out2.length - 1)) out2 += tabs();
  if (nl && '/' != tag.charAt(1)) level++;

  out2 += tag;
  if (tag.match(lineAfter) || tag.match(newLevel)) {
    out2 = out2.replace(/ *$/, '');
    out2 += "\n";
  }
  return out2;
}

function Indentation(code, tabSize) {
  //code = code.replace(/^[\s\n]*/, '');
  //code = code.replace(/[\s\n]*$/, '');
  //code = code.replace(/[\n\r]+/g, '\n');

  out = tabs(), li = level, c = '';
  infor = false, forcount = 0, instring = false, incomment = false;
  i = 0;

  while (i < code.length) {
    cleanAsync(code);
  }

  level = li;
  //out = out.replace(/[\s\n]*$/, '');

  //out = out.replace(/\n\s*\n/g, '\n');
  //out = out.replace(/^[\s\n]*/, '');
  //out = out.replace(/[\s\n]*$/, '');
  level = 0;

  return out;
}

function cleanAsync(code) {
  var iStart = i;
  for (; i < code.length && i < iStart + LOOP_SIZE; i++) {
    var c = code.charAt(i);

    if (incomment) {
      if ('//' == incomment) {
        incomment = false;
      } else if ('\n' == c) {
        incomment = false;
        i++;
      } else if ('/*' == incomment && '*/' == code.substr(i, 2)) {
        incomment = false;
        c = '*/\n';
        i++;
      }
      if (!incomment) {
        while (code.charAt(++i).match(/\s/));; i--;
        c += tabs();
      }
      out += c;
    } else if (instring) {
      if (instring == c &&
        ('\\' != code.charAt(i - 1) || '\\' == code.charAt(i - 2))
      ) {
        instring = false;
      }
      out += c;
    } else if (infor && '(' == c) {
      infor++;
      out += c;
    } else if (infor && ')' == c) {
      infor--;
      out += c;
    } else if ('else' == code.substr(i, 4)) {
      out = out + 'e';
    } else if (code.substr(i).match(/^for\s*\(/)) {
      infor = 1;
      out += 'for (';
      while ('(' != code.charAt(++i));;
    } else if ('//' == code.substr(i, 2)) {
      incomment = '//';
      out += '//';
      i++;
    } else if ('/*' == code.substr(i, 2)) {
      incomment = '/*';
      out += '\n' + tabs() + '/*';
      i++;
    } else if ('"' == c || "'" == c) {
      if (instring && c == instring) {
        instring = false;
      } else {
        instring = c;
      }
      out += c;
    } else if ('{' == c) {
      level++;
      out = out + '{\n' + tabs();
      while (code.charAt(++i).match(/\s/));; i--;
    } else if ('}' == c) {
      out = out.replace(/\s*$/, '');
      level--;
      out += '\n' + tabs() + '}\n' + tabs();
      while (code.charAt(++i).match(/\s/));; i--;
    } else if (';' == c && !infor) {
      out += ';\n' + tabs();
      while (code.charAt(++i).match(/\s/));; i--;
    } else if ('\n' == c) {
      out += '\n' + tabs();
    } else {
      out += c;
    }
  }
}

function activate(context) {
  context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('php', {
    provideDocumentFormattingEdits: function (document, options, token) {
      return format(document, null, options);
    }
  }));
  context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('php', {
    provideDocumentRangeFormattingEdits: function (document, range, options, token) {
      var start = new vscode.Position(0, 0);
      var end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
      return format(document, new vscode.Range(start, end), options);
    }
  }));
}

exports.activate = activate;