var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _FlowServiceFactory = require('./FlowServiceFactory');

var _nuclideAtomHelpers = require('../../nuclide-atom-helpers');

var _constants = require('./constants');

var JS_GRAMMARS_SET = new Set(_constants.JS_GRAMMARS);

var FlowHyperclickProvider = (function () {
  function FlowHyperclickProvider() {
    _classCallCheck(this, FlowHyperclickProvider);
  }

  _createClass(FlowHyperclickProvider, [{
    key: 'getSuggestionForWord',
    value: _asyncToGenerator(function* (textEditor, text, range) {
      if (!JS_GRAMMARS_SET.has(textEditor.getGrammar().scopeName)) {
        return null;
      }

      var filePath = textEditor.getPath();
      if (filePath == null) {
        return null;
      }
      var position = range.start;

      var flowService = (0, _FlowServiceFactory.getFlowServiceByNuclideUri)(filePath);
      (0, _assert2['default'])(flowService);
      var location = yield flowService.flowFindDefinition(filePath, textEditor.getText(), position.row + 1, position.column + 1);
      if (location) {
        return {
          range: range,
          callback: function callback() {
            (0, _nuclideAtomHelpers.goToLocation)(location.file, location.point.line, location.point.column);
          }
        };
      } else {
        return null;
      }
    })
  }]);

  return FlowHyperclickProvider;
})();

module.exports = FlowHyperclickProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkZsb3dIeXBlcmNsaWNrUHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztzQkFhc0IsUUFBUTs7OztrQ0FFVyxzQkFBc0I7O2tDQUNwQyw0QkFBNEI7O3lCQUU3QixhQUFhOztBQUN2QyxJQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsd0JBQWEsQ0FBQzs7SUFFdkMsc0JBQXNCO1dBQXRCLHNCQUFzQjswQkFBdEIsc0JBQXNCOzs7ZUFBdEIsc0JBQXNCOzs2QkFDQSxXQUFDLFVBQXNCLEVBQUUsSUFBWSxFQUFFLEtBQWlCLEVBQy9DO0FBQ2pDLFVBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUMzRCxlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELFVBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QyxVQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFDcEIsZUFBTyxJQUFJLENBQUM7T0FDYjtVQUNhLFFBQVEsR0FBSSxLQUFLLENBQXhCLEtBQUs7O0FBQ1osVUFBTSxXQUFXLEdBQUcsb0RBQTJCLFFBQVEsQ0FBQyxDQUFDO0FBQ3pELCtCQUFVLFdBQVcsQ0FBQyxDQUFDO0FBQ3ZCLFVBQU0sUUFBUSxHQUFHLE1BQU0sV0FBVyxDQUM3QixrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDL0YsVUFBSSxRQUFRLEVBQUU7QUFDWixlQUFPO0FBQ0wsZUFBSyxFQUFMLEtBQUs7QUFDTCxrQkFBUSxFQUFBLG9CQUFHO0FBQ1Qsa0RBQWEsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1dBQ3pFO1NBQ0YsQ0FBQztPQUNILE1BQU07QUFDTCxlQUFPLElBQUksQ0FBQztPQUNiO0tBQ0Y7OztTQTFCRyxzQkFBc0I7OztBQTZCNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyIsImZpbGUiOiJGbG93SHlwZXJjbGlja1Byb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0h5cGVyY2xpY2tTdWdnZXN0aW9ufSBmcm9tICcuLi8uLi9oeXBlcmNsaWNrJztcblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuXG5pbXBvcnQge2dldEZsb3dTZXJ2aWNlQnlOdWNsaWRlVXJpfSBmcm9tICcuL0Zsb3dTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQge2dvVG9Mb2NhdGlvbn0gZnJvbSAnLi4vLi4vbnVjbGlkZS1hdG9tLWhlbHBlcnMnO1xuXG5pbXBvcnQge0pTX0dSQU1NQVJTfSBmcm9tICcuL2NvbnN0YW50cyc7XG5jb25zdCBKU19HUkFNTUFSU19TRVQgPSBuZXcgU2V0KEpTX0dSQU1NQVJTKTtcblxuY2xhc3MgRmxvd0h5cGVyY2xpY2tQcm92aWRlciB7XG4gIGFzeW5jIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHRleHQ6IHN0cmluZywgcmFuZ2U6IGF0b20kUmFuZ2UpOlxuICAgICAgUHJvbWlzZTw/SHlwZXJjbGlja1N1Z2dlc3Rpb24+IHtcbiAgICBpZiAoIUpTX0dSQU1NQVJTX1NFVC5oYXModGV4dEVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHtzdGFydDogcG9zaXRpb259ID0gcmFuZ2U7XG4gICAgY29uc3QgZmxvd1NlcnZpY2UgPSBnZXRGbG93U2VydmljZUJ5TnVjbGlkZVVyaShmaWxlUGF0aCk7XG4gICAgaW52YXJpYW50KGZsb3dTZXJ2aWNlKTtcbiAgICBjb25zdCBsb2NhdGlvbiA9IGF3YWl0IGZsb3dTZXJ2aWNlXG4gICAgICAgIC5mbG93RmluZERlZmluaXRpb24oZmlsZVBhdGgsIHRleHRFZGl0b3IuZ2V0VGV4dCgpLCBwb3NpdGlvbi5yb3cgKyAxLCBwb3NpdGlvbi5jb2x1bW4gKyAxKTtcbiAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJhbmdlLFxuICAgICAgICBjYWxsYmFjaygpIHtcbiAgICAgICAgICBnb1RvTG9jYXRpb24obG9jYXRpb24uZmlsZSwgbG9jYXRpb24ucG9pbnQubGluZSwgbG9jYXRpb24ucG9pbnQuY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZsb3dIeXBlcmNsaWNrUHJvdmlkZXI7XG4iXX0=