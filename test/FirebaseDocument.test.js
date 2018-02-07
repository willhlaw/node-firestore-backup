import Firebase from 'firebase-admin';
import path from 'path';

import {
  getFireApp,
  constructDocumentReference
} from '../lib/FirestoreFunctions';
import {
  constructFirestoreDocumentObject,
  constructDocumentObjectToBackup,
  saveDocument
} from '../lib/FirestoreDocument';
import { TYPES } from '../lib/FirestoreTypes';

const testFirestoreCredentialsPath = path.join(__dirname, '../creds.json');
const testFirebaseApp = getFireApp(testFirestoreCredentialsPath);
// Create firestore object as long as credentials path and fire app was
// successfully initialized.
//  Note: tests will functional properly without fire app, but with it,
// functionality with DocumentReference will be tested and for use
// as optional param for constructFirestoreDocumentObject
const firestore = {
  firestore:
    !testFirebaseApp || !testFirebaseApp.firestore
      ? undefined
      : testFirebaseApp.firestore()
};

// testObjects used for nested objects in Object or Array
const testObjects = {
  fiona: { value: 'Fiona', type: TYPES.STRING },
  abbi: { value: 'Abbi', type: TYPES.STRING },
  id: { value: 3, type: TYPES.NUMBER }
};

const dateField = {
  value: new Date(),
  type: TYPES.TIMESTAMP
};

const stringField = {
  value: 'Jhon',
  type: TYPES.STRING
};

const stringFieldEmpty = {
  value: '',
  type: TYPES.STRING
};

const nullField = {
  value: null,
  type: TYPES.NULL
};

const booleanFieldTrue = {
  value: true,
  type: TYPES.BOOLEAN
};

const booleanFieldFalse = {
  value: false,
  type: TYPES.BOOLEAN
};

const numberField = {
  value: 21,
  type: TYPES.NUMBER
};

const numberFieldFloat = {
  value: 321.16,
  type: TYPES.NUMBER
};

const geoPointField = {
  value: new Firebase.firestore.GeoPoint(-32.8417, -64.3),
  type: TYPES.GEOPOINT
};

const documentReferenceField = !!firestore.firestore
  ? {
      value: constructDocumentReference(firestore.firestore, {
        segments: [
          'CompanyCollection',
          'An7xh0LqvWDocumentId',
          'RoomsSubCollection',
          'conferenceRoom-001'
        ]
      }),
      type: TYPES.DOCUMENT_REFERENCE
    }
  : {
      value: 'disableDocumentReferenceWhenNoFirestoreCreds_at_creds.json',
      type: TYPES.STRING
    };

// If any of the Object field(s) are updated, update setNestedFields()
const objectField = {
  value: { name: testObjects.abbi, id: testObjects.id, documentReferenceField },
  type: TYPES.OBJECT
};

// If any of the Array fields are updated, update setNestedFields()
const arrayField = {
  value: [
    testObjects.fiona,
    testObjects.id,
    objectField,
    documentReferenceField
  ],
  type: TYPES.ARRAY
};

const arrayFieldEmpty = {
  value: [],
  type: TYPES.ARRAY
};

// Set nested field values manually on the firestoreDocument
function setNestedFields(firestoreDocument) {
  if (firestoreDocument.arrayField) {
    firestoreDocument.arrayField = [
      testObjects.fiona.value,
      testObjects.id.value,
      {
        name: objectField.value.name.value,
        id: objectField.value.id.value,
        documentReferenceField: documentReferenceField.value
      },
      documentReferenceField.value
    ];
  }
  if (firestoreDocument.arrayFieldEmpty) {
    firestoreDocument.arrayFieldEmpty = [];
  }
  if (firestoreDocument.objectField) {
    firestoreDocument.objectField = {
      name: testObjects.abbi.value,
      id: testObjects.id.value,
      documentReferenceField: documentReferenceField.value
    };
  }
  // Remove _firestore field since we do not store it when backing up
  // It is included in backupDocument in the first place in order for
  // restoring to firestore to translate any project refs in the reference
  if (firestoreDocument.documentReferenceFieldWithFirestore) {
    //delete firestoreDocument.documentReferenceFieldWithFirestore._firestore;
  }
}

// Document with all field types stored on disk after a backup
// Example:
// {
//   stringField: { value: 'Jhon', type: 'string' },
//   geoPointField: {
//     value: { _latitude: -32.8417, _longitude: -64.3 },
//     type: 'geopoint'
//   }
// };
const backupDocument = {
  dateField,
  stringField,
  stringFieldEmpty,
  nullField,
  booleanFieldTrue,
  booleanFieldFalse,
  numberField,
  numberFieldFloat,
  geoPointField,
  documentReferenceField,
  objectField,
  arrayField,
  arrayFieldEmpty
};

