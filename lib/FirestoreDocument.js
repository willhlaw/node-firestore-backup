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

export const constructFirestoreDocumentObject = (documentData: Object) => {
  let documentDataToStore = {};
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
        // TODO:
      } else if (type === TYPES.GEOPOINT) {
        // TODO:
      } else {
        console.log('Unsupported type!');
      }
    }
  });
  return documentDataToStore;
};

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
        type: TYPES.ARRAY,
        value: childFieldBackup
      });
    } else if (isObject(value)) {
      const childFieldBackup = Object.keys(value).reduce(function(acc, cur, i) {
        const element = constructDocumentObjectToBackup({ [cur]: value[cur] });
        acc[cur] = element[cur];
        return acc;
      }, {});
      documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
        type: TYPES.OBJECT,
        value: childFieldBackup
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
          type: TYPES.DOCUMENT_REFERENCE,
          value: constructReferenceUrl(value)
        });
      } else if (isGeopoint(value)) {
        documentDataToStore[key] = Object.assign({}, documentDataToStore[key], {
          type: TYPES.GEOPOINT,
          value: value
        });
      } else {
        console.log('Unsupported type!');
      }
    }
  });
  return documentDataToStore;
};
