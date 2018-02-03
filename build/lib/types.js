'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isGeopoint = exports.isDocumentReference = exports.isDate = exports.isBoolean = exports.isUndefined = exports.isNull = exports.isObject = exports.isArray = exports.isNumber = exports.isString = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _FirestoreTypes = require('./FirestoreTypes');

// Returns if a value is a string
var isString = exports.isString = function isString(value) {
  if (typeof value === 'string' || value instanceof String) {
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
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Array) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.ARRAY
    };
  }
  return false;
};

// Returns if a value is an object
var isObject = exports.isObject = function isObject(value) {
  if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Object) {
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

// Returns if a value is undefined
var isUndefined = exports.isUndefined = function isUndefined(value) {
  if (typeof value === 'undefined') {
    return {
      value: value,
      type: 'undefined'
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

// TODO: replace with instanceof comparation when library is updated
var isDocumentReference = exports.isDocumentReference = function isDocumentReference(value) {
  return value.constructor.name === 'DocumentReference';
};

var isGeopoint = exports.isGeopoint = function isGeopoint(value) {
  return value.constructor.name === 'GeoPoint';
};