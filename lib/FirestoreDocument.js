/* @flow */
import { TYPES } from './FirestoreTypes';
import {
  isDocumentReference,
  isGeopoint,
  isString,
  isNull,
  isObject,
  isArray,
  isNumber,
  isDate,
  isBoolean
} from './types';
import Firebase from 'firebase-admin';

export const saveDocument = (
  firestoreAccountDb,
  collectionName,
  documentId,
  data,
  options = { merge: false }
) => {
  return firestoreAccountDb
    .collection(collectionName)
    .doc(documentId)
    .set(data, options);
};

export const constructReferenceUrl = (reference: Object) => {
  var referencePath = '';
  Object.keys(reference).forEach(key => {
    Object.keys(reference[key]).forEach(subKey => {
      if (subKey === 'segments') {
        const pathArray = reference[key][subKey];
        pathArray.forEach(pathKey => {
          referencePath = referencePath
            ? `${referencePath}/${pathKey}`
            : pathKey;
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
export const constructFirestoreDocumentObject = (documentData: Object) => {
  let documentDataToStore = {};
  const restoreAccountDb = require('../index').restoreAccountDb;
  Object.keys(documentData).forEach(key => {
    const { value, type } = documentData[key];
    if (type === TYPES.BOOLEAN) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: value
      });
    } else if (type === TYPES.TIMESTAMP) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: new Date(value)
      });
    } else if (type === TYPES.NUMBER) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: value
      });
    } else if (type === TYPES.ARRAY) {
      const childFieldObject = Object.keys(value).reduce(function(acc, cur, i) {
        const element = constructFirestoreDocumentObject({ [cur]: value[cur] });
        acc[i] = element[i];
        return acc;
      }, []);
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: childFieldObject
      });
    } else if (type === TYPES.OBJECT) {
      const childFieldObject = Object.keys(value).reduce(function(acc, cur, i) {
        const element = constructFirestoreDocumentObject({ [cur]: value[cur] });
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: childFieldObject
      });
    } else if (type === TYPES.NULL) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: null
      });
    } else if (type === TYPES.STRING) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: value
      });
    } else {
      if (type === TYPES.DOCUMENT_REFERENCE) {
        // TODO: use DocumentReference constructor
        const document = value.substr(value.indexOf('/') + 1, value.length);
        const collectionName = value.substr(0, value.lastIndexOf('/'));
        // TODO: use import to replace this require
        // FIXME: possible circular dependency
        const docRef = restoreAccountDb
          .collection(collectionName)
          .doc(document);
        documentDataToStore = Object.assign({}, documentDataToStore, {
          [key]: docRef
        });
      } else if (type === TYPES.GEOPOINT) {
        const geopoint = new Firebase.firestore.GeoPoint(
          value._latitude,
          value._longitude
        );
        documentDataToStore = Object.assign({}, documentDataToStore, {
          [key]: geopoint
        });
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
export const constructDocumentObjectToBackup = (documentData: Object) => {
  let documentDataToStore = {};
  Object.keys(documentData).forEach(key => {
    const value = documentData[key];
    if (isBoolean(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: isBoolean(value)
      });
    } else if (isDate(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: isDate(value)
      });
    } else if (isNumber(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: isNumber(value)
      });
    } else if (isArray(value)) {
      const childFieldBackup = value.reduce(function(acc, cur, i) {
        const element = constructDocumentObjectToBackup({ [i]: cur });
        acc[i] = element[i];
        return acc;
      }, {});
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
        value: childFieldBackup,
        type: TYPES.ARRAY
      });
    } else if (isObject(value)) {
      const childFieldBackup = Object.keys(value).reduce(function(acc, cur, i) {
        const element = constructDocumentObjectToBackup({ [cur]: value[cur] });
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
        value: childFieldBackup,
        type: TYPES.OBJECT
      });
    } else if (isNull(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: isNull(value)
      });
    } else if (isString(value)) {
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: isString(value)
      });
    } else {
      if (isDocumentReference(value)) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
          value: constructReferenceUrl(value),
          type: TYPES.DOCUMENT_REFERENCE
        });
      } else if (isGeopoint(value)) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
          value: value,
          type: TYPES.GEOPOINT
        });
      } else {
        console.log('Unsupported type!');
      }
    }
  });
  return documentDataToStore;
};
