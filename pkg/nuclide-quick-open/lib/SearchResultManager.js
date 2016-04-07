Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _nuclideAnalytics = require('../../nuclide-analytics');

var _nuclideLogging = require('../../nuclide-logging');

var _atom = require('atom');

var _nuclideCommons = require('../../nuclide-commons');

var _QuickSelectionDispatcher = require('./QuickSelectionDispatcher');

var _QuickSelectionDispatcher2 = _interopRequireDefault(_QuickSelectionDispatcher);

var _QuickSelectionActions = require('./QuickSelectionActions');

var _QuickSelectionActions2 = _interopRequireDefault(_QuickSelectionActions);

var assign = Object.assign || require('object-assign');
var performance = global.performance;

function getDefaultResult() {
  return {
    error: null,
    loading: false,
    results: []
  };
}

var AnalyticsEvents = Object.freeze({
  QUERY_SOURCE_PROVIDER: 'quickopen-query-source-provider'
});

var RESULTS_CHANGED = 'results_changed';
var PROVIDERS_CHANGED = 'providers_changed';
var MAX_OMNI_RESULTS_PER_SERVICE = 5;
var DEFAULT_QUERY_DEBOUNCE_DELAY = 200;
var OMNISEARCH_PROVIDER = {
  action: 'nuclide-quick-open:find-anything-via-omni-search',
  debounceDelay: DEFAULT_QUERY_DEBOUNCE_DELAY,
  name: 'OmniSearchResultProvider',
  prompt: 'Search for anything...',
  title: 'OmniSearch'
};
// Number of elements in the cache before periodic cleanup kicks in. Includes partial query strings.
var MAX_CACHED_QUERIES = 100;
var CACHE_CLEAN_DEBOUNCE_DELAY = 5000;
var UPDATE_DIRECTORIES_DEBOUNCE_DELAY = 100;
var GLOBAL_KEY = 'global';
var DIRECTORY_KEY = 'directory';

function isValidProvider(provider) {
  return typeof provider.getProviderType === 'function' && typeof provider.getName === 'function' && typeof provider.getName() === 'string' && typeof provider.isRenderable === 'function' && typeof provider.executeQuery === 'function' && typeof provider.getTabTitle === 'function';
}

var searchResultManagerInstance = null;
/**
 * A singleton cache for search providers and results.
 */

