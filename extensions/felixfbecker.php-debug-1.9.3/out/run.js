'use strict';

var _vscodeDebugadapter = require('vscode-debugadapter');

var vscode = _interopRequireWildcard(_vscodeDebugadapter);

var _phpDebug = require('./phpDebug');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

vscode.DebugSession.run(_phpDebug.PhpDebugSession);
//# sourceMappingURL=run.js.map
