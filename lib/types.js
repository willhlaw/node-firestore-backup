/* @flow */
import { TYPES } from './FirestoreTypes';

export type ValueDescription = {
  value: any,
  type: string
};

export type ValidationResult = ValueDescription | false;

// Returns if a value is a string
export const isString = (value: any): ValidationResult => {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value,
      type: TYPES.STRING
    };
  }
  return false;
};

// Returns if a value is really a number
export const isNumber = (value: any): ValidationResult => {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value,
      type: TYPES.NUMBER
    };
  }
  return false;
};

// Returns if a value is an array
export const isArray = (value: any): ValidationResult => {
  if (value && typeof value === 'object' && value.constructor === Array) {
    return {
      value,
      type: TYPES.ARRAY
    };
  }
  return false;
};

// Returns if a value is an object
export const isObject = (value: any): ValidationResult => {
  if (value && typeof value === 'object' && value.constructor === Object) {
    return {
      value,
      type: TYPES.OBJECT
    };
  }
  return false;
};

// Returns if a value is null
export const isNull = (value: any): ValidationResult => {
  if (value === null) {
    return {
      value,
      type: TYPES.NULL
    };
  }
  return false;
};

// Returns if a value is undefined
export const isUndefined = (value: any): ValidationResult => {
  if (typeof value === 'undefined') {
    return {
      value,
      type: 'undefined'
    };
  }
  return false;
};

// Returns if a value is a boolean
export const isBoolean = (value: any): ValidationResult => {
  if (typeof value === 'boolean') {
    return {
      value,
      type: TYPES.BOOLEAN
    };
  }
  return false;
};

// Returns if value is a date object
export const isDate = (value: any): ValidationResult => {
  if (value instanceof Date) {
    return {
      value,
      type: TYPES.TIMESTAMP
    };
  }
  return false;
};

// TODO: use DocumentReference and Geopoint types exposed by Firebase Admin SDK
// more info: https://github.com/googleapis/nodejs-firestore/pull/123
export const isDocumentReference: boolean = documentElement => {
  let isDocRef = false;
  Object.keys(documentElement).forEach(key => {
    Object.keys(documentElement[key]).forEach(subKey => {
      if (subKey === 'segments') {
        isDocRef = true;
      }
    });
  });
  return isDocRef;
};

export const isGeopoint: boolean = documentElement =>
  !!documentElement._latitude && !!documentElement._longitude;