var SearchResultManager = (function () {
  _createClass(SearchResultManager, null, [{
    key: 'getInstance',
    value: function getInstance() {
      if (!searchResultManagerInstance) {
        searchResultManagerInstance = new SearchResultManager();
      }
      return searchResultManagerInstance;
    }
  }]);

  function SearchResultManager() {
    var _this = this;

    _classCallCheck(this, SearchResultManager);

    this._isDisposed = false;
    this.RESULTS_CHANGED = RESULTS_CHANGED;
    this.PROVIDERS_CHANGED = PROVIDERS_CHANGED;
    this._registeredProviders = {};
    this._registeredProviders[DIRECTORY_KEY] = new Map();
    this._registeredProviders[GLOBAL_KEY] = new Map();
    this._providersByDirectory = new Map();
    this._directories = [];
    this._cachedResults = {};
    this._debouncedCleanCache = (0, _nuclideCommons.debounce)(function () {
      return _this._cleanCache();
    }, CACHE_CLEAN_DEBOUNCE_DELAY,
    /* immediate */false);
    // `updateDirectories` joins providers and directories, which don't know anything about each
    // other. Debounce this call to reduce churn at startup, and when new providers get activated or
    // a new directory gets mounted.
    this._debouncedUpdateDirectories = (0, _nuclideCommons.debounce)(function () {
      return _this._updateDirectories();
    }, UPDATE_DIRECTORIES_DEBOUNCE_DELAY,
    /* immediate */false);
    this._queryLruQueue = new Map();
    this._emitter = new _atom.Emitter();
    this._subscriptions = new _atom.CompositeDisposable();
    this._dispatcher = _QuickSelectionDispatcher2['default'].getInstance();
    // Check is required for testing.
    if (atom.project) {
      this._subscriptions.add(atom.project.onDidChangePaths(this._debouncedUpdateDirectories.bind(this)));
      this._debouncedUpdateDirectories();
    }
    this._setUpFlux();
    this._activeProviderName = OMNISEARCH_PROVIDER.name;
  }

  _createClass(SearchResultManager, [{
    key: '_setUpFlux',
    value: function _setUpFlux() {
      var _this2 = this;

      this._dispatcherToken = this._dispatcher.register(function (action) {
        switch (action.actionType) {
          case _QuickSelectionDispatcher2['default'].ActionType.QUERY:
            _this2.executeQuery(action.query);
            break;
          case _QuickSelectionDispatcher2['default'].ActionType.ACTIVE_PROVIDER_CHANGED:
            _this2._activeProviderName = action.providerName;
            _this2._emitter.emit(PROVIDERS_CHANGED);
            break;
        }
      });
    }
  }, {
    key: 'getActiveProviderName',
    value: function getActiveProviderName() {
      return this._activeProviderName;
    }
  }, {
    key: 'getRendererForProvider',
    value: function getRendererForProvider(providerName) {
      var provider = this._getProviderByName(providerName);
      if (!provider || !provider.getComponentForItem) {
        return require('./FileResultComponent').getComponentForItem;
      }
      return provider.getComponentForItem;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._isDisposed = true;
      this._subscriptions.dispose();
    }

    /**
     * Renew the cached list of directories, as well as the cached map of eligible providers
     * for every directory.
     */
  }, {
    key: '_updateDirectories',
    value: _asyncToGenerator(function* () {
      var _this3 = this;

      var newDirectories = atom.project.getDirectories();
      var newProvidersByDirectories = new Map();
      var eligibilities = [];
      newDirectories.forEach(function (directory) {
        newProvidersByDirectories.set(directory, new Set());

        var _loop = function (provider) {
          (0, _assert2['default'])(provider.isEligibleForDirectory != null, 'Directory provider ' + provider.getName() + ' must provide `isEligibleForDirectory()`.');
          eligibilities.push(provider.isEligibleForDirectory(directory).then(function (isEligible) {
            return {
              isEligible: isEligible,
              provider: provider,
              directory: directory
            };
          }));
        };

        for (var provider of _this3._registeredProviders[DIRECTORY_KEY].values()) {
          _loop(provider);
        }
      });
      var resolvedEligibilities = yield Promise.all(eligibilities);
      for (var eligibility of resolvedEligibilities) {
        var provider = eligibility.provider;
        var isEligible = eligibility.isEligible;
        var directory = eligibility.directory;

        if (isEligible) {
          var providersForDirectory = newProvidersByDirectories.get(directory);
          (0, _assert2['default'])(providersForDirectory != null, 'Providers for directory ' + directory + ' not defined');
          providersForDirectory.add(provider);
        }
      }
      this._directories = newDirectories;
      this._providersByDirectory = newProvidersByDirectories;
      this._emitter.emit(PROVIDERS_CHANGED);
    })
  }, {
    key: 'on',
    value: function on() {
      var _emitter;

      return (_emitter = this._emitter).on.apply(_emitter, arguments);
    }
  }, {
    key: 'registerProvider',
    value: function registerProvider(service) {
      var _this4 = this;

      if (!isValidProvider(service)) {
        var providerName = service.getName && service.getName() || '<unknown>';
        (0, _nuclideLogging.getLogger)().error('Quick-open provider ' + providerName + ' is not a valid provider');
      }
      var isRenderableProvider = typeof service.isRenderable === 'function' && service.isRenderable();
      var isGlobalProvider = service.getProviderType() === 'GLOBAL';
      var targetRegistry = isGlobalProvider ? this._registeredProviders[GLOBAL_KEY] : this._registeredProviders[DIRECTORY_KEY];
      targetRegistry.set(service.getName(), service);
      if (!isGlobalProvider) {
        this._debouncedUpdateDirectories();
      }
      var disposable = new _atom.CompositeDisposable();
      disposable.add(new _atom.Disposable(function () {
        // This may be called after this package has been deactivated
        // and the SearchResultManager has been disposed.
        if (_this4._isDisposed) {
          return;
        }
        var serviceName = service.getName();
        targetRegistry['delete'](serviceName);
        _this4._providersByDirectory.forEach(function (providers, dir) {
          providers['delete'](service);
        });
        _this4._removeResultsForProvider(serviceName);
        _this4._emitter.emit(PROVIDERS_CHANGED);
      }));
      // If the provider is renderable and specifies a keybinding, wire it up with the toggle command.
      if (isRenderableProvider && typeof service.getAction === 'function') {
        var toggleAction = service.getAction();
        // TODO replace with computed property once Flow supports it.
        var actionSpec = {};
        actionSpec[toggleAction] = function () {
          return _QuickSelectionActions2['default'].changeActiveProvider(service.getName());
        };
        disposable.add(atom.commands.add('atom-workspace', actionSpec));
      }
      return disposable;
    }
  }, {
    key: '_removeResultsForProvider',
    value: function _removeResultsForProvider(providerName) {
      if (this._cachedResults[providerName]) {
        delete this._cachedResults[providerName];
        this._emitter.emit(RESULTS_CHANGED);
      }
    }
  }, {
    key: 'setCacheResult',
    value: function setCacheResult(providerName, directory, query, result) {
      var loading = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];
      var error = arguments.length <= 5 || arguments[5] === undefined ? null : arguments[5];

      this.ensureCacheEntry(providerName, directory);
      this._cachedResults[providerName][directory][query] = {
        result: result,
        loading: loading,
        error: error
      };
      // Refresh the usage for the current query.
      this._queryLruQueue['delete'](query);
      this._queryLruQueue.set(query, null);
      setImmediate(this._debouncedCleanCache);
    }
  }, {
    key: 'ensureCacheEntry',
    value: function ensureCacheEntry(providerName, directory) {
      if (!this._cachedResults[providerName]) {
        this._cachedResults[providerName] = {};
      }
      if (!this._cachedResults[providerName][directory]) {
        this._cachedResults[providerName][directory] = {};
      }
    }
  }, {
    key: 'cacheResult',
    value: function cacheResult(query, result, directory, provider) {
      var providerName = provider.getName();
      this.setCacheResult(providerName, directory, query, result, false, null);
    }
  }, {
    key: '_setLoading',
    value: function _setLoading(query, directory, provider) {
      var providerName = provider.getName();
      this.ensureCacheEntry(providerName, directory);
      var previousResult = this._cachedResults[providerName][directory][query];
      if (!previousResult) {
        this._cachedResults[providerName][directory][query] = {
          result: [],
          error: null,
          loading: true
        };
      }
    }

    /**
     * Release the oldest cached results once the cache is full.
     */
  }, {
    key: '_cleanCache',
    value: function _cleanCache() {
      var _this5 = this;

      var queueSize = this._queryLruQueue.size;
      if (queueSize <= MAX_CACHED_QUERIES) {
        return;
      }
      // Figure out least recently used queries, and pop them off of the `_queryLruQueue` Map.
      var expiredQueries = [];
      var keyIterator = this._queryLruQueue.keys();
      var entriesToRemove = queueSize - MAX_CACHED_QUERIES;
      for (var i = 0; i < entriesToRemove; i++) {
        var firstEntryKey = keyIterator.next().value;
        expiredQueries.push(firstEntryKey);
        (0, _assert2['default'])(firstEntryKey != null);
        this._queryLruQueue['delete'](firstEntryKey);
      }

      // For each (provider|directory) pair, remove results for all expired queries from the cache.
      for (var providerName in this._cachedResults) {
        var _loop2 = function (directory) {
          var queryResults = _this5._cachedResults[providerName][directory];
          expiredQueries.forEach(function (query) {
            return delete queryResults[query];
          });
        };

        for (var directory in this._cachedResults[providerName]) {
          _loop2(directory);
        }
      }
      this._emitter.emit(RESULTS_CHANGED);
    }
  }, {
    key: 'processResult',
    value: function processResult(query, result, directory, provider) {
      this.cacheResult.apply(this, arguments);
      this._emitter.emit(RESULTS_CHANGED);
    }
  }, {
    key: 'sanitizeQuery',
    value: function sanitizeQuery(query) {
      return query.trim();
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (rawQuery) {
      var _this6 = this;

      var query = this.sanitizeQuery(rawQuery);

      var _loop3 = function (globalProvider) {
        var startTime = performance.now();
        globalProvider.executeQuery(query).then(function (result) {
          (0, _nuclideAnalytics.track)(AnalyticsEvents.QUERY_SOURCE_PROVIDER, {
            'quickopen-source-provider': globalProvider.getName(),
            'quickopen-query-duration': (performance.now() - startTime).toString(),
            'quickopen-result-count': result.length.toString()
          });
          _this6.processResult(query, result, GLOBAL_KEY, globalProvider);
        });
        _this6._setLoading(query, GLOBAL_KEY, globalProvider);
      };

      for (var globalProvider of this._registeredProviders[GLOBAL_KEY].values()) {
        _loop3(globalProvider);
      }
      if (this._providersByDirectory.size === 0) {
        return;
      }
      this._directories.forEach(function (directory) {
        var path = directory.getPath();
        var providers = _this6._providersByDirectory.get(directory);
        if (!providers) {
          // Special directories like "atom://about"
          return;
        }

        var _loop4 = function (directoryProvider) {
          var startTime = performance.now();
          directoryProvider.executeQuery(query, directory).then(function (result) {
            (0, _nuclideAnalytics.track)(AnalyticsEvents.QUERY_SOURCE_PROVIDER, {
              'quickopen-source-provider': directoryProvider.getName(),
              'quickopen-query-duration': (performance.now() - startTime).toString(),
              'quickopen-result-count': result.length.toString()
            });
            _this6.processResult(query, result, path, directoryProvider);
          });
          _this6._setLoading(query, path, directoryProvider);
        };

        for (var directoryProvider of providers) {
          _loop4(directoryProvider);
        }
      });
      this._emitter.emit(RESULTS_CHANGED);
    })
  }, {
    key: '_isGlobalProvider',
    value: function _isGlobalProvider(providerName) {
      return this._registeredProviders[GLOBAL_KEY].has(providerName);
    }
  }, {
    key: '_getProviderByName',
    value: function _getProviderByName(providerName) {
      var dirProviderName = undefined;
      if (this._isGlobalProvider(providerName)) {
        dirProviderName = this._registeredProviders[GLOBAL_KEY].get(providerName);
      } else {
        dirProviderName = this._registeredProviders[DIRECTORY_KEY].get(providerName);
      }
      (0, _assert2['default'])(dirProviderName != null, 'Provider ' + providerName + ' is not registered with quick-open.');
      return dirProviderName;
    }
  }, {
    key: '_getResultsForProvider',
    value: function _getResultsForProvider(query, providerName) {
      var _this7 = this;

      var providerPaths = this._isGlobalProvider(providerName) ? [GLOBAL_KEY] : this._directories.map(function (d) {
        return d.getPath();
      });
      var provider = this._getProviderByName(providerName);
      return {
        title: provider.getTabTitle(),
        results: providerPaths.reduce(function (results, path) {
          var cachedPaths = undefined,
              cachedQueries = undefined,
              cachedResult = undefined;
          if (!((cachedPaths = _this7._cachedResults[providerName]) && (cachedQueries = cachedPaths[path]) && (cachedResult = cachedQueries[query]))) {
            cachedResult = {};
          }
          var defaultResult = getDefaultResult();
          var resultList = cachedResult.result || defaultResult.results;
          results[path] = {
            results: resultList.map(function (result) {
              return _extends({}, result, { sourceProvider: providerName });
            }),
            loading: cachedResult.loading || defaultResult.loading,
            error: cachedResult.error || defaultResult.error
          };
          return results;
        }, {})
      };
    }
  }, {
    key: 'getResults',
    value: function getResults(query, activeProviderName) {
      var sanitizedQuery = this.sanitizeQuery(query);
      if (activeProviderName === OMNISEARCH_PROVIDER.name) {
        var omniSearchResults = [{}];
        for (var providerName in this._cachedResults) {
          var resultForProvider = this._getResultsForProvider(sanitizedQuery, providerName);
          // TODO replace this with a ranking algorithm.
          for (var dir in resultForProvider.results) {
            resultForProvider.results[dir].results = resultForProvider.results[dir].results.slice(0, MAX_OMNI_RESULTS_PER_SERVICE);
          }
          // TODO replace `partial` with computed property whenever Flow supports it.
          var _partial = {};
          _partial[providerName] = resultForProvider;
          omniSearchResults.push(_partial);
        }
        return assign.apply({}, omniSearchResults);
      }
      // TODO replace `partial` with computed property whenever Flow supports it.
      var partial = {};
      partial[activeProviderName] = this._getResultsForProvider(sanitizedQuery, activeProviderName);
      return partial;
    }
  }, {
    key: 'getProviderByName',
    value: function getProviderByName(providerName) {
      if (providerName === OMNISEARCH_PROVIDER.name) {
        return _extends({}, OMNISEARCH_PROVIDER);
      }
      return this._bakeProvider(this._getProviderByName(providerName));
    }

    /**
     * Turn a Provider into a plain "spec" object consumed by QuickSelectionComponent.
     */
  }, {
    key: '_bakeProvider',
    value: function _bakeProvider(provider) {
      var providerName = provider.getName();
      return {
        action: provider.getAction && provider.getAction() || '',
        debounceDelay: typeof provider.getDebounceDelay === 'function' ? provider.getDebounceDelay() : DEFAULT_QUERY_DEBOUNCE_DELAY,
        name: providerName,
        prompt: provider.getPromptText && provider.getPromptText() || 'Search ' + providerName,
        title: provider.getTabTitle && provider.getTabTitle() || providerName
      };
    }
  }, {
    key: 'getRenderableProviders',
    value: function getRenderableProviders() {
      var _this8 = this;

      // Only render tabs for providers that are eligible for at least one directory.
      var eligibleDirectoryProviders = _nuclideCommons.array.from(this._registeredProviders[DIRECTORY_KEY].values()).filter(function (provider) {
        for (var providers of _this8._providersByDirectory.values()) {
          if (providers.has(provider)) {
            return true;
          }
        }
        return false;
      });
      var tabs = _nuclideCommons.array.from(this._registeredProviders[GLOBAL_KEY].values()).concat(eligibleDirectoryProviders).filter(function (provider) {
        return provider.isRenderable();
      }).map(this._bakeProvider).sort(function (p1, p2) {
        return p1.name.localeCompare(p2.name);
      });
      tabs.unshift(OMNISEARCH_PROVIDER);
      return tabs;
    }
  }]);

  return SearchResultManager;
})();

