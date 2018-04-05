'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.restoreAccountDb = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

var transformFnParamKey = 'transformFn';
var transformFnParamDescription = 'Transformation function for schema migrations';

var packagePath = __dirname.includes('/build') ? '..' : '.';

var version = 'N/A - unable to read package.json file';
try {
  version = require(packagePath + '/package.json').version;
} catch (requireError) {}

// The data to be restored can replace the existing ones
// or they can be merged with existing ones
var mergeData = false;

_commander2.default.version(version).option('-a, --' + accountCredentialsPathParamKey + ' <path>', accountCredentialsPathParamDescription).option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription).option('-a2, --' + restoreAccountCredentialsPathParamKey + ' <path>', restoreAccountCredentialsPathParamDescription).option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription).option('-S, --' + stableParamKey, stableParamParamDescription).option('-J, --' + plainJSONBackupParamKey, plainJSONBackupParamDescription).option('-T, --' + transformFnParamKey + ' <path>', transformFnParamDescription).parse(_process2.default.argv);

var transformFnPath = _commander2.default[transformFnParamKey];
var transformFn = void 0;
if (!!transformFnPath) {
  try {
    transformFn = require(transformFnPath).default;
  } catch (e) {
    throw new Error('The transformation function file doesn\'t exists!');
  }
}
var executeTranformFn = !!_commander2.default[transformFnParamKey] && !!transformFn;

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

var getTransformedDocument = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(collectionPath, document) {
    var backupDocObject, obj;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            backupDocObject = (0, _FirestoreDocument.constructDocumentObjectToBackup)(document.data());
            obj = !!executeTranformFn ? transformFn({
              accountDb: accountDb,
              restoreAccountDb: restoreAccountDb,
              collectionPath: collectionPath,
              docId: document.id,
              docData: backupDocObject
            }) : Promise.resolve(backupDocObject);
            _context.next = 4;
            return obj;

          case 4:
            return _context.abrupt('return', _context.sent);

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function getTransformedDocument(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var backupDocument = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(collectionPath, document, backupPath, logPath, documentBackup) {
    var fileContents;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            console.log("Backing up Document '" + logPath + document.id + "'" + (plainJSONBackup === true ? ' with -J --plainJSONBackup' : ' with type information'));

            _context2.prev = 1;

            _mkdirp2.default.sync(backupPath);
            fileContents = void 0;


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

            return _context2.abrupt('return', document.ref.getCollections().then(function (collections) {
              return promiseSerial(collections.map(function (collection) {
                return function () {
                  return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/');
                };
              }));
            }));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](1);

            console.log(_colors2.default.bold(_colors2.default.red("Unable to create backup path or write file, skipping backup of Document '" + document.id + "': ")) + _colors2.default.bold(backupPath) + ' - ' + _context2.t0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[1, 9]]);
  }));

  return function backupDocument(_x3, _x4, _x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

var backupCollection = function backupCollection(collection, backupPath, logPath) {
  console.log("Backing up Collection '" + logPath + collection.id + "'");

  // TODO: implement feature to skip certain Collections
  // if (collection.id.toLowerCase().indexOf('geotrack') > 0) {
  //   console.log(`Skipping ${collection.id}`);
  //   return promiseSerial([() => Promise.resolve()]);
  // }

  try {
    _mkdirp2.default.sync(backupPath);

    return collection.get().then(function (snapshots) {
      var backupFunctions = [];
      snapshots.forEach(function (document) {
        backupFunctions.push((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
          var collectionPath, documentData, transformedDocument, backupDocumentPromise;
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  collectionPath = collection._referencePath.segments;
                  documentData = document.data();

                  if (!(!!executeTranformFn && !plainJSONBackup)) {
                    _context3.next = 7;
                    break;
                  }

                  _context3.next = 5;
                  return getTransformedDocument(collectionPath, document);

                case 5:
                  transformedDocument = _context3.sent;

                  documentData = transformedDocument;

                case 7:
                  backupDocumentPromise = backupDocument(collectionPath, document, backupPath + '/' + document.id, logPath + collection.id + '/', documentData);

                  restoreDocument(logPath + collection.id, collectionPath, document, documentData);
                  return _context3.abrupt('return', backupDocumentPromise);

                case 10:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, undefined);
        })));
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

var restoreDocument = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(collectionName, collectionPath, document, documentData) {
    var restoreMsg, documentObject;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (restoreAccountDb) {
              _context4.next = 2;
              break;
            }

            return _context4.abrupt('return', null);

          case 2:
            restoreMsg = 'Restoring to collection ' + collectionName + ' document ' + document.id;

            console.log(restoreMsg + '...');
            documentObject = (0, _FirestoreDocument.constructFirestoreDocumentObject)(documentData, {
              firestore: restoreAccountDb
            });
            return _context4.abrupt('return', Promise.resolve(
            // TODO: use saveDocument using merge as an option
            !restoreAccountDb ? null : restoreAccountDb.collection(collectionName).doc(document.id).set(documentObject)).catch(function (error) {
              console.log(_colors2.default.bold(_colors2.default.red('Error! ' + restoreMsg + ' - ' + error)));
            }));

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function restoreDocument(_x8, _x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}();

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