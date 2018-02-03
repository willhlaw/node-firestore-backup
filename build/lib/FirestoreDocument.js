'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constructDocumentObjectToBackup = exports.constructFirestoreDocumentObject = exports.constructReferenceUrl = exports.saveDocument = undefined;

var _FirestoreTypes = require('./FirestoreTypes');

var _types = require('./types');

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var saveDocument = exports.saveDocument = function saveDocument(firestoreAccountDb, collectionName, documentId, data) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : { merge: false };

  return firestoreAccountDb.collection(collectionName).doc(documentId).set(data, options);
};

var constructReferenceUrl = exports.constructReferenceUrl = function constructReferenceUrl(reference) {
  var referencePath = '';
  Object.keys(reference).forEach(function (key) {
    Object.keys(reference[key]).forEach(function (subKey) {
      if (subKey === 'segments') {
        var pathArray = reference[key][subKey];
        pathArray.forEach(function (pathKey) {
          referencePath = referencePath ? referencePath + '/' + pathKey : pathKey;
        });
      }
    });
  });
  return referencePath;
};

/**
 * Object construction function to be stored on Firestore
 * For each document backup data object, is created an object ready to be stored
 * en firestore database
 * Example:
 * Backup Object Document
 * { name: { value: 'Jhon', type: 'string' }, age: { value: 26, type: 'number' }}
 * Object to be restored
 * { name: 'Jhon', age: 26 }
 * (see available types on FirestoreTypes file)
 */
var constructFirestoreDocumentObject = exports.constructFirestoreDocumentObject = function constructFirestoreDocumentObject(documentData) {
  var documentDataToStore = {};
  var restoreAccountDb = require('../index').restoreAccountDb;
  Object.keys(documentData).forEach(function (key) {
    var _documentData$key = documentData[key],
        value = _documentData$key.value,
        type = _documentData$key.type;

    if (type === _FirestoreTypes.TYPES.BOOLEAN) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.TIMESTAMP) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, new Date(value)));
    } else if (type === _FirestoreTypes.TYPES.NUMBER) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.ARRAY) {
      var childFieldObject = Object.keys(value).reduce(function (acc, cur, i) {
        var element = constructFirestoreDocumentObject(_defineProperty({}, cur, value[cur]));
        acc[i] = element[i];
        return acc;
      }, []);
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.OBJECT) {
      var _childFieldObject = Object.keys(value).reduce(function (acc, cur, i) {
        var element = constructFirestoreDocumentObject(_defineProperty({}, cur, value[cur]));
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, _childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.NULL) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, null));
    } else if (type === _FirestoreTypes.TYPES.STRING) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else {
      if (type === _FirestoreTypes.TYPES.DOCUMENT_REFERENCE) {
        // TODO: use DocumentReference constructor
        var document = value.substr(value.indexOf('/') + 1, value.length);
        var collectionName = value.substr(0, value.lastIndexOf('/'));
        // TODO: use import to replace this require
        // FIXME: possible circular dependency
        var docRef = restoreAccountDb.collection(collectionName).doc(document);
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, docRef));
      } else if (type === _FirestoreTypes.TYPES.GEOPOINT) {
        var geopoint = new _firebaseAdmin2.default.firestore.GeoPoint(value._latitude, value._longitude);
        documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, geopoint));
      } else {
        console.log('Unsupported type!');
      }
    }
  });
  return documentDataToStore;
};

/**
 * Object construction function to document backup
 * for each document data object is created an object that contains the fields
 * of the original data with their types.
 * (see available types on FirestoreTypes file)
 * Example:
 * Original Object Document
 * { name: 'Jhon', age: 26 }
 * Object to backup
 * { name: { value: 'Jhon', type: 'string' }, age: { value: 26, type: 'number' }}
 */
var constructDocumentObjectToBackup = exports.constructDocumentObjectToBackup = function constructDocumentObjectToBackup(documentData) {
  var documentDataToStore = {};
  Object.keys(documentData).forEach(function (key) {
    var value = documentData[key];
    if ((0, _types.isBoolean)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isBoolean)(value)));
    } else if ((0, _types.isDate)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isDate)(value)));
    } else if ((0, _types.isNumber)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isNumber)(value)));
    } else if ((0, _types.isArray)(value)) {
      var childFieldBackup = value.reduce(function (acc, cur, i) {
        var element = constructDocumentObjectToBackup(_defineProperty({}, i, cur));
        acc[i] = element[i];
        return acc;
      }, {});
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
        value: childFieldBackup,
        type: _FirestoreTypes.TYPES.ARRAY
      });
    } else if ((0, _types.isObject)(value)) {
      var _childFieldBackup = Object.keys(value).reduce(function (acc, cur, i) {
        var element = constructDocumentObjectToBackup(_defineProperty({}, cur, value[cur]));
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
        value: _childFieldBackup,
        type: _FirestoreTypes.TYPES.OBJECT
      });
    } else if ((0, _types.isNull)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isNull)(value)));
    } else if ((0, _types.isString)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isString)(value)));
    } else {
      if ((0, _types.isDocumentReference)(value)) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
          value: constructReferenceUrl(value),
          type: _FirestoreTypes.TYPES.DOCUMENT_REFERENCE
        });
      } else if ((0, _types.isGeopoint)(value)) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
          value: value,
          type: _FirestoreTypes.TYPES.GEOPOINT
        });
      } else {
        console.log('Unsupported type!');
      }
    }
  });
  return documentDataToStore;
};