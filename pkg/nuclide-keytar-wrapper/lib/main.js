function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function getApmNodePath() {
  var apmDir = _path2['default'].dirname(atom.packages.getApmPath());
  return _path2['default'].normalize(_path2['default'].join(apmDir, 'node'));
}

function getApmNodeModulesPath() {
  var apmDir = _path2['default'].dirname(atom.packages.getApmPath());
  return _path2['default'].normalize(_path2['default'].join(apmDir, '..', 'node_modules'));
}

function runScriptInApmNode(script) {
  var args = ['-e', script];
  var options = { env: { NODE_PATH: getApmNodeModulesPath() } };
  var output = _child_process2['default'].spawnSync(getApmNodePath(), args, options);
  return output.stdout.toString();
}

function getPassword(service, account) {
  var script = '\n    var keytar = require(\'keytar\');\n    var service = ' + JSON.stringify(service) + ';\n    var account = ' + JSON.stringify(account) + ';\n    var password = keytar.getPassword(service, account);\n    console.log(JSON.stringify(password));\n  ';
  return JSON.parse(runScriptInApmNode(script));
}

function replacePassword(service, account, password) {
  var script = '\n    var keytar = require(\'keytar\');\n    var service = ' + JSON.stringify(service) + ';\n    var account = ' + JSON.stringify(account) + ';\n    var password = ' + JSON.stringify(password) + ';\n    var result = keytar.replacePassword(service, account, password);\n    console.log(JSON.stringify(result));\n  ';
  return JSON.parse(runScriptInApmNode(script));
}