// Firebase document with values of all field types with no type information
// Example:
// {
//   stringField: 'Jhon',
//   geoPointField: { _latitude: -32.8417, _longitude: -64.3 }
// };
const firestoreDocument =
  // Create the document from backupDocument to reduce typing and redundancy
  Object.keys(backupDocument).reduce((acc, key) => {
    acc[key] = backupDocument[key].value;
    return acc;
  }, {});
// Set nested field values manually because above reduce function
// does not deal with assigning nested values
// and to disconnect reference from const field's children
setNestedFields(firestoreDocument);

console.info('backupDocument =\n', backupDocument);
console.info('firestoreDocument =\n', firestoreDocument);

describe('constructFirestoreDocumentObject', () => {
  // Establish a simple test with just a string field
  it('should create a Firestore document from a typed backup document', () => {
    const aTypedDocument = {
      name: { value: 'Jhon', type: TYPES.STRING }
    };
    expect(typeof aTypedDocument.name).toBe('object');

    const aFirestoreDocument = constructFirestoreDocumentObject(aTypedDocument);
    const expectedDocument = {
      name: 'Jhon'
    };
    expect(typeof aFirestoreDocument.name).toBe('string');
    expect(aFirestoreDocument).toEqual(expectedDocument);
  });

  // Repeat the test using the test document data's string field and then
  // with all of the field types
  it('should create a Firestore document from single field example backup document', () => {
    expect(
      constructFirestoreDocumentObject({
        stringField: backupDocument.stringField
      })
    ).toEqual({ stringField: firestoreDocument.stringField });
  });

  it('should create a Firestore document from multiple fields example backup document', () => {
    expect(constructFirestoreDocumentObject(backupDocument, firestore)).toEqual(
      firestoreDocument
    );
  });
});

describe('constructDocumentObjectToBackup', () => {
  // Establish a simple test with just a string field
  it('should create a typed backup document from a firestore document', () => {
    const firestoreDocument = {
      name: 'Jhon'
    };
    expect(typeof firestoreDocument.name).toBe('string');

    const backupDocument = constructDocumentObjectToBackup(firestoreDocument);
    const expectedDocument = {
      name: { value: 'Jhon', type: TYPES.STRING }
    };
    expect(typeof backupDocument.name).toBe('object');
    expect(backupDocument).toEqual(expectedDocument);
  });

  // Repeat the test using the test document data's string field and then
  // with all of the field types
  it('should create a typed backup document from single field example firestore document', () => {
    expect(
      constructDocumentObjectToBackup({
        stringField: firestoreDocument.stringField
      })
    ).toEqual({ stringField: backupDocument.stringField });
  });

  it('should create a typed backup document from multiple fields example firestore document', () => {
    expect(constructDocumentObjectToBackup(firestoreDocument)).toEqual(
      backupDocument
    );
  });
});

describe('Backup document and then restore document', () => {
  it('should not change document after backup and restore steps', () => {
    expect(
      constructFirestoreDocumentObject(
        constructDocumentObjectToBackup(firestoreDocument),
        firestore
      )
    ).toEqual(firestoreDocument);
  });

  it('should create a firestore document from a complex example', () => {
    const aFirestoreDocument = {
      name: 'UserCreationError',
      type: 'error',
      // undefined fields are ignored in toEqual() and for Firestore types
      // and only produces a warning
      fooWillBeIgnored: undefined,
      message: {
        code: 'ValidationError',
        _embedded: {
          errors: [
            {
              _links: {},
              code: 'NotAllowed',
              path: '/dateOfBirth',
              message: 'DateOfBirth value not allowed.'
            }
          ]
        },
        message:
          'Validation error(s) present. See embedded errors list for more details.'
      },
      status: 'read',
      identifier: 'provider'
    };
    const aBackupDocument = {
      name: { value: 'UserCreationError', type: 'string' },
      type: { value: 'error', type: 'string' },
      message: {
        value: {
          code: { value: 'ValidationError', type: 'string' },
          _embedded: {
            value: {
              errors: {
                value: [
                  {
                    value: {
                      path: { value: '/dateOfBirth', type: 'string' },
                      message: {
                        value: 'DateOfBirth value not allowed.',
                        type: 'string'
                      },
                      _links: { value: {}, type: 'object' },
                      code: { value: 'NotAllowed', type: 'string' }
                    },
                    type: 'object'
                  }
                ],
                type: 'array'
              }
            },
            type: 'object'
          },
          message: {
            value:
              'Validation error(s) present. See embedded errors list for more details.',
            type: 'string'
          }
        },
        type: 'object'
      },
      status: { value: 'read', type: 'string' },
      identifier: { value: 'provider', type: 'string' }
    };
    const firestoreDocument = constructFirestoreDocumentObject(aBackupDocument);
    expect(firestoreDocument).toEqual(aFirestoreDocument);
    const backupDocument = constructDocumentObjectToBackup(aFirestoreDocument);
    expect(backupDocument).toEqual(aBackupDocument);
    expect(constructDocumentObjectToBackup(firestoreDocument)).toEqual(
      aBackupDocument
    );
  });
});
