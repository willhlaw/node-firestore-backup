'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isGeopoint = exports.isDocumentReference = exports.isDate = exports.isBoolean = exports.isNull = exports.isObject = exports.isArray = exports.isNumber = exports.isString = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _FirestoreTypes = require('./FirestoreTypes');

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var targetDocID = 'vLxw3OC8h3mSRBZLcbvs';

function clone(objToClone, _ref) {
  var _ref$prototype = _ref.prototype,
      prototype = _ref$prototype === undefined ? Object.prototype : _ref$prototype;

  var clonedObj = Object.create(prototype);
  return Object.assign(clonedObj, objToClone);
}

// Returns if a value is a string
var isString = exports.isString = function isString(value) {
  if (typeof value === 'string' || value instanceof String) {
    if (value.indexOf(targetDocID) > 0) {
      console.error('found it as string!\n - value', value);
    }
    return {
      value: value,
      type: _FirestoreTypes.TYPES.STRING
    };
  }
  return false;
};

// Returns if a value is really a number
var isNumber = exports.isNumber = function isNumber(value) {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.NUMBER
    };
  }
  return false;
};

// Returns if a value is an array
var isArray = exports.isArray = function isArray(value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object' && value.constructor === Array) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.ARRAY
    };
  }
  return false;
};

// Returns if a value is an object
var isObject = exports.isObject = function isObject(value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object' && value.constructor === Object) {
    if (JSON.stringify(value).indexOf(targetDocID) > 0) {
      console.error('found it as object!\n - value', value);
    }
    return {
      value: value,
      type: _FirestoreTypes.TYPES.OBJECT
    };
  }
  return false;
};

// Returns if a value is null
var isNull = exports.isNull = function isNull(value) {
  if (value === null) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.NULL
    };
  }
  return false;
};

// Returns if a value is a boolean
var isBoolean = exports.isBoolean = function isBoolean(value) {
  if (typeof value === 'boolean') {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.BOOLEAN
    };
  }
  return false;
};

// Returns if value is a date object
var isDate = exports.isDate = function isDate(value) {
  if (value instanceof Date) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.TIMESTAMP
    };
  }
  return false;
};

var isDocumentReference = exports.isDocumentReference = function isDocumentReference(value) {
  if (value instanceof _firebaseAdmin2.default.firestore.DocumentReference) {
    // Create a clone to ensure instance of DocumentReference and to mutate
    var documentReference = clone(value, _firebaseAdmin2.default.firestore.DocumentReference.prototype);
    // Remove _firestore as it is unnecessary and we do not want to keep it
    delete documentReference._firestore;

    if (JSON.stringify(value).indexOf(targetDocID) > 0) {
      console.error('found it!\n - value', value, '\n - documentReference', documentReference);
    }
    return {
      value: documentReference,
      type: _FirestoreTypes.TYPES.DOCUMENT_REFERENCE
    };
  }
  return false;
};

var isGeopoint = exports.isGeopoint = function isGeopoint(value) {
  if (value instanceof _firebaseAdmin2.default.firestore.GeoPoint) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.GEOPOINT
    };
  }
  return false;
};