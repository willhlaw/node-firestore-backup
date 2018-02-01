var TYPES = require('../build/lib/FirestoreTypes').TYPES;
var constructDocumentObjectToBackup = require('../build/lib/FirestoreDocument')
  .constructDocumentObjectToBackup;

describe('Basic test', () => {
  it('Tests are running!', () => {
    expect(true).toBe(true);
    expect({ a: 1 }).toEqual({ a: 1 });
  });
});

describe('One field document backup', () => {
  test('Date field', () => {
    const dateString = '2018-01-09T14:11:00.000Z';
    const document = { startDate: new Date(dateString) };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = {
      startDate: { value: new Date(dateString), type: TYPES.TIMESTAMP }
    };
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
    expect(documentBackup).toEqual(expectedObject);
    expect(JSON.stringify(documentBackup)).toEqual(
      JSON.stringify(expectedObject)
    );
  });

  it('Number field', () => {
    const document = { age: 21 };
    const documentBackup = constructDocumentObjectToBackup(document);
    const expectedObject = { age: { value: 21, type: TYPES.NUMBER } };
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
    expect(documentBackup).toEqual(expectedObject);
  });

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
    expect(documentBackup).toEqual(expectedObject);
    expect(documentBackup.toString()).toEqual(expectedObject.toString());
  });
});
