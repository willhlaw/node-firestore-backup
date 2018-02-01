'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constructDocumentObjectToBackup = exports.constructFirestoreDocumentObject = exports.saveDocument = undefined;

var _FirestoreTypes = require('./FirestoreTypes');

var _types = require('./types');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // TODO: add flow


var saveDocument = exports.saveDocument = function saveDocument(firestoreAccountDb, collectionName, documentId, data) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : { merge: false };

  return firestoreAccountDb.collection(collectionName).doc(documentId).set(data, options);
};

var constructFirestoreDocumentObject = exports.constructFirestoreDocumentObject = function constructFirestoreDocumentObject(documentData) {
  var documentDataToStore = {};
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
      // TODO: an array can contains differents types inside
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.OBJECT) {
      // TODO: an object can contains differents types inside
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.NULL) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, null));
    } else if (type === _FirestoreTypes.TYPES.STRING) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, value));
    } else {
      // TODO: geolocation or reference type
    }
  });
  return documentDataToStore;
};

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
      // TODO
    } else if ((0, _types.isObject)(value)) {
      // TODO
    } else if ((0, _types.isNull)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isNull)(value)));
    } else if ((0, _types.isString)(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, _defineProperty({}, key, (0, _types.isString)(value)));
    } else {
      // TODO: geolocation or reference type
    }
  });
  return documentDataToStore;
};