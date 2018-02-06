/* @flow */
import { TYPES } from './FirestoreTypes';
import Firebase from 'firebase-admin';

export type ValueDescription = {
  value: any,
  type: string
};

export type ValidationResult = ValueDescription | false;

function clone(
  objToClone: Object,
  { prototype = Object.prototype }: { prototype: Object }
): Object {
  const clonedObj = Object.create(prototype);
  return Object.assign(clonedObj, objToClone);
}

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

export const isDocumentReference = (value: any): ValidationResult => {
  if (value instanceof Firebase.firestore.DocumentReference) {
    // Create a clone to ensure instance of DocumentReference and to mutate
    const documentReference = clone(
      value,
      Firebase.firestore.DocumentReference.prototype
    );
    // Remove _firestore as it is unnecessary and we do not want to keep it
    delete documentReference._firestore;
    return {
      value: documentReference,
      type: TYPES.DOCUMENT_REFERENCE
    };
  }
  return false;
};

export const isGeopoint = (value: any): ValidationResult => {
  if (value instanceof Firebase.firestore.GeoPoint) {
    return {
      value,
      type: TYPES.GEOPOINT
    };
  }
  return false;
};
