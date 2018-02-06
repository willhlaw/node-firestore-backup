'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constructDocumentObjectToBackup = exports.constructFirestoreDocumentObject = exports.saveDocument = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

var _FirestoreTypes = require('./FirestoreTypes');

var _types = require('./types');

var _FirestoreFunctions = require('./FirestoreFunctions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var saveDocument = exports.saveDocument = function saveDocument(firestoreAccountDb, collectionName, documentId, data) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : { merge: false };

  var doc = firestoreAccountDb.collection(collectionName).doc(documentId);

  console.log(doc);
  return doc.set(data, options);
};

/**
 * Object construction function to be stored on Firestore
 * For each document backup data object, is created an object ready to be stored
 * in firestore database.
 * Pass in firestore instance as second options parameter to properly
 * reconstruct DocumentReference values
 *
 * Example:
 * Backup Object Document
 * { name: { value: 'Jhon', type: 'string' }, age: { value: 26, type: 'number' }}
 * Object to be restored
 * { name: 'Jhon', age: 26 }
 * (see available types on FirestoreTypes file)
 */
var constructFirestoreDocumentObject = exports.constructFirestoreDocumentObject = function constructFirestoreDocumentObject(documentData_) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      firestore = _ref.firestore,
      isArrayItem = _ref.isArrayItem;

  if (!(0, _types.isObject)(documentData_)) {
    console.warn('Invalid documentData, ' + documentData + ', passed to \n      constructFirestoreDocumentObject()');
    return;
  }

  var documentDataToStore = {};
  var documentData = documentData_;
  var keys = Object.keys(documentData);
  if (isArrayItem) {
    // documentData was an array item, such as
    // { arrayName: [{name: 'fiona', type: 'string']}
    // and then called this function recursively with the first item, such as
    // {name: 'fiona', type: 'string'} so add a temporary key
    // to process it like the other field types
    documentData = { __arrayItem__: documentData };
    keys = Object.keys(documentData);
  }
  keys.forEach(function (key) {
    var _ref2 = documentData[key] || {},
        value = _ref2.value,
        type = _ref2.type;

    if (type === _FirestoreTypes.TYPES.BOOLEAN) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.TIMESTAMP) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, new Date(value)));
    } else if (type === _FirestoreTypes.TYPES.NUMBER) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.ARRAY) {
      var childFieldObject = value.reduce(function (acc, cur) {
        var element = constructFirestoreDocumentObject(cur, {
          isArrayItem: true,
          firestore: firestore
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.OBJECT) {
      var _childFieldObject = Object.keys(value).reduce(function (acc, cur, i) {
        var element = constructFirestoreDocumentObject((0, _defineProperty3.default)({}, cur, value[cur]));
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, _childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.NULL) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, null));
    } else if (type === _FirestoreTypes.TYPES.STRING) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.DOCUMENT_REFERENCE) {
      if (!firestore) {
        var valueStr = value;
        try {
          valueStr = JSON.stringify(value);
        } catch (valueNotAnObjErr) {}
        console.error('Cannot properly create DocumentReference\n          without firestore credentials. Firestore is ' + firestore + '. \n          Skipping field: ' + valueStr);
      } else {
        var documentReference = (0, _FirestoreFunctions.constructDocumentReference)(firestore, value._referencePath);
        documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, documentReference));
      }
    } else if (type === _FirestoreTypes.TYPES.GEOPOINT) {
      var geopoint = new _firebaseAdmin2.default.firestore.GeoPoint(value._latitude, value._longitude);
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, geopoint));
    } else {
      console.warn('Unsupported type, ' + type + ' from {' + key + ': ' + value + '} in ' + JSON.stringify(documentData));
    }
  });
  // Convert __arrayItem__ to an array
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
var constructDocumentObjectToBackup = exports.constructDocumentObjectToBackup = function constructDocumentObjectToBackup(documentData_) {
  var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      isArrayItem = _ref3.isArrayItem;

  var documentDataToStore = {};
  var documentData = documentData_;

  if (isArrayItem) {
    // documentData was an array item, such as { arrayName: ['fiona'] }
    // and then called this function recursively with the first item, such as
    // 'fiona' so add a temporary key to process it like the other field types
    documentData = { __arrayItem__: documentData };
  }

  Object.keys(documentData).forEach(function (key) {
    var value = documentData[key];
    if ((0, _types.isBoolean)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isBoolean)(value)));
    } else if ((0, _types.isDate)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isDate)(value)));
    } else if ((0, _types.isNumber)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isNumber)(value)));
    } else if ((0, _types.isArray)(value)) {
      var childFieldBackup = value.reduce(function (acc, cur) {
        var element = constructDocumentObjectToBackup(cur, {
          isArrayItem: true
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isArray)(childFieldBackup)));
    } else if ((0, _types.isObject)(value)) {
      var _childFieldBackup = Object.keys(value).reduce(function (acc, cur) {
        var element = constructDocumentObjectToBackup((0, _defineProperty3.default)({}, cur, value[cur]));
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isObject)(_childFieldBackup)));
    } else if ((0, _types.isNull)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isNull)(value)));
    } else if ((0, _types.isString)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isString)(value)));
    } else if ((0, _types.isDocumentReference)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isDocumentReference)(value)));
    } else if ((0, _types.isGeopoint)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, (0, _defineProperty3.default)({}, key, (0, _types.isGeopoint)(value)));
    } else {
      console.warn('Unsupported value type for {' + key + ': ' + value + '}');
    }
  });
  return documentDataToStore;
};