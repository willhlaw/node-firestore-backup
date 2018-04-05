# firestore-backup-restore

A Google Firebase Firestore backup and restore tool. This project was forked from https://github.com/steadyequipment/node-firestore-backup.git and extended.

You can **backup** your Firestore documents to disk, **clone** data from one Firestore to another, and **restore** from disk.

## Installation

Install using [**npm**](https://www.npmjs.com/).

```sh
npm install -g firestore-backup-restore
```

or [**yarn**](https://yarnpkg.com/en/)

```sh
yarn global add firestore-backup-restore
```

or on the fly

```
npx firestore-backup-restore
```

Alternatively download the source.

```sh
git clone https://github.com/willhlaw/node-firestore-backup-restore/commits/master
```

### Retrieving Google Cloud Account Credentials

1. Visit the [Firebase Console](https://console.firebase.google.com)
1. Select your project
1. Navigate to **Project Settings** (at the time of writing the **gear** icon button at the top left of the page).
1. Navigate to **Service Accounts**
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for **firestore-backup-restore** to authenticate.

## Usage

### Options:

Usage: firestore-backup-restore [options]

Options:

* `-V`, `--version` output the version number
* `-a`, `--accountCredentials` `<path>` Google Cloud account credentials JSON file.
* `-B`, `--backupPath` `<path>` Path to store backup.
* `-a2`, `--restoreAccountCredentials` `<path>` Google Cloud account credentials JSON file for restoring documents.
* `-P`, `--prettyPrint` JSON backups done with pretty-printing.
* `-S`, `--stable` JSON backups done with stable-stringify.
* `-J`, `--plainJSONBackup` JSON backups done without preserving any type information. - Lacks full fidelity restore to Firestore. - Can be used for other export purposes.
* `-h`, `--help` output usage information
* `-T`, `--transformFn` Path to a script file that exports a transformation function for schema migrations.

### Backup:

Retrieves data from Firestore specified in `accountCredentials` and saves files to `backupPath`.

As of version 1.2, the default is to save files with each field converted to a `{value, type}` object so that the type information can be preserved and used when restoring to Firestore. Otherwise, a `timestamp` or `reference` would be restored as a `string`. See `-J` or `--plainJSONBackup` to change this default behavior.

Example backup:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase
```

### Clone:

Move data from Firestore in `accountCredentials` to Firestore specified in `accountRestoreCredentials`.

As of version 1.2, this process still requires `--backupPath` option. This may be a simple change and tested. In fact, there is an [issue](https://github.com/willhlaw/node-firestore-backup-restore/issues/15) marked `good first issue` to fix this if there are any takers.

Example clone:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --restoreAccountCredentials path/to/restore/credentials/file.json
```

### Restore:

If a backup has already been performed, then later, you can restore the backup in `--backupPath` to Firestore specified in `--restoreAccountCredentials`.

Example restore:

```sh
firestore-backup-restore --backupPath /backups/myDatabase --restoreAccountCredentials path/to/restore/credentials/file.json
```

### Backup with pretty printing:

If you want the documents to look pretty on disk and don't mind giving up extra disk space, then use the `--prettyPrint` option.

* `-P`, `--prettyPrint` - JSON backups done with pretty-printing.

Example:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --prettyPrint
```

### Backup with stable stringify:

If you want the json documents to have sorted keys, then use the `--stable` option.

* `-S`, `--stable` - JSON backups done with stable-stringify.

Example:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --stable
```

### Backup without type information as plain JSON documents:

To change the default behavior and backup the Firestore documents as plain JSON documents, use `--plainJSONBackup`.

The default is to save type information. In order for restore to work with full fidelity for field types and to work with clone for `reference`s to be changed from the original Firestore to the destination Firestore, then documents need to be saved to disk in a format that preserves the type information (that is gleaned through inspection by `constructDocumentObjectToBackup` during save). If this default behavior is not wanted and you want the regular JSON document to be saved to disk instead, then use `--plainJSONBackup`.

* `-J`, `--plainJSONBackup` - JSON backups done without preserving any type information
  * Lacks full fidelity restore to Firestore
  * Can be used for other export purposes

Example:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --plainJSONBackup
```

Document saved with `-J` or `--plainJSONBackup` option:

```
{
  name: 'UserCreationError',
  type: 'error',
  // undefined fields are ignored for Firestore types
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
```

Document saved with type information (Default)

```
{
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
```

### Apply a transformation function to documents before backup or restoration

To apply a transformation function before either writing to disk (so you can verify the schema migration) or before restoring to Firestore use the `--transformFn` option.

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --transformFn path/to/transformation/function.js
```

The transformation function will only be applied to the backup created without the `--plainJSONBackup` option.

The file passed as option will export a module, which, the value to export by default will be the transformation function. This transformation function should return a promise, and receive a object as parameter, which can contain the following fields:

* `accountDb` {Object} Firestore database instance from where the backup is made

* `restoreAccountDb` {Object} Firestore database instance where the backup is restored

* `collectionPath` {Array} Array that contains the path of the collection

* `docId` {String} Id of the document, where the function will be applied

* `docData` {Object} Document data with "backup" format, specified below

And you can use what you think is convenient for your purpose. The `docData` object will use the format `NAME_KEY: { "value": VALUE, "type": TYPE }` for each field.

The allowed types are:
'string', 'number', 'boolean', 'object', 'array', 'null', 'timestamp', 'geopoint', 'documentReference'

Examples of a transformation function:

* To rename a field called MyCompany, to company in all the documents of Companies

  ```javascript
  const transformFn = async ({
    accountDb,
    restoreAccountDb,
    collectionPath,
    docId,
    docData
  }) => {
    const operationByCollection = {
      Companies: function(companyDoc) {
        const docResult = companyDoc;
        if (!companyDoc.MyCompany) return Promise.resolve(docResult);
        docResult.company = {
          value: docResult.MyCompany.value,
          type: 'documentReference'
        };
        delete docResult.MyCompany;
        return Promise.resolve(docResult);
      }
    };
    const collectionName = collectionPath[collectionPath.length - 1]; // take the last one
    if (!operationByCollection[collectionName]) {
      console.log(`There is not a transformation for ${collectionName}`);
      return docData;
    }
    return await operationByCollection[collectionName](docData);
  };

  export default transformFn;
  ```

## Contributions

Feel free to report bugs in the [Issue Tracker](https://github.com/willhlaw/node-firestore-backup-restore/issues), fork and create pull requests!