exports['default'] = SearchResultManager;
var __test__ = {
  _getOmniSearchProviderSpec: function _getOmniSearchProviderSpec() {
    return OMNISEARCH_PROVIDER;
  }
};
exports.__test__ = __test__;

// List of most recently used query strings, used for pruning the result cache.
// Makes use of `Map`'s insertion ordering, so values are irrelevant and always set to `null`.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlYXJjaFJlc3VsdE1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQkF5QnNCLFFBQVE7Ozs7Z0NBQ1YseUJBQXlCOzs4QkFDckIsdUJBQXVCOztvQkFLeEMsTUFBTTs7OEJBSU4sdUJBQXVCOzt3Q0FDTyw0QkFBNEI7Ozs7cUNBQy9CLHlCQUF5Qjs7OztBQUUzRCxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUNsRCxXQUFXLEdBQUksTUFBTSxDQUFyQixXQUFXOztBQUVsQixTQUFTLGdCQUFnQixHQUFtQjtBQUMxQyxTQUFPO0FBQ0wsU0FBSyxFQUFFLElBQUk7QUFDWCxXQUFPLEVBQUUsS0FBSztBQUNkLFdBQU8sRUFBRSxFQUFFO0dBQ1osQ0FBQztDQUNIOztBQUVELElBQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDcEMsdUJBQXFCLEVBQUUsaUNBQWlDO0NBQ3pELENBQUMsQ0FBQzs7QUFFSCxJQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztBQUMxQyxJQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDO0FBQzlDLElBQU0sNEJBQTRCLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLElBQU0sNEJBQTRCLEdBQUcsR0FBRyxDQUFDO0FBQ3pDLElBQU0sbUJBQW1CLEdBQUc7QUFDMUIsUUFBTSxFQUFFLGtEQUFrRDtBQUMxRCxlQUFhLEVBQUUsNEJBQTRCO0FBQzNDLE1BQUksRUFBRSwwQkFBMEI7QUFDaEMsUUFBTSxFQUFFLHdCQUF3QjtBQUNoQyxPQUFLLEVBQUUsWUFBWTtDQUNwQixDQUFDOztBQUVGLElBQU0sa0JBQWtCLEdBQUcsR0FBRyxDQUFDO0FBQy9CLElBQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLElBQU0saUNBQWlDLEdBQUcsR0FBRyxDQUFDO0FBQzlDLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FB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LFVBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNsQyxhQUFPLElBQUksQ0FBQztLQUNiOzs7U0FsYkcsbUJBQW1COzs7cUJBc2JWLG1CQUFtQjtBQUUzQixJQUFNLFFBQVEsR0FBRztBQUN0Qiw0QkFBMEIsRUFBQSxzQ0FBaUI7QUFDekMsV0FBTyxtQkFBbUIsQ0FBQztHQUM1QjtDQUNGLENBQUMiLCJmaWxlIjoiU2VhcmNoUmVzdWx0TWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgUHJvdmlkZXJTcGVjLFxufSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IHR5cGUge1xuICBGaWxlUmVzdWx0LFxuICBQcm92aWRlcixcbiAgUHJvdmlkZXJSZXN1bHQsXG59IGZyb20gJy4uLy4uL251Y2xpZGUtcXVpY2stb3Blbi1pbnRlcmZhY2VzJztcblxuaW1wb3J0IHR5cGUge0Rpc3BhdGNoZXJ9IGZyb20gJ2ZsdXgnO1xuXG50eXBlIFJlc3VsdFJlbmRlcmVyID0gKGl0ZW06IEZpbGVSZXN1bHQsIHNlcnZpY2VOYW1lOiBzdHJpbmcsIGRpck5hbWU6IHN0cmluZykgPT4gUmVhY3RFbGVtZW50O1xuXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge3RyYWNrfSBmcm9tICcuLi8uLi9udWNsaWRlLWFuYWx5dGljcyc7XG5pbXBvcnQge2dldExvZ2dlcn0gZnJvbSAnLi4vLi4vbnVjbGlkZS1sb2dnaW5nJztcbmltcG9ydCB7XG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXG4gIERpc3Bvc2FibGUsXG4gIEVtaXR0ZXIsXG59IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtcbiAgYXJyYXksXG4gIGRlYm91bmNlLFxufSBmcm9tICcuLi8uLi9udWNsaWRlLWNvbW1vbnMnO1xuaW1wb3J0IFF1aWNrU2VsZWN0aW9uRGlzcGF0Y2hlciBmcm9tICcuL1F1aWNrU2VsZWN0aW9uRGlzcGF0Y2hlcic7XG5pbXBvcnQgUXVpY2tTZWxlY3Rpb25BY3Rpb25zIGZyb20gJy4vUXVpY2tTZWxlY3Rpb25BY3Rpb25zJztcblxuY29uc3QgYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5jb25zdCB7cGVyZm9ybWFuY2V9ID0gZ2xvYmFsO1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0UmVzdWx0KCk6IFByb3ZpZGVyUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBlcnJvcjogbnVsbCxcbiAgICBsb2FkaW5nOiBmYWxzZSxcbiAgICByZXN1bHRzOiBbXSxcbiAgfTtcbn1cblxuY29uc3QgQW5hbHl0aWNzRXZlbnRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFFVRVJZX1NPVVJDRV9QUk9WSURFUjogJ3F1aWNrb3Blbi1xdWVyeS1zb3VyY2UtcHJvdmlkZXInLFxufSk7XG5cbmNvbnN0IFJFU1VMVFNfQ0hBTkdFRCA9ICdyZXN1bHRzX2NoYW5nZWQnO1xuY29uc3QgUFJPVklERVJTX0NIQU5HRUQgPSAncHJvdmlkZXJzX2NoYW5nZWQnO1xuY29uc3QgTUFYX09NTklfUkVTVUxUU19QRVJfU0VSVklDRSA9IDU7XG5jb25zdCBERUZBVUxUX1FVRVJZX0RFQk9VTkNFX0RFTEFZID0gMjAwO1xuY29uc3QgT01OSVNFQVJDSF9QUk9WSURFUiA9IHtcbiAgYWN0aW9uOiAnbnVjbGlkZS1xdWljay1vcGVuOmZpbmQtYW55dGhpbmctdmlhLW9tbmktc2VhcmNoJyxcbiAgZGVib3VuY2VEZWxheTogREVGQVVMVF9RVUVSWV9ERUJPVU5DRV9ERUxBWSxcbiAgbmFtZTogJ09tbmlTZWFyY2hSZXN1bHRQcm92aWRlcicsXG4gIHByb21wdDogJ1NlYXJjaCBmb3IgYW55dGhpbmcuLi4nLFxuICB0aXRsZTogJ09tbmlTZWFyY2gnLFxufTtcbi8vIE51bWJlciBvZiBlbGVtZW50cyBpbiB0aGUgY2FjaGUgYmVmb3JlIHBlcmlvZGljIGNsZWFudXAga2lja3MgaW4uIEluY2x1ZGVzIHBhcnRpYWwgcXVlcnkgc3RyaW5ncy5cbmNvbnN0IE1BWF9DQUNIRURfUVVFUklFUyA9IDEwMDtcbmNvbnN0IENBQ0hFX0NMRUFOX0RFQk9VTkNFX0RFTEFZID0gNTAwMDtcbmNvbnN0IFVQREFURV9ESVJFQ1RPUklFU19ERUJPVU5DRV9ERUxBWSA9IDEwMDtcbmNvbnN0IEdMT0JBTF9LRVkgPSAnZ2xvYmFsJztcbmNvbnN0IERJUkVDVE9SWV9LRVkgPSAnZGlyZWN0b3J5JztcblxuZnVuY3Rpb24gaXNWYWxpZFByb3ZpZGVyKHByb3ZpZGVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgdHlwZW9mIHByb3ZpZGVyLmdldFByb3ZpZGVyVHlwZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBwcm92aWRlci5nZXROYW1lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBwcm92aWRlci5nZXROYW1lKCkgPT09ICdzdHJpbmcnICYmXG4gICAgdHlwZW9mIHByb3ZpZGVyLmlzUmVuZGVyYWJsZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiBwcm92aWRlci5leGVjdXRlUXVlcnkgPT09ICdmdW5jdGlvbicgJiZcbiAgICB0eXBlb2YgcHJvdmlkZXIuZ2V0VGFiVGl0bGUgPT09ICdmdW5jdGlvbidcbiAgKTtcbn1cblxubGV0IHNlYXJjaFJlc3VsdE1hbmFnZXJJbnN0YW5jZSA9IG51bGw7XG4vKipcbiAqIEEgc2luZ2xldG9uIGNhY2hlIGZvciBzZWFyY2ggcHJvdmlkZXJzIGFuZCByZXN1bHRzLlxuICovXG5jbGFzcyBTZWFyY2hSZXN1bHRNYW5hZ2VyIHtcbiAgX2Rpc3BhdGNoZXJUb2tlbjogc3RyaW5nO1xuICBSRVNVTFRTX0NIQU5HRUQ6IHN0cmluZztcbiAgUFJPVklERVJTX0NIQU5HRUQ6IHN0cmluZztcbiAgX2Rpc3BhdGNoZXI6IERpc3BhdGNoZXI7XG4gIF9wcm92aWRlcnNCeURpcmVjdG9yeTogTWFwPGF0b20kRGlyZWN0b3J5LCBTZXQ8UHJvdmlkZXI+PjtcbiAgX2RpcmVjdG9yaWVzOiBBcnJheTxhdG9tJERpcmVjdG9yeT47XG4gIF9jYWNoZWRSZXN1bHRzOiBPYmplY3Q7XG4gIC8vIExpc3Qgb2YgbW9zdCByZWNlbnRseSB1c2VkIHF1ZXJ5IHN0cmluZ3MsIHVzZWQgZm9yIHBydW5pbmcgdGhlIHJlc3VsdCBjYWNoZS5cbiAgLy8gTWFrZXMgdXNlIG9mIGBNYXBgJ3MgaW5zZXJ0aW9uIG9yZGVyaW5nLCBzbyB2YWx1ZXMgYXJlIGlycmVsZXZhbnQgYW5kIGFsd2F5cyBzZXQgdG8gYG51bGxgLlxuICBfcXVlcnlMcnVRdWV1ZTogTWFwPHN0cmluZywgP051bWJlcj47XG4gIF9kZWJvdW5jZWRDbGVhbkNhY2hlOiBGdW5jdGlvbjtcbiAgX2RlYm91bmNlZFVwZGF0ZURpcmVjdG9yaWVzOiBGdW5jdGlvbjtcbiAgX2VtaXR0ZXI6IEVtaXR0ZXI7XG4gIF9zdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBfcmVnaXN0ZXJlZFByb3ZpZGVyczoge1trZXk6IHN0cmluZ106IE1hcDxzdHJpbmcsIFByb3ZpZGVyPjt9O1xuICBfYWN0aXZlUHJvdmlkZXJOYW1lOiBzdHJpbmc7XG4gIF9pc0Rpc3Bvc2VkOiBib29sZWFuO1xuXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBTZWFyY2hSZXN1bHRNYW5hZ2VyIHtcbiAgICBpZiAoIXNlYXJjaFJlc3VsdE1hbmFnZXJJbnN0YW5jZSkge1xuICAgICAgc2VhcmNoUmVzdWx0TWFuYWdlckluc3RhbmNlID0gbmV3IFNlYXJjaFJlc3VsdE1hbmFnZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlYXJjaFJlc3VsdE1hbmFnZXJJbnN0YW5jZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLlJFU1VMVFNfQ0hBTkdFRCA9IFJFU1VMVFNfQ0hBTkdFRDtcbiAgICB0aGlzLlBST1ZJREVSU19DSEFOR0VEID0gUFJPVklERVJTX0NIQU5HRUQ7XG4gICAgdGhpcy5fcmVnaXN0ZXJlZFByb3ZpZGVycyA9IHt9O1xuICAgIHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbRElSRUNUT1JZX0tFWV0gPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJlZFByb3ZpZGVyc1tHTE9CQUxfS0VZXSA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLl9wcm92aWRlcnNCeURpcmVjdG9yeSA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLl9kaXJlY3RvcmllcyA9IFtdO1xuICAgIHRoaXMuX2NhY2hlZFJlc3VsdHMgPSB7fTtcbiAgICB0aGlzLl9kZWJvdW5jZWRDbGVhbkNhY2hlID0gZGVib3VuY2UoXG4gICAgICAoKSA9PiB0aGlzLl9jbGVhbkNhY2hlKCksXG4gICAgICBDQUNIRV9DTEVBTl9ERUJPVU5DRV9ERUxBWSxcbiAgICAgIC8qIGltbWVkaWF0ZSAqL2ZhbHNlXG4gICAgKTtcbiAgICAvLyBgdXBkYXRlRGlyZWN0b3JpZXNgIGpvaW5zIHByb3ZpZGVycyBhbmQgZGlyZWN0b3JpZXMsIHdoaWNoIGRvbid0IGtub3cgYW55dGhpbmcgYWJvdXQgZWFjaFxuICAgIC8vIG90aGVyLiBEZWJvdW5jZSB0aGlzIGNhbGwgdG8gcmVkdWNlIGNodXJuIGF0IHN0YXJ0dXAsIGFuZCB3aGVuIG5ldyBwcm92aWRlcnMgZ2V0IGFjdGl2YXRlZCBvclxuICAgIC8vIGEgbmV3IGRpcmVjdG9yeSBnZXRzIG1vdW50ZWQuXG4gICAgdGhpcy5fZGVib3VuY2VkVXBkYXRlRGlyZWN0b3JpZXMgPSBkZWJvdW5jZShcbiAgICAgICgpID0+IHRoaXMuX3VwZGF0ZURpcmVjdG9yaWVzKCksXG4gICAgICBVUERBVEVfRElSRUNUT1JJRVNfREVCT1VOQ0VfREVMQVksXG4gICAgICAvKiBpbW1lZGlhdGUgKi9mYWxzZVxuICAgICk7XG4gICAgdGhpcy5fcXVlcnlMcnVRdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLl9lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9kaXNwYXRjaGVyID0gUXVpY2tTZWxlY3Rpb25EaXNwYXRjaGVyLmdldEluc3RhbmNlKCk7XG4gICAgLy8gQ2hlY2sgaXMgcmVxdWlyZWQgZm9yIHRlc3RpbmcuXG4gICAgaWYgKGF0b20ucHJvamVjdCkge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoXG4gICAgICAgIHRoaXMuX2RlYm91bmNlZFVwZGF0ZURpcmVjdG9yaWVzLmJpbmQodGhpcykpXG4gICAgICApO1xuICAgICAgdGhpcy5fZGVib3VuY2VkVXBkYXRlRGlyZWN0b3JpZXMoKTtcbiAgICB9XG4gICAgdGhpcy5fc2V0VXBGbHV4KCk7XG4gICAgdGhpcy5fYWN0aXZlUHJvdmlkZXJOYW1lID0gT01OSVNFQVJDSF9QUk9WSURFUi5uYW1lO1xuICB9XG5cbiAgX3NldFVwRmx1eCgpOiB2b2lkIHtcbiAgICB0aGlzLl9kaXNwYXRjaGVyVG9rZW4gPSB0aGlzLl9kaXNwYXRjaGVyLnJlZ2lzdGVyKGFjdGlvbiA9PiB7XG4gICAgICBzd2l0Y2ggKGFjdGlvbi5hY3Rpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgUXVpY2tTZWxlY3Rpb25EaXNwYXRjaGVyLkFjdGlvblR5cGUuUVVFUlk6XG4gICAgICAgICAgdGhpcy5leGVjdXRlUXVlcnkoYWN0aW9uLnF1ZXJ5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBRdWlja1NlbGVjdGlvbkRpc3BhdGNoZXIuQWN0aW9uVHlwZS5BQ1RJVkVfUFJPVklERVJfQ0hBTkdFRDpcbiAgICAgICAgICB0aGlzLl9hY3RpdmVQcm92aWRlck5hbWUgPSBhY3Rpb24ucHJvdmlkZXJOYW1lO1xuICAgICAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdChQUk9WSURFUlNfQ0hBTkdFRCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRBY3RpdmVQcm92aWRlck5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlUHJvdmlkZXJOYW1lO1xuICB9XG5cbiAgZ2V0UmVuZGVyZXJGb3JQcm92aWRlcihwcm92aWRlck5hbWU6IHN0cmluZyk6IFJlc3VsdFJlbmRlcmVyIHtcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuX2dldFByb3ZpZGVyQnlOYW1lKHByb3ZpZGVyTmFtZSk7XG4gICAgaWYgKCFwcm92aWRlciB8fCAhcHJvdmlkZXIuZ2V0Q29tcG9uZW50Rm9ySXRlbSkge1xuICAgICAgcmV0dXJuIHJlcXVpcmUoJy4vRmlsZVJlc3VsdENvbXBvbmVudCcpLmdldENvbXBvbmVudEZvckl0ZW07XG4gICAgfVxuICAgIHJldHVybiBwcm92aWRlci5nZXRDb21wb25lbnRGb3JJdGVtO1xuICB9XG5cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5ldyB0aGUgY2FjaGVkIGxpc3Qgb2YgZGlyZWN0b3JpZXMsIGFzIHdlbGwgYXMgdGhlIGNhY2hlZCBtYXAgb2YgZWxpZ2libGUgcHJvdmlkZXJzXG4gICAqIGZvciBldmVyeSBkaXJlY3RvcnkuXG4gICAqL1xuICBhc3luYyBfdXBkYXRlRGlyZWN0b3JpZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbmV3RGlyZWN0b3JpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKTtcbiAgICBjb25zdCBuZXdQcm92aWRlcnNCeURpcmVjdG9yaWVzID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IGVsaWdpYmlsaXRpZXMgPSBbXTtcbiAgICBuZXdEaXJlY3Rvcmllcy5mb3JFYWNoKGRpcmVjdG9yeSA9PiB7XG4gICAgICBuZXdQcm92aWRlcnNCeURpcmVjdG9yaWVzLnNldChkaXJlY3RvcnksIG5ldyBTZXQoKSk7XG4gICAgICBmb3IgKGNvbnN0IHByb3ZpZGVyIG9mIHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbRElSRUNUT1JZX0tFWV0udmFsdWVzKCkpIHtcbiAgICAgICAgaW52YXJpYW50KFxuICAgICAgICAgIHByb3ZpZGVyLmlzRWxpZ2libGVGb3JEaXJlY3RvcnkgIT0gbnVsbCxcbiAgICAgICAgICBgRGlyZWN0b3J5IHByb3ZpZGVyICR7cHJvdmlkZXIuZ2V0TmFtZSgpfSBtdXN0IHByb3ZpZGUgXFxgaXNFbGlnaWJsZUZvckRpcmVjdG9yeSgpXFxgLmBcbiAgICAgICAgKTtcbiAgICAgICAgZWxpZ2liaWxpdGllcy5wdXNoKFxuICAgICAgICAgIHByb3ZpZGVyLmlzRWxpZ2libGVGb3JEaXJlY3RvcnkoZGlyZWN0b3J5KS50aGVuKGlzRWxpZ2libGUgPT4gKHtcbiAgICAgICAgICAgIGlzRWxpZ2libGUsXG4gICAgICAgICAgICBwcm92aWRlcixcbiAgICAgICAgICAgIGRpcmVjdG9yeSxcbiAgICAgICAgICB9KSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCByZXNvbHZlZEVsaWdpYmlsaXRpZXMgPSBhd2FpdCBQcm9taXNlLmFsbChlbGlnaWJpbGl0aWVzKTtcbiAgICBmb3IgKGNvbnN0IGVsaWdpYmlsaXR5IG9mIHJlc29sdmVkRWxpZ2liaWxpdGllcykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBwcm92aWRlcixcbiAgICAgICAgaXNFbGlnaWJsZSxcbiAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgfSA9IGVsaWdpYmlsaXR5O1xuICAgICAgaWYgKGlzRWxpZ2libGUpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXJzRm9yRGlyZWN0b3J5ID0gbmV3UHJvdmlkZXJzQnlEaXJlY3Rvcmllcy5nZXQoZGlyZWN0b3J5KTtcbiAgICAgICAgaW52YXJpYW50KFxuICAgICAgICAgIHByb3ZpZGVyc0ZvckRpcmVjdG9yeSAhPSBudWxsLFxuICAgICAgICAgIGBQcm92aWRlcnMgZm9yIGRpcmVjdG9yeSAke2RpcmVjdG9yeX0gbm90IGRlZmluZWRgXG4gICAgICAgICk7XG4gICAgICAgIHByb3ZpZGVyc0ZvckRpcmVjdG9yeS5hZGQocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9kaXJlY3RvcmllcyA9IG5ld0RpcmVjdG9yaWVzO1xuICAgIHRoaXMuX3Byb3ZpZGVyc0J5RGlyZWN0b3J5ID0gbmV3UHJvdmlkZXJzQnlEaXJlY3RvcmllcztcbiAgICB0aGlzLl9lbWl0dGVyLmVtaXQoUFJPVklERVJTX0NIQU5HRUQpO1xuICB9XG5cbiAgb24oKTogSURpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLl9lbWl0dGVyLm9uKC4uLmFyZ3VtZW50cyk7XG4gIH1cblxuICByZWdpc3RlclByb3ZpZGVyKHNlcnZpY2U6IFByb3ZpZGVyKTogSURpc3Bvc2FibGUge1xuICAgIGlmICghaXNWYWxpZFByb3ZpZGVyKHNlcnZpY2UpKSB7XG4gICAgICBjb25zdCBwcm92aWRlck5hbWUgPSBzZXJ2aWNlLmdldE5hbWUgJiYgc2VydmljZS5nZXROYW1lKCkgfHwgJzx1bmtub3duPic7XG4gICAgICBnZXRMb2dnZXIoKS5lcnJvcihgUXVpY2stb3BlbiBwcm92aWRlciAke3Byb3ZpZGVyTmFtZX0gaXMgbm90IGEgdmFsaWQgcHJvdmlkZXJgKTtcbiAgICB9XG4gICAgY29uc3QgaXNSZW5kZXJhYmxlUHJvdmlkZXIgPVxuICAgICAgdHlwZW9mIHNlcnZpY2UuaXNSZW5kZXJhYmxlID09PSAnZnVuY3Rpb24nICYmIHNlcnZpY2UuaXNSZW5kZXJhYmxlKCk7XG4gICAgY29uc3QgaXNHbG9iYWxQcm92aWRlciA9IHNlcnZpY2UuZ2V0UHJvdmlkZXJUeXBlKCkgPT09ICdHTE9CQUwnO1xuICAgIGNvbnN0IHRhcmdldFJlZ2lzdHJ5ID0gaXNHbG9iYWxQcm92aWRlclxuICAgICAgPyB0aGlzLl9yZWdpc3RlcmVkUHJvdmlkZXJzW0dMT0JBTF9LRVldXG4gICAgICA6IHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbRElSRUNUT1JZX0tFWV07XG4gICAgdGFyZ2V0UmVnaXN0cnkuc2V0KHNlcnZpY2UuZ2V0TmFtZSgpLCBzZXJ2aWNlKTtcbiAgICBpZiAoIWlzR2xvYmFsUHJvdmlkZXIpIHtcbiAgICAgIHRoaXMuX2RlYm91bmNlZFVwZGF0ZURpcmVjdG9yaWVzKCk7XG4gICAgfVxuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGRpc3Bvc2FibGUuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIC8vIFRoaXMgbWF5IGJlIGNhbGxlZCBhZnRlciB0aGlzIHBhY2thZ2UgaGFzIGJlZW4gZGVhY3RpdmF0ZWRcbiAgICAgIC8vIGFuZCB0aGUgU2VhcmNoUmVzdWx0TWFuYWdlciBoYXMgYmVlbiBkaXNwb3NlZC5cbiAgICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNlcnZpY2VOYW1lID0gc2VydmljZS5nZXROYW1lKCk7XG4gICAgICB0YXJnZXRSZWdpc3RyeS5kZWxldGUoc2VydmljZU5hbWUpO1xuICAgICAgdGhpcy5fcHJvdmlkZXJzQnlEaXJlY3RvcnkuZm9yRWFjaCgocHJvdmlkZXJzLCBkaXIpID0+IHtcbiAgICAgICAgcHJvdmlkZXJzLmRlbGV0ZShzZXJ2aWNlKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fcmVtb3ZlUmVzdWx0c0ZvclByb3ZpZGVyKHNlcnZpY2VOYW1lKTtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdChQUk9WSURFUlNfQ0hBTkdFRCk7XG4gICAgfSkpO1xuICAgIC8vIElmIHRoZSBwcm92aWRlciBpcyByZW5kZXJhYmxlIGFuZCBzcGVjaWZpZXMgYSBrZXliaW5kaW5nLCB3aXJlIGl0IHVwIHdpdGggdGhlIHRvZ2dsZSBjb21tYW5kLlxuICAgIGlmIChpc1JlbmRlcmFibGVQcm92aWRlciAmJiB0eXBlb2Ygc2VydmljZS5nZXRBY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0IHRvZ2dsZUFjdGlvbjogc3RyaW5nID0gc2VydmljZS5nZXRBY3Rpb24oKTtcbiAgICAgIC8vIFRPRE8gcmVwbGFjZSB3aXRoIGNvbXB1dGVkIHByb3BlcnR5IG9uY2UgRmxvdyBzdXBwb3J0cyBpdC5cbiAgICAgIGNvbnN0IGFjdGlvblNwZWMgPSB7fTtcbiAgICAgIGFjdGlvblNwZWNbdG9nZ2xlQWN0aW9uXSA9XG4gICAgICAgICgpID0+IFF1aWNrU2VsZWN0aW9uQWN0aW9ucy5jaGFuZ2VBY3RpdmVQcm92aWRlcihzZXJ2aWNlLmdldE5hbWUoKSk7XG4gICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCBhY3Rpb25TcGVjKSk7XG4gICAgfVxuICAgIHJldHVybiBkaXNwb3NhYmxlO1xuICB9XG5cbiAgX3JlbW92ZVJlc3VsdHNGb3JQcm92aWRlcihwcm92aWRlck5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV07XG4gICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoUkVTVUxUU19DSEFOR0VEKTtcbiAgICB9XG4gIH1cblxuICBzZXRDYWNoZVJlc3VsdChcbiAgICBwcm92aWRlck5hbWU6IHN0cmluZyxcbiAgICBkaXJlY3Rvcnk6IHN0cmluZyxcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIHJlc3VsdDogQXJyYXk8RmlsZVJlc3VsdD4sXG4gICAgbG9hZGluZzogP2Jvb2xlYW4gPSBmYWxzZSxcbiAgICBlcnJvcjogP09iamVjdCA9IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLmVuc3VyZUNhY2hlRW50cnkocHJvdmlkZXJOYW1lLCBkaXJlY3RvcnkpO1xuICAgIHRoaXMuX2NhY2hlZFJlc3VsdHNbcHJvdmlkZXJOYW1lXVtkaXJlY3RvcnldW3F1ZXJ5XSA9IHtcbiAgICAgIHJlc3VsdCxcbiAgICAgIGxvYWRpbmcsXG4gICAgICBlcnJvcixcbiAgICB9O1xuICAgIC8vIFJlZnJlc2ggdGhlIHVzYWdlIGZvciB0aGUgY3VycmVudCBxdWVyeS5cbiAgICB0aGlzLl9xdWVyeUxydVF1ZXVlLmRlbGV0ZShxdWVyeSk7XG4gICAgdGhpcy5fcXVlcnlMcnVRdWV1ZS5zZXQocXVlcnksIG51bGwpO1xuICAgIHNldEltbWVkaWF0ZSh0aGlzLl9kZWJvdW5jZWRDbGVhbkNhY2hlKTtcbiAgfVxuXG4gIGVuc3VyZUNhY2hlRW50cnkocHJvdmlkZXJOYW1lOiBzdHJpbmcsIGRpcmVjdG9yeTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV0pIHtcbiAgICAgIHRoaXMuX2NhY2hlZFJlc3VsdHNbcHJvdmlkZXJOYW1lXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2NhY2hlZFJlc3VsdHNbcHJvdmlkZXJOYW1lXVtkaXJlY3RvcnldKSB7XG4gICAgICB0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV1bZGlyZWN0b3J5XSA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIGNhY2hlUmVzdWx0KHF1ZXJ5OiBzdHJpbmcsIHJlc3VsdDogQXJyYXk8RmlsZVJlc3VsdD4sIGRpcmVjdG9yeTogc3RyaW5nLCBwcm92aWRlcjogT2JqZWN0KTogdm9pZCB7XG4gICAgY29uc3QgcHJvdmlkZXJOYW1lID0gcHJvdmlkZXIuZ2V0TmFtZSgpO1xuICAgIHRoaXMuc2V0Q2FjaGVSZXN1bHQocHJvdmlkZXJOYW1lLCBkaXJlY3RvcnksIHF1ZXJ5LCByZXN1bHQsIGZhbHNlLCBudWxsKTtcbiAgfVxuXG4gIF9zZXRMb2FkaW5nKHF1ZXJ5OiBzdHJpbmcsIGRpcmVjdG9yeTogc3RyaW5nLCBwcm92aWRlcjogT2JqZWN0KTogdm9pZCB7XG4gICAgY29uc3QgcHJvdmlkZXJOYW1lID0gcHJvdmlkZXIuZ2V0TmFtZSgpO1xuICAgIHRoaXMuZW5zdXJlQ2FjaGVFbnRyeShwcm92aWRlck5hbWUsIGRpcmVjdG9yeSk7XG4gICAgY29uc3QgcHJldmlvdXNSZXN1bHQgPSB0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV1bZGlyZWN0b3J5XVtxdWVyeV07XG4gICAgaWYgKCFwcmV2aW91c1Jlc3VsdCkge1xuICAgICAgdGhpcy5fY2FjaGVkUmVzdWx0c1twcm92aWRlck5hbWVdW2RpcmVjdG9yeV1bcXVlcnldID0ge1xuICAgICAgICByZXN1bHQ6IFtdLFxuICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2UgdGhlIG9sZGVzdCBjYWNoZWQgcmVzdWx0cyBvbmNlIHRoZSBjYWNoZSBpcyBmdWxsLlxuICAgKi9cbiAgX2NsZWFuQ2FjaGUoKTogdm9pZCB7XG4gICAgY29uc3QgcXVldWVTaXplID0gdGhpcy5fcXVlcnlMcnVRdWV1ZS5zaXplO1xuICAgIGlmIChxdWV1ZVNpemUgPD0gTUFYX0NBQ0hFRF9RVUVSSUVTKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEZpZ3VyZSBvdXQgbGVhc3QgcmVjZW50bHkgdXNlZCBxdWVyaWVzLCBhbmQgcG9wIHRoZW0gb2ZmIG9mIHRoZSBgX3F1ZXJ5THJ1UXVldWVgIE1hcC5cbiAgICBjb25zdCBleHBpcmVkUXVlcmllcyA9IFtdO1xuICAgIGNvbnN0IGtleUl0ZXJhdG9yID0gdGhpcy5fcXVlcnlMcnVRdWV1ZS5rZXlzKCk7XG4gICAgY29uc3QgZW50cmllc1RvUmVtb3ZlID0gcXVldWVTaXplIC0gTUFYX0NBQ0hFRF9RVUVSSUVTO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllc1RvUmVtb3ZlOyBpKyspIHtcbiAgICAgIGNvbnN0IGZpcnN0RW50cnlLZXkgPSBrZXlJdGVyYXRvci5uZXh0KCkudmFsdWU7XG4gICAgICBleHBpcmVkUXVlcmllcy5wdXNoKGZpcnN0RW50cnlLZXkpO1xuICAgICAgaW52YXJpYW50KGZpcnN0RW50cnlLZXkgIT0gbnVsbCk7XG4gICAgICB0aGlzLl9xdWVyeUxydVF1ZXVlLmRlbGV0ZShmaXJzdEVudHJ5S2V5KTtcbiAgICB9XG5cbiAgICAvLyBGb3IgZWFjaCAocHJvdmlkZXJ8ZGlyZWN0b3J5KSBwYWlyLCByZW1vdmUgcmVzdWx0cyBmb3IgYWxsIGV4cGlyZWQgcXVlcmllcyBmcm9tIHRoZSBjYWNoZS5cbiAgICBmb3IgKGNvbnN0IHByb3ZpZGVyTmFtZSBpbiB0aGlzLl9jYWNoZWRSZXN1bHRzKSB7XG4gICAgICBmb3IgKGNvbnN0IGRpcmVjdG9yeSBpbiB0aGlzLl9jYWNoZWRSZXN1bHRzW3Byb3ZpZGVyTmFtZV0pIHtcbiAgICAgICAgY29uc3QgcXVlcnlSZXN1bHRzID0gdGhpcy5fY2FjaGVkUmVzdWx0c1twcm92aWRlck5hbWVdW2RpcmVjdG9yeV07XG4gICAgICAgIGV4cGlyZWRRdWVyaWVzLmZvckVhY2gocXVlcnkgPT4gZGVsZXRlIHF1ZXJ5UmVzdWx0c1txdWVyeV0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9lbWl0dGVyLmVtaXQoUkVTVUxUU19DSEFOR0VEKTtcbiAgfVxuXG4gIHByb2Nlc3NSZXN1bHQoXG4gICAgcXVlcnk6IHN0cmluZyxcbiAgICByZXN1bHQ6IEFycmF5PEZpbGVSZXN1bHQ+LFxuICAgIGRpcmVjdG9yeTogc3RyaW5nLFxuICAgIHByb3ZpZGVyOiBPYmplY3RcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5jYWNoZVJlc3VsdCguLi5hcmd1bWVudHMpO1xuICAgIHRoaXMuX2VtaXR0ZXIuZW1pdChSRVNVTFRTX0NIQU5HRUQpO1xuICB9XG5cbiAgc2FuaXRpemVRdWVyeShxdWVyeTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcXVlcnkudHJpbSgpO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHJhd1F1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBxdWVyeSA9IHRoaXMuc2FuaXRpemVRdWVyeShyYXdRdWVyeSk7XG4gICAgZm9yIChjb25zdCBnbG9iYWxQcm92aWRlciBvZiB0aGlzLl9yZWdpc3RlcmVkUHJvdmlkZXJzW0dMT0JBTF9LRVldLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIGdsb2JhbFByb3ZpZGVyLmV4ZWN1dGVRdWVyeShxdWVyeSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICB0cmFjayhBbmFseXRpY3NFdmVudHMuUVVFUllfU09VUkNFX1BST1ZJREVSLCB7XG4gICAgICAgICAgJ3F1aWNrb3Blbi1zb3VyY2UtcHJvdmlkZXInOiBnbG9iYWxQcm92aWRlci5nZXROYW1lKCksXG4gICAgICAgICAgJ3F1aWNrb3Blbi1xdWVyeS1kdXJhdGlvbic6IChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0VGltZSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAncXVpY2tvcGVuLXJlc3VsdC1jb3VudCc6IChyZXN1bHQubGVuZ3RoKS50b1N0cmluZygpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5wcm9jZXNzUmVzdWx0KHF1ZXJ5LCByZXN1bHQsIEdMT0JBTF9LRVksIGdsb2JhbFByb3ZpZGVyKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fc2V0TG9hZGluZyhxdWVyeSwgR0xPQkFMX0tFWSwgZ2xvYmFsUHJvdmlkZXIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcHJvdmlkZXJzQnlEaXJlY3Rvcnkuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9kaXJlY3Rvcmllcy5mb3JFYWNoKGRpcmVjdG9yeSA9PiB7XG4gICAgICBjb25zdCBwYXRoID0gZGlyZWN0b3J5LmdldFBhdGgoKTtcbiAgICAgIGNvbnN0IHByb3ZpZGVycyA9IHRoaXMuX3Byb3ZpZGVyc0J5RGlyZWN0b3J5LmdldChkaXJlY3RvcnkpO1xuICAgICAgaWYgKCFwcm92aWRlcnMpIHtcbiAgICAgICAgLy8gU3BlY2lhbCBkaXJlY3RvcmllcyBsaWtlIFwiYXRvbTovL2Fib3V0XCJcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBkaXJlY3RvcnlQcm92aWRlciBvZiBwcm92aWRlcnMpIHtcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGRpcmVjdG9yeVByb3ZpZGVyLmV4ZWN1dGVRdWVyeShxdWVyeSwgZGlyZWN0b3J5KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgdHJhY2soQW5hbHl0aWNzRXZlbnRzLlFVRVJZX1NPVVJDRV9QUk9WSURFUiwge1xuICAgICAgICAgICAgJ3F1aWNrb3Blbi1zb3VyY2UtcHJvdmlkZXInOiBkaXJlY3RvcnlQcm92aWRlci5nZXROYW1lKCksXG4gICAgICAgICAgICAncXVpY2tvcGVuLXF1ZXJ5LWR1cmF0aW9uJzogKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRUaW1lKS50b1N0cmluZygpLFxuICAgICAgICAgICAgJ3F1aWNrb3Blbi1yZXN1bHQtY291bnQnOiAocmVzdWx0Lmxlbmd0aCkudG9TdHJpbmcoKSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLnByb2Nlc3NSZXN1bHQocXVlcnksIHJlc3VsdCwgcGF0aCwgZGlyZWN0b3J5UHJvdmlkZXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fc2V0TG9hZGluZyhxdWVyeSwgcGF0aCwgZGlyZWN0b3J5UHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2VtaXR0ZXIuZW1pdChSRVNVTFRTX0NIQU5HRUQpO1xuICB9XG5cbiAgX2lzR2xvYmFsUHJvdmlkZXIocHJvdmlkZXJOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJlZFByb3ZpZGVyc1tHTE9CQUxfS0VZXS5oYXMocHJvdmlkZXJOYW1lKTtcbiAgfVxuXG4gIF9nZXRQcm92aWRlckJ5TmFtZShwcm92aWRlck5hbWU6IHN0cmluZyk6IFByb3ZpZGVyIHtcbiAgICBsZXQgZGlyUHJvdmlkZXJOYW1lO1xuICAgIGlmICh0aGlzLl9pc0dsb2JhbFByb3ZpZGVyKHByb3ZpZGVyTmFtZSkpIHtcbiAgICAgIGRpclByb3ZpZGVyTmFtZSA9IHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbR0xPQkFMX0tFWV0uZ2V0KHByb3ZpZGVyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpclByb3ZpZGVyTmFtZSA9IHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbRElSRUNUT1JZX0tFWV0uZ2V0KHByb3ZpZGVyTmFtZSk7XG4gICAgfVxuICAgIGludmFyaWFudChcbiAgICAgIGRpclByb3ZpZGVyTmFtZSAhPSBudWxsLFxuICAgICAgYFByb3ZpZGVyICR7cHJvdmlkZXJOYW1lfSBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHF1aWNrLW9wZW4uYFxuICAgICk7XG4gICAgcmV0dXJuIGRpclByb3ZpZGVyTmFtZTtcbiAgfVxuXG4gIF9nZXRSZXN1bHRzRm9yUHJvdmlkZXIocXVlcnk6IHN0cmluZywgcHJvdmlkZXJOYW1lOiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IHByb3ZpZGVyUGF0aHMgPSB0aGlzLl9pc0dsb2JhbFByb3ZpZGVyKHByb3ZpZGVyTmFtZSlcbiAgICAgID8gW0dMT0JBTF9LRVldXG4gICAgICA6IHRoaXMuX2RpcmVjdG9yaWVzLm1hcChkID0+IGQuZ2V0UGF0aCgpKTtcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMuX2dldFByb3ZpZGVyQnlOYW1lKHByb3ZpZGVyTmFtZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBwcm92aWRlci5nZXRUYWJUaXRsZSgpLFxuICAgICAgcmVzdWx0czogcHJvdmlkZXJQYXRocy5yZWR1Y2UoKHJlc3VsdHMsIHBhdGgpID0+IHtcbiAgICAgICAgbGV0IGNhY2hlZFBhdGhzLCBjYWNoZWRRdWVyaWVzLCBjYWNoZWRSZXN1bHQ7XG4gICAgICAgIGlmICghKFxuICAgICAgICAgIChjYWNoZWRQYXRocyA9IHRoaXMuX2NhY2hlZFJlc3VsdHNbcHJvdmlkZXJOYW1lXSkgJiZcbiAgICAgICAgICAoY2FjaGVkUXVlcmllcyA9IGNhY2hlZFBhdGhzW3BhdGhdKSAmJlxuICAgICAgICAgIChjYWNoZWRSZXN1bHQgPSBjYWNoZWRRdWVyaWVzW3F1ZXJ5XSlcbiAgICAgICAgKSkge1xuICAgICAgICAgIGNhY2hlZFJlc3VsdCA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZmF1bHRSZXN1bHQgPSBnZXREZWZhdWx0UmVzdWx0KCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdExpc3QgPSBjYWNoZWRSZXN1bHQucmVzdWx0IHx8IGRlZmF1bHRSZXN1bHQucmVzdWx0cztcbiAgICAgICAgcmVzdWx0c1twYXRoXSA9IHtcbiAgICAgICAgICByZXN1bHRzOiByZXN1bHRMaXN0Lm1hcChyZXN1bHQgPT4gKHsuLi5yZXN1bHQsIHNvdXJjZVByb3ZpZGVyOiBwcm92aWRlck5hbWV9KSksXG4gICAgICAgICAgbG9hZGluZzogY2FjaGVkUmVzdWx0LmxvYWRpbmcgfHwgZGVmYXVsdFJlc3VsdC5sb2FkaW5nLFxuICAgICAgICAgIGVycm9yOiBjYWNoZWRSZXN1bHQuZXJyb3IgfHwgZGVmYXVsdFJlc3VsdC5lcnJvcixcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCB7fSksXG4gICAgfTtcbiAgfVxuXG4gIGdldFJlc3VsdHMocXVlcnk6IHN0cmluZywgYWN0aXZlUHJvdmlkZXJOYW1lOiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IHNhbml0aXplZFF1ZXJ5ID0gdGhpcy5zYW5pdGl6ZVF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAoYWN0aXZlUHJvdmlkZXJOYW1lID09PSBPTU5JU0VBUkNIX1BST1ZJREVSLm5hbWUpIHtcbiAgICAgIGNvbnN0IG9tbmlTZWFyY2hSZXN1bHRzID0gW3t9XTtcbiAgICAgIGZvciAoY29uc3QgcHJvdmlkZXJOYW1lIGluIHRoaXMuX2NhY2hlZFJlc3VsdHMpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0Rm9yUHJvdmlkZXIgPSB0aGlzLl9nZXRSZXN1bHRzRm9yUHJvdmlkZXIoc2FuaXRpemVkUXVlcnksIHByb3ZpZGVyTmFtZSk7XG4gICAgICAgIC8vIFRPRE8gcmVwbGFjZSB0aGlzIHdpdGggYSByYW5raW5nIGFsZ29yaXRobS5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgaW4gcmVzdWx0Rm9yUHJvdmlkZXIucmVzdWx0cykge1xuICAgICAgICAgIHJlc3VsdEZvclByb3ZpZGVyLnJlc3VsdHNbZGlyXS5yZXN1bHRzID1cbiAgICAgICAgICAgIHJlc3VsdEZvclByb3ZpZGVyLnJlc3VsdHNbZGlyXS5yZXN1bHRzLnNsaWNlKDAsIE1BWF9PTU5JX1JFU1VMVFNfUEVSX1NFUlZJQ0UpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE8gcmVwbGFjZSBgcGFydGlhbGAgd2l0aCBjb21wdXRlZCBwcm9wZXJ0eSB3aGVuZXZlciBGbG93IHN1cHBvcnRzIGl0LlxuICAgICAgICBjb25zdCBwYXJ0aWFsID0ge307XG4gICAgICAgIHBhcnRpYWxbcHJvdmlkZXJOYW1lXSA9IHJlc3VsdEZvclByb3ZpZGVyO1xuICAgICAgICBvbW5pU2VhcmNoUmVzdWx0cy5wdXNoKHBhcnRpYWwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFzc2lnbi5hcHBseSh7fSwgb21uaVNlYXJjaFJlc3VsdHMpO1xuICAgIH1cbiAgICAvLyBUT0RPIHJlcGxhY2UgYHBhcnRpYWxgIHdpdGggY29tcHV0ZWQgcHJvcGVydHkgd2hlbmV2ZXIgRmxvdyBzdXBwb3J0cyBpdC5cbiAgICBjb25zdCBwYXJ0aWFsID0ge307XG4gICAgcGFydGlhbFthY3RpdmVQcm92aWRlck5hbWVdID0gdGhpcy5fZ2V0UmVzdWx0c0ZvclByb3ZpZGVyKHNhbml0aXplZFF1ZXJ5LCBhY3RpdmVQcm92aWRlck5hbWUpO1xuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgZ2V0UHJvdmlkZXJCeU5hbWUocHJvdmlkZXJOYW1lOiBzdHJpbmcpOiBQcm92aWRlclNwZWMge1xuICAgIGlmIChwcm92aWRlck5hbWUgPT09IE9NTklTRUFSQ0hfUFJPVklERVIubmFtZSkge1xuICAgICAgcmV0dXJuIHsuLi5PTU5JU0VBUkNIX1BST1ZJREVSfTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Jha2VQcm92aWRlcih0aGlzLl9nZXRQcm92aWRlckJ5TmFtZShwcm92aWRlck5hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUdXJuIGEgUHJvdmlkZXIgaW50byBhIHBsYWluIFwic3BlY1wiIG9iamVjdCBjb25zdW1lZCBieSBRdWlja1NlbGVjdGlvbkNvbXBvbmVudC5cbiAgICovXG4gIF9iYWtlUHJvdmlkZXIocHJvdmlkZXI6IFByb3ZpZGVyKTogUHJvdmlkZXJTcGVjIHtcbiAgICBjb25zdCBwcm92aWRlck5hbWUgPSBwcm92aWRlci5nZXROYW1lKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGlvbjogcHJvdmlkZXIuZ2V0QWN0aW9uICYmIHByb3ZpZGVyLmdldEFjdGlvbigpIHx8ICcnLFxuICAgICAgZGVib3VuY2VEZWxheTogKHR5cGVvZiBwcm92aWRlci5nZXREZWJvdW5jZURlbGF5ID09PSAnZnVuY3Rpb24nKVxuICAgICAgICA/IHByb3ZpZGVyLmdldERlYm91bmNlRGVsYXkoKVxuICAgICAgICA6IERFRkFVTFRfUVVFUllfREVCT1VOQ0VfREVMQVksXG4gICAgICBuYW1lOiBwcm92aWRlck5hbWUsXG4gICAgICBwcm9tcHQ6IHByb3ZpZGVyLmdldFByb21wdFRleHQgJiYgcHJvdmlkZXIuZ2V0UHJvbXB0VGV4dCgpIHx8XG4gICAgICAgICdTZWFyY2ggJyArIHByb3ZpZGVyTmFtZSxcbiAgICAgIHRpdGxlOiBwcm92aWRlci5nZXRUYWJUaXRsZSAmJiBwcm92aWRlci5nZXRUYWJUaXRsZSgpIHx8IHByb3ZpZGVyTmFtZSxcbiAgICB9O1xuICB9XG5cbiAgZ2V0UmVuZGVyYWJsZVByb3ZpZGVycygpOiBBcnJheTxQcm92aWRlclNwZWM+IHtcbiAgICAvLyBPbmx5IHJlbmRlciB0YWJzIGZvciBwcm92aWRlcnMgdGhhdCBhcmUgZWxpZ2libGUgZm9yIGF0IGxlYXN0IG9uZSBkaXJlY3RvcnkuXG4gICAgY29uc3QgZWxpZ2libGVEaXJlY3RvcnlQcm92aWRlcnMgPSBhcnJheS5mcm9tKHRoaXMuX3JlZ2lzdGVyZWRQcm92aWRlcnNbRElSRUNUT1JZX0tFWV0udmFsdWVzKCkpXG4gICAgICAuZmlsdGVyKHByb3ZpZGVyID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBwcm92aWRlcnMgb2YgdGhpcy5fcHJvdmlkZXJzQnlEaXJlY3RvcnkudmFsdWVzKCkpIHtcbiAgICAgICAgICBpZiAocHJvdmlkZXJzLmhhcyhwcm92aWRlcikpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICBjb25zdCB0YWJzID0gYXJyYXkuZnJvbSh0aGlzLl9yZWdpc3RlcmVkUHJvdmlkZXJzW0dMT0JBTF9LRVldLnZhbHVlcygpKVxuICAgICAgLmNvbmNhdChlbGlnaWJsZURpcmVjdG9yeVByb3ZpZGVycylcbiAgICAgIC5maWx0ZXIocHJvdmlkZXIgPT4gcHJvdmlkZXIuaXNSZW5kZXJhYmxlKCkpXG4gICAgICAubWFwKHRoaXMuX2Jha2VQcm92aWRlcilcbiAgICAgIC5zb3J0KChwMSwgcDIpID0+IHAxLm5hbWUubG9jYWxlQ29tcGFyZShwMi5uYW1lKSk7XG4gICAgdGFicy51bnNoaWZ0KE9NTklTRUFSQ0hfUFJPVklERVIpO1xuICAgIHJldHVybiB0YWJzO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VhcmNoUmVzdWx0TWFuYWdlcjtcblxuZXhwb3J0IGNvbnN0IF9fdGVzdF9fID0ge1xuICBfZ2V0T21uaVNlYXJjaFByb3ZpZGVyU3BlYygpOiBQcm92aWRlclNwZWMge1xuICAgIHJldHVybiBPTU5JU0VBUkNIX1BST1ZJREVSO1xuICB9LFxufTtcbiJdfQ==