'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restoreAccountDb = undefined;

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _FirestoreFunctions = require('./lib/FirestoreFunctions');

var _FirestoreDocument = require('./lib/FirestoreDocument');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function commaSeparatedList(value) {
  return value.split(',');
}

function commaSeparatedListAndRegExp(value) {
  return value.split(',').map(function (entry) {
    return new RegExp(entry);
  });
}

var accountCredentialsPathParamKey = 'accountCredentials';
var accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';

var backupPathParamKey = 'backupPath';
var backupPathParamDescription = 'Path to store backup';

var restoreAccountCredentialsPathParamKey = 'restoreAccountCredentials';
var restoreAccountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file for restoring documents';

var prettyPrintParamKey = 'prettyPrint';
var prettyPrintParamDescription = 'JSON backups done with pretty-printing';

var stableParamKey = 'stable';
var stableParamParamDescription = 'JSON backups done with stable-stringify';

var plainJSONBackupParamKey = 'plainJSONBackup';
var plainJSONBackupParamDescription = 'JSON backups done without preserving any type information\n                                          - Lacks full fidelity restore to Firestore\n                                          - Can be used for other export purposes';
var excludeCollectionParamKey = 'excludeCollections';
var excludeCollectionParamDescription = 'Excludes provided collections when backing up, e.g. [/collection1/doc1/subcollection2],[collection3]';

var excludePatternParamKey = 'excludePattern';
var excludePatternParamDescription = 'Exclude patterns to match against when backing up, e.g. [regex1],[regex2]';

var packagePath = __dirname.includes('/build') ? '..' : '.';

var version = 'N/A - unable to read package.json file';
try {
  version = require(packagePath + '/package.json').version;
} catch (requireError) {}

// The data to be restored can replace the existing ones
// or they can be merged with existing ones
var mergeData = false;

_commander2.default.version(version).option('-a, --' + accountCredentialsPathParamKey + ' <path>', accountCredentialsPathParamDescription).option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription).option('-a2, --' + restoreAccountCredentialsPathParamKey + ' <path>', restoreAccountCredentialsPathParamDescription).option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription).option('-S, --' + stableParamKey, stableParamParamDescription).option('-J, --' + plainJSONBackupParamKey, plainJSONBackupParamDescription).option('-e, --' + excludeCollectionParamKey + ' <collections>', excludeCollectionParamDescription, commaSeparatedList).option('-E, --' + excludePatternParamKey + ' <regex>', excludePatternParamDescription, commaSeparatedListAndRegExp).parse(_process2.default.argv);

var accountCredentialsPath = _commander2.default[accountCredentialsPathParamKey];
if (accountCredentialsPath && !_fs2.default.existsSync(accountCredentialsPath)) {
  console.log(_colors2.default.bold(_colors2.default.red('Account credentials file does not exist: ')) + _colors2.default.bold(accountCredentialsPath));
  _commander2.default.help();
  _process2.default.exit(1);
}

var backupPath = _commander2.default[backupPathParamKey];
if (!backupPath) {
  console.log(_colors2.default.bold(_colors2.default.red('Missing: ')) + _colors2.default.bold(backupPathParamKey) + ' - ' + backupPathParamDescription);
  _commander2.default.help();
  _process2.default.exit(1);
}

var restoreAccountCredentialsPath = _commander2.default[restoreAccountCredentialsPathParamKey];
if (restoreAccountCredentialsPath && !_fs2.default.existsSync(restoreAccountCredentialsPath)) {
  console.log(_colors2.default.bold(_colors2.default.red('Restore account credentials file does not exist: ')) + _colors2.default.bold(restoreAccountCredentialsPath));
  _commander2.default.help();
  _process2.default.exit(1);
}

var prettyPrint = _commander2.default[prettyPrintParamKey] !== undefined && _commander2.default[prettyPrintParamKey] !== null;

var stable = _commander2.default[stableParamKey] !== undefined && _commander2.default[stableParamKey] !== null;

var plainJSONBackup = _commander2.default[plainJSONBackupParamKey] !== undefined && _commander2.default[plainJSONBackupParamKey] !== null;

var excludeCollections = _commander2.default[excludeCollectionParamKey] || [];

var excludePatterns = _commander2.default[excludePatternParamKey] || [];

var accountApp = accountCredentialsPath ? (0, _FirestoreFunctions.getFireApp)(accountCredentialsPath) : {};

try {
  _mkdirp2.default.sync(backupPath);
} catch (error) {
  console.log(_colors2.default.bold(_colors2.default.red('Unable to create backup path: ')) + _colors2.default.bold(backupPath) + ' - ' + error);
  _process2.default.exit(1);
}

var restoreAccountApp = restoreAccountCredentialsPath ? (0, _FirestoreFunctions.getFireApp)(restoreAccountCredentialsPath) : {};

// from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
var promiseSerial = function promiseSerial(funcs) {
  return funcs.reduce(function (promise, func) {
    return promise.then(function (result) {
      return func().then(function () {
        return Array.prototype.concat.bind(result);
      });
    });
  }, Promise.resolve([]));
};

