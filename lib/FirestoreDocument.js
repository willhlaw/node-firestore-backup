/* @flow */
import Firebase from 'firebase-admin';

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
import { constructDocumentReference } from './FirestoreFunctions';

export const saveDocument = (
  firestoreAccountDb,
  collectionName,
  documentId,
  data,
  options = { merge: false }
) => {
  const doc = firestoreAccountDb.collection(collectionName).doc(documentId);
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
export const constructFirestoreDocumentObject = (
  documentData_: Object,
  { firestore, isArrayItem }: { firestore: Object, isArrayItem: Boolean } = {}
) => {
  if (!isObject(documentData_)) {
    console.warn(`Invalid documentData, ${documentData}, passed to 
      constructFirestoreDocumentObject()`);
    return;
  }

  let documentDataToStore = {};
  let documentData = documentData_;
  let keys = Object.keys(documentData);
  if (isArrayItem) {
    // documentData was an array item, such as
    // { arrayName: [{name: 'fiona', type: 'string']}
    // and then called this function recursively with the first item, such as
    // {name: 'fiona', type: 'string'} so add a temporary key
    // to process it like the other field types
    documentData = { __arrayItem__: documentData };
    keys = Object.keys(documentData);
  }
  keys.forEach(key => {
    const { value, type } = documentData[key] || {};
    if (type === TYPES.BOOLEAN) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: value
      };
    } else if (type === TYPES.TIMESTAMP) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: new Date(value)
      };
    } else if (type === TYPES.NUMBER) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: value
      };
    } else if (type === TYPES.ARRAY) {
      const childFieldObject = value.reduce(function(acc, cur) {
        const element = constructFirestoreDocumentObject(cur, {
          isArrayItem: true,
          firestore
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = {
        ...documentDataToStore,
        [key]: childFieldObject
      };
    } else if (type === TYPES.OBJECT) {
      const childFieldObject = Object.keys(value).reduce(function(acc, cur, i) {
        const element = constructFirestoreDocumentObject(
          {
            [cur]: value[cur]
          },
          { firestore }
        );
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = {
        ...documentDataToStore,
        [key]: childFieldObject
      };
    } else if (type === TYPES.NULL) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: null
      };
    } else if (type === TYPES.STRING) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: value
      };
    } else if (type === TYPES.DOCUMENT_REFERENCE) {
      if (!firestore) {
        let valueStr = value;
        try {
          valueStr = JSON.stringify(value);
        } catch (valueNotAnObjErr) {}
        console.error(`Cannot properly create DocumentReference
          without firestore credentials. Firestore is ${firestore}. 
          Skipping field: ${valueStr}`);
      } else {
        const documentReference = constructDocumentReference(
          firestore,
          value._referencePath
        );
        documentDataToStore = {
          ...documentDataToStore,
          [key]: documentReference
        };
      }
    } else if (type === TYPES.GEOPOINT) {
      const geopoint = new Firebase.firestore.GeoPoint(
        value._latitude,
        value._longitude
      );
      documentDataToStore = {
        ...documentDataToStore,
        [key]: geopoint
      };
    } else {
      console.warn(
        `Unsupported type, ${type} from {${key}: ${value}} in ${JSON.stringify(
          documentData
        )}`
      );
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
export const constructDocumentObjectToBackup = (
  documentData_: any,
  { isArrayItem }: { isArrayItem: Boolean } = {}
) => {
  let documentDataToStore = {};
  let documentData = documentData_;

  if (isArrayItem) {
    // documentData was an array item, such as { arrayName: ['fiona'] }
    // and then called this function recursively with the first item, such as
    // 'fiona' so add a temporary key to process it like the other field types
    documentData = { __arrayItem__: documentData };
  }

  Object.keys(documentData).forEach(key => {
    const value = documentData[key];
    if (isBoolean(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isBoolean(value)
      };
    } else if (isDate(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isDate(value)
      };
    } else if (isNumber(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isNumber(value)
      };
    } else if (isArray(value)) {
      const childFieldBackup = value.reduce(function(acc, cur) {
        const element = constructDocumentObjectToBackup(cur, {
          isArrayItem: true
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isArray(childFieldBackup)
      };
    } else if (isObject(value)) {
      const childFieldBackup = Object.keys(value).reduce(function(acc, cur) {
        const element = constructDocumentObjectToBackup({
          [cur]: value[cur]
        });
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isObject(childFieldBackup)
      };
    } else if (isNull(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isNull(value)
      };
    } else if (isString(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isString(value)
      };
    } else if (isDocumentReference(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isDocumentReference(value)
      };
    } else if (isGeopoint(value)) {
      documentDataToStore = {
        ...documentDataToStore,
        [key]: isGeopoint(value)
      };
    } else {
      console.warn(`Unsupported value type for {${key}: ${value}}`);
    }
  });
  return documentDataToStore;
};
