Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/* eslint-env browser */

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _reactForAtom = require('react-for-atom');

var CustomPaneItem = (function (_HTMLElement) {
  _inherits(CustomPaneItem, _HTMLElement);

  function CustomPaneItem() {
    _classCallCheck(this, CustomPaneItem);

    _get(Object.getPrototypeOf(CustomPaneItem.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(CustomPaneItem, [{
    key: 'initialize',
    value: function initialize(options) {
      this._title = options.title;
      this._iconName = options.iconName;
      this._uri = options.uri;
      this._allowSplit = !!options.allowSplit;

      this.__component = _reactForAtom.ReactDOM.render(this.__renderPaneItem(options), this);
    }

    /**
     * Subclasses should override this method to render the pane using options passed from above.
     * This method is invoked as part of initialize(), and so, it should be safe to invoke any of the
     * getter methods on this class in this method.
     *
     * @return A React component that this element call ReactDOM.render() on.
     */
  }, {
    key: '__renderPaneItem',
    value: function __renderPaneItem(options) {
      throw new Error('Subclass should implement this method.');
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      (0, _assert2['default'])(this._title);
      return this._title;
    }
  }, {
    key: 'getIconName',
    value: function getIconName() {
      return this._iconName;
    }
  }, {
    key: 'getURI',
    value: function getURI() {
      return this._uri;
    }
  }, {
    key: 'copy',
    value: function copy() {
      return this._allowSplit;
    }
  }, {
    key: 'detachedCallback',
    value: function detachedCallback() {
      _reactForAtom.ReactDOM.unmountComponentAtNode(this);
    }
  }]);

  return CustomPaneItem;
})(HTMLElement);

exports.CustomPaneItem = CustomPaneItem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkN1c3RvbVBhbmVJdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkFhc0IsUUFBUTs7Ozs0QkFDQSxnQkFBZ0I7O0lBSWpDLGNBQWM7WUFBZCxjQUFjOztXQUFkLGNBQWM7MEJBQWQsY0FBYzs7K0JBQWQsY0FBYzs7O2VBQWQsY0FBYzs7V0FRZixvQkFBQyxPQUE4QixFQUFFO0FBQ3pDLFVBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztBQUM1QixVQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDbEMsVUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ3hCLFVBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7O0FBRXhDLFVBQUksQ0FBQyxXQUFXLEdBQUcsdUJBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMxRTs7Ozs7Ozs7Ozs7V0FTZSwwQkFBQyxPQUE4QixFQUFpQjtBQUM5RCxZQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7S0FDM0Q7OztXQUVPLG9CQUFXO0FBQ2pCLCtCQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN2QixhQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDcEI7OztXQUVVLHVCQUFZO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztLQUN2Qjs7O1dBRUssa0JBQVk7QUFDaEIsYUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQ2xCOzs7V0FFRyxnQkFBWTtBQUNkLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztLQUN6Qjs7O1dBRWUsNEJBQUc7QUFDakIsNkJBQVMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkM7OztTQS9DVSxjQUFjO0dBQVMsV0FBVyIsImZpbGUiOiJDdXN0b21QYW5lSXRlbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge1JlYWN0LCBSZWFjdERPTX0gZnJvbSAncmVhY3QtZm9yLWF0b20nO1xuXG5pbXBvcnQgdHlwZSB7Q3VzdG9tUGFuZUl0ZW1PcHRpb25zfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIEN1c3RvbVBhbmVJdGVtIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gIF90aXRsZTogP3N0cmluZztcbiAgX2ljb25OYW1lOiA/c3RyaW5nO1xuICBfdXJpOiA/c3RyaW5nO1xuICBfYWxsb3dTcGxpdDogYm9vbGVhbjtcbiAgX19jb21wb25lbnQ6IFJlYWN0LkVsZW1lbnQ7XG5cbiAgaW5pdGlhbGl6ZShvcHRpb25zOiBDdXN0b21QYW5lSXRlbU9wdGlvbnMpIHtcbiAgICB0aGlzLl90aXRsZSA9IG9wdGlvbnMudGl0bGU7XG4gICAgdGhpcy5faWNvbk5hbWUgPSBvcHRpb25zLmljb25OYW1lO1xuICAgIHRoaXMuX3VyaSA9IG9wdGlvbnMudXJpO1xuICAgIHRoaXMuX2FsbG93U3BsaXQgPSAhIW9wdGlvbnMuYWxsb3dTcGxpdDtcblxuICAgIHRoaXMuX19jb21wb25lbnQgPSBSZWFjdERPTS5yZW5kZXIodGhpcy5fX3JlbmRlclBhbmVJdGVtKG9wdGlvbnMpLCB0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJjbGFzc2VzIHNob3VsZCBvdmVycmlkZSB0aGlzIG1ldGhvZCB0byByZW5kZXIgdGhlIHBhbmUgdXNpbmcgb3B0aW9ucyBwYXNzZWQgZnJvbSBhYm92ZS5cbiAgICogVGhpcyBtZXRob2QgaXMgaW52b2tlZCBhcyBwYXJ0IG9mIGluaXRpYWxpemUoKSwgYW5kIHNvLCBpdCBzaG91bGQgYmUgc2FmZSB0byBpbnZva2UgYW55IG9mIHRoZVxuICAgKiBnZXR0ZXIgbWV0aG9kcyBvbiB0aGlzIGNsYXNzIGluIHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAcmV0dXJuIEEgUmVhY3QgY29tcG9uZW50IHRoYXQgdGhpcyBlbGVtZW50IGNhbGwgUmVhY3RET00ucmVuZGVyKCkgb24uXG4gICAqL1xuICBfX3JlbmRlclBhbmVJdGVtKG9wdGlvbnM6IEN1c3RvbVBhbmVJdGVtT3B0aW9ucyk6IFJlYWN0LkVsZW1lbnQge1xuICAgIHRocm93IG5ldyBFcnJvcignU3ViY2xhc3Mgc2hvdWxkIGltcGxlbWVudCB0aGlzIG1ldGhvZC4nKTtcbiAgfVxuXG4gIGdldFRpdGxlKCk6IHN0cmluZyB7XG4gICAgaW52YXJpYW50KHRoaXMuX3RpdGxlKTtcbiAgICByZXR1cm4gdGhpcy5fdGl0bGU7XG4gIH1cblxuICBnZXRJY29uTmFtZSgpOiA/c3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5faWNvbk5hbWU7XG4gIH1cblxuICBnZXRVUkkoKTogP3N0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3VyaTtcbiAgfVxuXG4gIGNvcHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FsbG93U3BsaXQ7XG4gIH1cblxuICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUodGhpcyk7XG4gIH1cbn1cbiJdfQ==