var backupDocument = function backupDocument(document, backupPath, logPath) {
  console.log("Backing up Document '" + logPath + document.id + "'" + (plainJSONBackup === true ? ' with -J --plainJSONBackup' : ' with type information'));

  if (excludePatterns.some(function (pattern) {
    return pattern.test(logPath + document.id);
  })) {
    console.log('Skipping ' + document.id);
    return promiseSerial([function () {
      return Promise.resolve();
    }]);
  }

  try {
    _mkdirp2.default.sync(backupPath);
    var fileContents = void 0;
    var documentBackup = plainJSONBackup === true ? document.data() : (0, _FirestoreDocument.constructDocumentObjectToBackup)(document.data());
    if (prettyPrint === true) {
      if (stable === true) {
        fileContents = (0, _jsonStableStringify2.default)(documentBackup, { space: 2 });
      } else {
        fileContents = JSON.stringify(documentBackup, null, 2);
      }
    } else {
      if (stable === true) {
        fileContents = (0, _jsonStableStringify2.default)(documentBackup);
      } else {
        fileContents = JSON.stringify(documentBackup);
      }
    }
    _fs2.default.writeFileSync(backupPath + '/' + document.id + '.json', fileContents);

    return document.ref.getCollections().then(function (collections) {
      return promiseSerial(collections.map(function (collection) {
        return function () {
          return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/');
        };
      }));
    });
  } catch (error) {
    console.log(_colors2.default.bold(_colors2.default.red("Unable to create backup path or write file, skipping backup of Document '" + document.id + "': ")) + _colors2.default.bold(backupPath) + ' - ' + error);
    return Promise.reject(error);
  }
};

var backupCollection = function backupCollection(collection, backupPath, logPath) {
  var collectionPath = logPath + collection.id;
  console.log("Backing up Collection '" + collectionPath + "'");

  if (excludeCollections.includes(collectionPath) || excludePatterns.some(function (pattern) {
    return pattern.test(collectionPath);
  })) {
    console.log('Skipping ' + collection.id);
    return promiseSerial([function () {
      return Promise.resolve();
    }]);
  }

  try {
    _mkdirp2.default.sync(backupPath);

    return collection.get().then(function (snapshots) {
      var backupFunctions = [];
      snapshots.forEach(function (document) {
        backupFunctions.push(function () {
          var backupDocumentPromise = backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/');
          restoreDocument(logPath + collection.id, document);
          return backupDocumentPromise;
        });
      });
      return promiseSerial(backupFunctions);
    });
  } catch (error) {
    console.log(_colors2.default.bold(_colors2.default.red("Unable to create backup path, skipping backup of Collection '" + collection.id + "': ")) + _colors2.default.bold(backupPath) + ' - ' + error);
    return Promise.reject(error);
  }
};

var accountDb = accountCredentialsPath ? accountApp.firestore() : null;

var restoreAccountDb = exports.restoreAccountDb = restoreAccountCredentialsPath ? restoreAccountApp.firestore() : null;

var restoreDocument = function restoreDocument(collectionName, document) {
  var restoreMsg = 'Restoring to collection ' + collectionName + ' document ' + document.id;
  console.log(restoreMsg + '...');
  return Promise.resolve(
  // TODO: use saveDocument using merge as an option
  !restoreAccountDb ? null : restoreAccountDb.collection(collectionName).doc(document.id).set(document.data())).catch(function (error) {
    console.log(_colors2.default.bold(_colors2.default.red('Error! ' + restoreMsg + ' - ' + error)));
  });
};

var restoreBackup = function restoreBackup(path, restoreAccountDb) {
  var promisesChain = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  var promisesResult = promisesChain;
  _fs2.default.readdirSync(path).forEach(function (element) {
    var elementPath = path + '/' + element;
    var stats = _fs2.default.statSync(elementPath);
    var isDirectory = stats.isDirectory();
    if (isDirectory) {
      var folderPromises = restoreBackup(elementPath, restoreAccountDb, promisesChain);
      promisesResult.concat(folderPromises);
    } else {
      var documentId = path.split('/').pop();
      var pathWithoutId = path.substr(0, path.lastIndexOf('/'));
      // remove from the path the global backupPath
      var pathWithoutBackupPath = pathWithoutId.replace(backupPath, '');
      var collectionName = pathWithoutBackupPath;

      var restoreMsg = 'Restoring to collection ' + collectionName + ' document ' + elementPath;
      console.log('' + restoreMsg);

      var documentDataValue = _fs2.default.readFileSync(elementPath);
      var documentData = (0, _FirestoreDocument.constructFirestoreDocumentObject)(JSON.parse(documentDataValue), { firestore: restoreAccountDb });
      promisesResult.push((0, _FirestoreDocument.saveDocument)(restoreAccountDb, collectionName, documentId, documentData, { merge: mergeData }).catch(function (saveError) {
        var saveErrorMsg = '\n !!! Uh-Oh, error saving collection ' + collectionName + ' document ' + elementPath;
        console.error(saveErrorMsg, saveError);
        if (!saveError.metadata) {
          saveError.metadata = {};
        }
        saveError.metadata.collectionName = collectionName;
        saveError.metadata.document = elementPath;
        return Promise.reject(saveError);
      }));
    }
  });
  return promisesResult;
};

var mustExecuteBackup = !!accountDb || !!accountDb && !!restoreAccountDb;
if (mustExecuteBackup) {
  accountDb.getCollections().then(function (collections) {
    return promiseSerial(collections.map(function (collection) {
      return function () {
        return backupCollection(collection, backupPath + '/' + collection.id, '/');
      };
    }));
  });
}

var mustExecuteRestore = !accountDb && !!restoreAccountDb && !!backupPath;
if (mustExecuteRestore) {
  var promisesRes = restoreBackup(backupPath, restoreAccountDb);
  Promise.all(promisesRes).then(function (restoration) {
    return console.log('\n -- Restore Completed! -- \n');
  }).catch(function (errors) {
    console.log('\n !!! Restore NOT Complete; there were Errors !!!\n');
    (errors instanceof Array ? errors : [errors]).map(console.error);
  });
}