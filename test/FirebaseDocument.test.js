var firebaseAdmin = require('firebase-admin');
var TYPES = require('../build/lib/FirestoreTypes').TYPES;
var constructDocumentObjectToBackup = require('../build/lib/FirestoreDocument')
  .constructDocumentObjectToBackup;
var constructFirestoreDocumentObject = require('../build/lib/FirestoreDocument')
  .constructFirestoreDocumentObject;

describe('Basic test', () => {
  it('Tests are running!', () => {
    expect(true).toBe(true);
  });
});

describe('Single field document, backup and restore objects constructor', () => {
  test('Date field', () => {
    const dateString = '2018-01-09T14:11:00.000Z';
    const document = { startDate: new Date(dateString) };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      startDate: { value: new Date(dateString), type: TYPES.TIMESTAMP }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('String field', () => {
    const document = { name: 'Jhon' };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      name: { value: 'Jhon', type: TYPES.STRING }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Null field', () => {
    const document = { phoneNumber: null };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      phoneNumber: { value: null, type: TYPES.NULL }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Boolean field', () => {
    const document = { isAvailable: true };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      isAvailable: { value: true, type: TYPES.BOOLEAN }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Integer Number field', () => {
    const document = { age: 21 };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = { age: { value: 21, type: TYPES.NUMBER } };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Float Number field', () => {
    const document = { size: 321.16 };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = { size: { value: 321.16, type: TYPES.NUMBER } };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Empty array field', () => {
    const document = {
      fakeAddress: []
    };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      fakeAddress: {
        value: {},
        type: TYPES.ARRAY
      }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(documentBackup.toString()).toEqual(expectedObject.toString());
  });

  it('Array field contains two simple types', () => {
    const document = {
      fakeAddress: ['Main Street', 1234]
    };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      fakeAddress: {
        value: {
          0: { value: 'Main Street', type: TYPES.STRING },
          1: { value: 1234, type: TYPES.NUMBER }
        },
        type: TYPES.ARRAY
      }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(documentBackup.toString()).toEqual(expectedObject.toString());
  });

  it('Geopoint field', () => {
    const document = {
      geotrack: new firebaseAdmin.firestore.GeoPoint(-32.8417, -64.3)
    };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      geotrack: {
        value: { _latitude: -32.8417, _longitude: -64.3 },
        type: TYPES.GEOPOINT
      }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });
});

describe('Multiple fields document, backup and restore object constructor', () => {
  it('Object field that include simple fields and array', () => {
    const document = {
      user: { name: 'Jhon', age: 25, friends: ['Laura', 'Diego'] }
    };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      user: {
        value: {
          name: {
            value: 'Jhon',
            type: TYPES.STRING
          },
          age: {
            value: 25,
            type: TYPES.NUMBER
          },
          friends: {
            value: {
              0: {
                value: 'Laura',
                type: TYPES.STRING
              },
              1: {
                value: 'Diego',
                type: TYPES.STRING
              }
            },
            type: TYPES.ARRAY
          }
        },
        type: TYPES.OBJECT
      }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(documentBackup.toString()).toEqual(expectedObject.toString());
  });

  it('Object constains objects', () => {
    const document = {
      users: {
        Jhon: { lastName: 'Smith', age: 26 },
        Jane: { lastName: 'Jones', age: 21 }
      }
    };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      users: {
        value: {
          Jhon: {
            value: {
              lastName: {
                value: 'Smith',
                type: TYPES.STRING
              },
              age: {
                value: 26,
                type: TYPES.NUMBER
              }
            },
            type: TYPES.OBJECT
          },
          Jane: {
            value: {
              lastName: {
                value: 'Jones',
                type: TYPES.STRING
              },
              age: {
                value: 21,
                type: TYPES.NUMBER
              }
            },
            type: TYPES.OBJECT
          }
        },
        type: TYPES.OBJECT
      }
    };
    const objectToRestore = constructFirestoreDocumentObject(documentBackup);
    expect(objectToRestore).toEqual(document);
    expect(documentBackup).toEqual(expectedObject);
    expect(documentBackup.toString()).toEqual(expectedObject.toString());
  });
});
