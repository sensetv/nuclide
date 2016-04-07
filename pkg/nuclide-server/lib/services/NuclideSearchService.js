

// TODO (mikeo): Make this another search provider

var doSearchDirectory = _asyncToGenerator(function* (directoryUri, query) {
  var search = fileSearchers[directoryUri];
  if (search === undefined) {
    var directory = remoteUri.parse(directoryUri).path;

    var exists = yield fsPromise.exists(directory);
    if (!exists) {
      throw new Error('Could not find directory to search : ' + directory);
    }

    var stat = yield fsPromise.stat(directory);
    if (!stat.isDirectory()) {
      throw new Error('Provided path is not a directory : ' + directory);
    }

    search = yield fileSearchForDirectory(directoryUri);
    fileSearchers[directoryUri] = search;
  }

  return yield search.query(query);
});

var getSearchProviders = _asyncToGenerator(function* (cwd) {
  var checkAvailability = _asyncToGenerator(function* (providerName) {
    (0, _assert2['default'])(providers);
    var isAvailable = yield providers[providerName].isAvailable(cwd);
    return isAvailable ? { name: providerName } : null;
  });

  var validPromises = [];

  for (var _name in providers) {
    validPromises.push(checkAvailability(_name));
  }

  var allResults = yield Promise.all(validPromises);
  // Any is required here as otherwise we get a flow error in core.js
  return allResults.filter(function (provider) {
    return provider != null;
  });
});