module.exports = {
  getPassword: getPassword,
  replacePassword: replacePassword,
  __test__: {
    runScriptInApmNode: runScriptInApmNode,
    getApmNodePath: getApmNodePath,
    getApmNodeModulesPath: getApmNodeModulesPath
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs2QkFXMEIsZUFBZTs7OztvQkFDeEIsTUFBTTs7OztBQUV2QixTQUFTLGNBQWMsR0FBVztBQUNoQyxNQUFNLE1BQU0sR0FBRyxrQkFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ3hELFNBQU8sa0JBQUssU0FBUyxDQUFDLGtCQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztDQUNsRDs7QUFFRCxTQUFTLHFCQUFxQixHQUFXO0FBQ3ZDLE1BQU0sTUFBTSxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFDeEQsU0FBTyxrQkFBSyxTQUFTLENBQUMsa0JBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztDQUNoRTs7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE1BQWMsRUFBVTtBQUNsRCxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QixNQUFNLE9BQU8sR0FBRyxFQUFDLEdBQUcsRUFBRSxFQUFDLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxFQUFDLEVBQUMsQ0FBQztBQUM1RCxNQUFNLE1BQU0sR0FBRywyQkFBYyxTQUFTLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3hFLFNBQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztDQUNqQzs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxPQUFlLEVBQUUsT0FBZSxFQUFXO0FBQzlELE1BQU0sTUFBTSxtRUFFTSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyw2QkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0hBR3hDLENBQUM7QUFDRixTQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztDQUMvQzs7QUFFRCxTQUFTLGVBQWUsQ0FDcEIsT0FBZSxFQUNmLE9BQWUsRUFDZixRQUFnQixFQUFZO0FBQzlCLE1BQU0sTUFBTSxtRUFFTSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyw2QkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsOEJBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLDBIQUcxQyxDQUFDO0FBQ0YsU0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Q0FDL0M7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLGFBQVcsRUFBWCxXQUFXO0FBQ1gsaUJBQWUsRUFBZixlQUFlO0FBQ2YsVUFBUSxFQUFFO0FBQ1Isc0JBQWtCLEVBQWxCLGtCQUFrQjtBQUNsQixrQkFBYyxFQUFkLGNBQWM7QUFDZCx5QkFBcUIsRUFBckIscUJBQXFCO0dBQ3RCO0NBQ0YsQ0FBQyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IGNoaWxkX3Byb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZnVuY3Rpb24gZ2V0QXBtTm9kZVBhdGgoKTogc3RyaW5nIHtcbiAgY29uc3QgYXBtRGlyID0gcGF0aC5kaXJuYW1lKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpKTtcbiAgcmV0dXJuIHBhdGgubm9ybWFsaXplKHBhdGguam9pbihhcG1EaXIsICdub2RlJykpO1xufVxuXG5mdW5jdGlvbiBnZXRBcG1Ob2RlTW9kdWxlc1BhdGgoKTogc3RyaW5nIHtcbiAgY29uc3QgYXBtRGlyID0gcGF0aC5kaXJuYW1lKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpKTtcbiAgcmV0dXJuIHBhdGgubm9ybWFsaXplKHBhdGguam9pbihhcG1EaXIsICcuLicsICdub2RlX21vZHVsZXMnKSk7XG59XG5cbmZ1bmN0aW9uIHJ1blNjcmlwdEluQXBtTm9kZShzY3JpcHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGFyZ3MgPSBbJy1lJywgc2NyaXB0XTtcbiAgY29uc3Qgb3B0aW9ucyA9IHtlbnY6IHtOT0RFX1BBVEg6IGdldEFwbU5vZGVNb2R1bGVzUGF0aCgpfX07XG4gIGNvbnN0IG91dHB1dCA9IGNoaWxkX3Byb2Nlc3Muc3Bhd25TeW5jKGdldEFwbU5vZGVQYXRoKCksIGFyZ3MsIG9wdGlvbnMpO1xuICByZXR1cm4gb3V0cHV0LnN0ZG91dC50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBnZXRQYXNzd29yZChzZXJ2aWNlOiBzdHJpbmcsIGFjY291bnQ6IHN0cmluZyk6ID9zdHJpbmcge1xuICBjb25zdCBzY3JpcHQgPSBgXG4gICAgdmFyIGtleXRhciA9IHJlcXVpcmUoJ2tleXRhcicpO1xuICAgIHZhciBzZXJ2aWNlID0gJHtKU09OLnN0cmluZ2lmeShzZXJ2aWNlKX07XG4gICAgdmFyIGFjY291bnQgPSAke0pTT04uc3RyaW5naWZ5KGFjY291bnQpfTtcbiAgICB2YXIgcGFzc3dvcmQgPSBrZXl0YXIuZ2V0UGFzc3dvcmQoc2VydmljZSwgYWNjb3VudCk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocGFzc3dvcmQpKTtcbiAgYDtcbiAgcmV0dXJuIEpTT04ucGFyc2UocnVuU2NyaXB0SW5BcG1Ob2RlKHNjcmlwdCkpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlUGFzc3dvcmQoXG4gICAgc2VydmljZTogc3RyaW5nLFxuICAgIGFjY291bnQ6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nKTogP2Jvb2xlYW4ge1xuICBjb25zdCBzY3JpcHQgPSBgXG4gICAgdmFyIGtleXRhciA9IHJlcXVpcmUoJ2tleXRhcicpO1xuICAgIHZhciBzZXJ2aWNlID0gJHtKU09OLnN0cmluZ2lmeShzZXJ2aWNlKX07XG4gICAgdmFyIGFjY291bnQgPSAke0pTT04uc3RyaW5naWZ5KGFjY291bnQpfTtcbiAgICB2YXIgcGFzc3dvcmQgPSAke0pTT04uc3RyaW5naWZ5KHBhc3N3b3JkKX07XG4gICAgdmFyIHJlc3VsdCA9IGtleXRhci5yZXBsYWNlUGFzc3dvcmQoc2VydmljZSwgYWNjb3VudCwgcGFzc3dvcmQpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpO1xuICBgO1xuICByZXR1cm4gSlNPTi5wYXJzZShydW5TY3JpcHRJbkFwbU5vZGUoc2NyaXB0KSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRQYXNzd29yZCxcbiAgcmVwbGFjZVBhc3N3b3JkLFxuICBfX3Rlc3RfXzoge1xuICAgIHJ1blNjcmlwdEluQXBtTm9kZSxcbiAgICBnZXRBcG1Ob2RlUGF0aCxcbiAgICBnZXRBcG1Ob2RlTW9kdWxlc1BhdGgsXG4gIH0sXG59O1xuIl19