// TODO: add flow
import { TYPES } from './FirestoreTypes';
import {
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
      // TODO: an array can contains differents types inside
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: value
      });
    } else if (type === TYPES.OBJECT) {
      // TODO: an object can contains differents types inside
      documentDataToStore = Object.assign({}, documentDataToStore, {
        [key]: value
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
      // TODO: geolocation or reference type
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
      // TODO: geolocation or reference type
    }
  });
  return documentDataToStore;
};