var doSearchQuery = _asyncToGenerator(function* (cwd, provider, query) {
  (0, _assert2['default'])(providers);
  var currentProvider = providers[provider];
  if (!currentProvider) {
    throw new Error('Invalid provider: ' + provider);
  }
  (0, _assert2['default'])(currentProvider != null);
  var results = yield currentProvider.query(cwd, query);
  return { results: results };
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('../../../nuclide-commons');

var fsPromise = _require.fsPromise;

var _require2 = require('../../../nuclide-path-search');

var fileSearchForDirectory = _require2.fileSearchForDirectory;

var remoteUri = require('../../../nuclide-remote-uri');

var providers = undefined;

/*
 * TODO(williamsc): This needs to have some better
 *                  managment tools (Adding/removing query sets).
 */

// Cache of previously indexed folders for later use.
var fileSearchers = Object.create(null);

function addProvider(name, provider) {
  providers = providers || {};
  if (providers[name]) {
    throw new Error(name + ' has already been added as a provider.');
  }
  providers[name] = provider;
}

function clearProviders() {
  providers = null;
}

function initialize() {}

function shutdown() {
  clearProviders();
  for (var k in fileSearchers) {
    fileSearchers[k].dispose();
  }
  fileSearchers = Object.create(null);
}

module.exports = {
  initialize: initialize,
  shutdown: shutdown,
  addProvider: addProvider,
  clearProviders: clearProviders,
  services: {
    '/search/query': { handler: doSearchQuery, method: 'post' },
    '/search/listProviders': { handler: getSearchProviders, method: 'post' },
    '/search/directory': { handler: doSearchDirectory }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk51Y2xpZGVTZWFyY2hTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFxRGUsaUJBQWlCLHFCQUFoQyxXQUNFLFlBQW9CLEVBQ3BCLEtBQWEsRUFDcUI7QUFDbEMsTUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3pDLE1BQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtBQUN4QixRQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQzs7QUFFckQsUUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pELFFBQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxZQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxHQUFHLFNBQVMsQ0FBQyxDQUFDO0tBQ3RFOztBQUVELFFBQU0sSUFBSSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3QyxRQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO0FBQ3ZCLFlBQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLEdBQUcsU0FBUyxDQUFDLENBQUM7S0FDcEU7O0FBRUQsVUFBTSxHQUFHLE1BQU0sc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDcEQsaUJBQWEsQ0FBQyxZQUFZLENBQUMsR0FBRyxNQUFNLENBQUM7R0FDdEM7O0FBRUQsU0FBTyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbEM7O0lBRWMsa0JBQWtCLHFCQUFqQyxXQUFrQyxHQUFXLEVBQWdDO01BRzVELGlCQUFpQixxQkFBaEMsV0FBaUMsWUFBb0IsRUFBMEI7QUFDN0UsNkJBQVUsU0FBUyxDQUFDLENBQUM7QUFDckIsUUFBTSxXQUFXLEdBQUcsTUFBTSxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FB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U2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnR5cGUgUHJvdmlkZXJJbmZvID0ge1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbnR5cGUgU2VhcmNoUXVlcnlSZXN1bHQgPSB7XG4gIGxpbmU6IG51bWJlcjtcbiAgY29sdW1uOiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcGF0aDogc3RyaW5nO1xuICBsZW5ndGg6IG51bWJlcjtcbiAgc2NvcGU6IHN0cmluZztcbiAgYWRkaXRpb25hbEluZm86IHN0cmluZztcbiAgYWN0aW9uOiBzdHJpbmc7XG59XG5cbnR5cGUgU2VhcmNoUmVzcG9uc2UgPSB7XG4gIHJlc3VsdHM6IEFycmF5PFNlYXJjaFF1ZXJ5UmVzdWx0Pjtcbn1cblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHR5cGUge0ZpbGVTZWFyY2hSZXN1bHR9IGZyb20gJy4uLy4uLy4uL251Y2xpZGUtcGF0aC1zZWFyY2gnO1xuXG5jb25zdCB7ZnNQcm9taXNlfSA9IHJlcXVpcmUoJy4uLy4uLy4uL251Y2xpZGUtY29tbW9ucycpO1xuY29uc3Qge2ZpbGVTZWFyY2hGb3JEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnLi4vLi4vLi4vbnVjbGlkZS1wYXRoLXNlYXJjaCcpO1xuY29uc3QgcmVtb3RlVXJpID0gcmVxdWlyZSgnLi4vLi4vLi4vbnVjbGlkZS1yZW1vdGUtdXJpJyk7XG5cbnR5cGUgU2VhcmNoUHJvdmlkZXIgPSB7XG4gIGlzQXZhaWxhYmxlOiAoY3dkOiBzdHJpbmcpID0+IGJvb2xlYW47XG4gIHF1ZXJ5OiAoY3dkOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcpID0+IFByb21pc2U8QXJyYXk8U2VhcmNoUXVlcnlSZXN1bHQ+Pjtcbn07XG5cbmxldCBwcm92aWRlcnM6ID97W3Byb3ZpZGVyTmFtZTogc3RyaW5nXTogU2VhcmNoUHJvdmlkZXJ9O1xuXG4vKlxuICogVE9ETyh3aWxsaWFtc2MpOiBUaGlzIG5lZWRzIHRvIGhhdmUgc29tZSBiZXR0ZXJcbiAqICAgICAgICAgICAgICAgICAgbWFuYWdtZW50IHRvb2xzIChBZGRpbmcvcmVtb3ZpbmcgcXVlcnkgc2V0cykuXG4gKi9cblxuLy8gQ2FjaGUgb2YgcHJldmlvdXNseSBpbmRleGVkIGZvbGRlcnMgZm9yIGxhdGVyIHVzZS5cbmxldCBmaWxlU2VhcmNoZXJzOiBhbnkgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4vLyBUT0RPIChtaWtlbyk6IE1ha2UgdGhpcyBhbm90aGVyIHNlYXJjaCBwcm92aWRlclxuYXN5bmMgZnVuY3Rpb24gZG9TZWFyY2hEaXJlY3RvcnkoXG4gIGRpcmVjdG9yeVVyaTogc3RyaW5nLFxuICBxdWVyeTogc3RyaW5nXG4pOiBQcm9taXNlPEFycmF5PEZpbGVTZWFyY2hSZXN1bHQ+PiB7XG4gIGxldCBzZWFyY2ggPSBmaWxlU2VhcmNoZXJzW2RpcmVjdG9yeVVyaV07XG4gIGlmIChzZWFyY2ggPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGRpcmVjdG9yeSA9IHJlbW90ZVVyaS5wYXJzZShkaXJlY3RvcnlVcmkpLnBhdGg7XG5cbiAgICBjb25zdCBleGlzdHMgPSBhd2FpdCBmc1Byb21pc2UuZXhpc3RzKGRpcmVjdG9yeSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgZGlyZWN0b3J5IHRvIHNlYXJjaCA6ICcgKyBkaXJlY3RvcnkpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBmc1Byb21pc2Uuc3RhdChkaXJlY3RvcnkpO1xuICAgIGlmICghc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVkIHBhdGggaXMgbm90IGEgZGlyZWN0b3J5IDogJyArIGRpcmVjdG9yeSk7XG4gICAgfVxuXG4gICAgc2VhcmNoID0gYXdhaXQgZmlsZVNlYXJjaEZvckRpcmVjdG9yeShkaXJlY3RvcnlVcmkpO1xuICAgIGZpbGVTZWFyY2hlcnNbZGlyZWN0b3J5VXJpXSA9IHNlYXJjaDtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBzZWFyY2gucXVlcnkocXVlcnkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRTZWFyY2hQcm92aWRlcnMoY3dkOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PFByb3ZpZGVySW5mbz4+IHtcbiAgY29uc3QgdmFsaWRQcm9taXNlczogQXJyYXk8UHJvbWlzZTw/UHJvdmlkZXJJbmZvPj4gPSBbXTtcblxuICBhc3luYyBmdW5jdGlvbiBjaGVja0F2YWlsYWJpbGl0eShwcm92aWRlck5hbWU6IHN0cmluZyk6IFByb21pc2U8P1Byb3ZpZGVySW5mbz4ge1xuICAgIGludmFyaWFudChwcm92aWRlcnMpO1xuICAgIGNvbnN0IGlzQXZhaWxhYmxlID0gYXdhaXQgcHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0uaXNBdmFpbGFibGUoY3dkKTtcbiAgICByZXR1cm4gaXNBdmFpbGFibGUgPyB7bmFtZTogcHJvdmlkZXJOYW1lfSA6IG51bGw7XG4gIH1cblxuICBmb3IgKGNvbnN0IG5hbWUgaW4gcHJvdmlkZXJzKSB7XG4gICAgdmFsaWRQcm9taXNlcy5wdXNoKGNoZWNrQXZhaWxhYmlsaXR5KG5hbWUpKTtcbiAgfVxuXG4gIGNvbnN0IGFsbFJlc3VsdHM6IEFycmF5PD9Qcm92aWRlckluZm8+ID1cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKCh2YWxpZFByb21pc2VzOiBBcnJheTxQcm9taXNlPD9Qcm92aWRlckluZm8+PikpO1xuICAvLyBBbnkgaXMgcmVxdWlyZWQgaGVyZSBhcyBvdGhlcndpc2Ugd2UgZ2V0IGEgZmxvdyBlcnJvciBpbiBjb3JlLmpzXG4gIHJldHVybiAoYWxsUmVzdWx0cy5maWx0ZXIocHJvdmlkZXIgPT4gcHJvdmlkZXIgIT0gbnVsbCk6IGFueSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRvU2VhcmNoUXVlcnkoXG4gIGN3ZDogc3RyaW5nLFxuICBwcm92aWRlcjogc3RyaW5nLFxuICBxdWVyeTogc3RyaW5nXG4pOiBQcm9taXNlPFNlYXJjaFJlc3BvbnNlPiB7XG4gIGludmFyaWFudChwcm92aWRlcnMpO1xuICBjb25zdCBjdXJyZW50UHJvdmlkZXI6ID9TZWFyY2hQcm92aWRlciA9IHByb3ZpZGVyc1twcm92aWRlcl07XG4gIGlmICghY3VycmVudFByb3ZpZGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHByb3ZpZGVyOiAke3Byb3ZpZGVyfWApO1xuICB9XG4gIGludmFyaWFudChjdXJyZW50UHJvdmlkZXIgIT0gbnVsbCk7XG4gIGNvbnN0IHJlc3VsdHM6IEFycmF5PFNlYXJjaFF1ZXJ5UmVzdWx0PiA9IGF3YWl0IGN1cnJlbnRQcm92aWRlci5xdWVyeShjd2QsIHF1ZXJ5KTtcbiAgcmV0dXJuIHtyZXN1bHRzfTtcbn1cblxuZnVuY3Rpb24gYWRkUHJvdmlkZXIobmFtZTogc3RyaW5nLCBwcm92aWRlcjogU2VhcmNoUHJvdmlkZXIpOiB2b2lkIHtcbiAgcHJvdmlkZXJzID0gcHJvdmlkZXJzIHx8IHt9O1xuICBpZiAocHJvdmlkZXJzW25hbWVdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgYXMgYSBwcm92aWRlci5gKTtcbiAgfVxuICBwcm92aWRlcnNbbmFtZV0gPSBwcm92aWRlcjtcbn1cblxuZnVuY3Rpb24gY2xlYXJQcm92aWRlcnMoKTogdm9pZCB7XG4gIHByb3ZpZGVycyA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemUoKTogdm9pZCB7XG59XG5cbmZ1bmN0aW9uIHNodXRkb3duKCk6IHZvaWQge1xuICBjbGVhclByb3ZpZGVycygpO1xuICBmb3IgKGNvbnN0IGsgaW4gZmlsZVNlYXJjaGVycykge1xuICAgIGZpbGVTZWFyY2hlcnNba10uZGlzcG9zZSgpO1xuICB9XG4gIGZpbGVTZWFyY2hlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdGlhbGl6ZSxcbiAgc2h1dGRvd24sXG4gIGFkZFByb3ZpZGVyLFxuICBjbGVhclByb3ZpZGVycyxcbiAgc2VydmljZXM6IHtcbiAgICAnL3NlYXJjaC9xdWVyeSc6IHtoYW5kbGVyOiBkb1NlYXJjaFF1ZXJ5LCBtZXRob2Q6ICdwb3N0J30sXG4gICAgJy9zZWFyY2gvbGlzdFByb3ZpZGVycyc6IHtoYW5kbGVyOiBnZXRTZWFyY2hQcm92aWRlcnMsIG1ldGhvZDogJ3Bvc3QnfSxcbiAgICAnL3NlYXJjaC9kaXJlY3RvcnknOiB7aGFuZGxlcjogZG9TZWFyY2hEaXJlY3Rvcnl9LFxuICB9LFxufTtcbiJdfQ==