/* @flow */

import commander from 'commander';
import colors from 'colors';

import process from 'process';
import fs from 'fs';
import Firebase from 'firebase-admin';
import mkdirp from 'mkdirp';
import path from 'path';
import stringify from 'json-stable-stringify';

import { getFireApp } from './lib/FirestoreFunctions';
import {
  constructFirestoreDocumentObject,
  constructDocumentObjectToBackup,
  saveDocument
} from './lib/FirestoreDocument';

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription =
  'Google Cloud account credentials JSON file';

const backupPathParamKey = 'backupPath';
const backupPathParamDescription = 'Path to store backup';

const excludeCollectionsParamKey = 'exclude'
const excludeCollectionsParamDescription = 'Comma separated list of excluded collections, ' +
  'use * for document id wildcard';

const restoreAccountCredentialsPathParamKey = 'restoreAccountCredentials';
const restoreAccountCredentialsPathParamDescription =
  'Google Cloud account credentials JSON file for restoring documents';

const prettyPrintParamKey = 'prettyPrint';
const prettyPrintParamDescription = 'JSON backups done with pretty-printing';

const stableParamKey = 'stable';
const stableParamParamDescription = 'JSON backups done with stable-stringify';

const plainJSONBackupParamKey = 'plainJSONBackup';
const plainJSONBackupParamDescription = `JSON backups done without preserving any type information
                                          - Lacks full fidelity restore to Firestore
                                          - Can be used for other export purposes`;

const packagePath = __dirname.includes('/build') ? '..' : '.';

let version = 'N/A - unable to read package.json file';
try {
  version = require(`${packagePath}/package.json`).version;
} catch (requireError) {}

// The data to be restored can replace the existing ones
// or they can be merged with existing ones
const mergeData = false;

commander
  .version(version)
  .option(
    '-a, --' + accountCredentialsPathParamKey + ' <path>',
    accountCredentialsPathParamDescription
  )
  .option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription)
  .option(
    '-a2, --' + restoreAccountCredentialsPathParamKey + ' <path>',
    restoreAccountCredentialsPathParamDescription
  )
  .option('-E, --' + excludeCollectionsParamKey + ' <col1,col2>', excludeCollectionsParamDescription)
  .option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription)
  .option('-S, --' + stableParamKey, stableParamParamDescription)

  .option('-J, --' + plainJSONBackupParamKey, plainJSONBackupParamDescription)
  .parse(process.argv);

const accountCredentialsPath = commander[accountCredentialsPathParamKey];
if (accountCredentialsPath && !fs.existsSync(accountCredentialsPath)) {
  console.log(
    colors.bold(colors.red('Account credentials file does not exist: ')) +
      colors.bold(accountCredentialsPath)
  );
  commander.help();
  process.exit(1);
}

const backupPath = commander[backupPathParamKey];
if (!backupPath) {
  console.log(
    colors.bold(colors.red('Missing: ')) +
      colors.bold(backupPathParamKey) +
      ' - ' +
      backupPathParamDescription
  );
  commander.help();
  process.exit(1);
}

const restoreAccountCredentialsPath =
  commander[restoreAccountCredentialsPathParamKey];
if (
  restoreAccountCredentialsPath &&
  !fs.existsSync(restoreAccountCredentialsPath)
) {
  console.log(
    colors.bold(
      colors.red('Restore account credentials file does not exist: ')
    ) + colors.bold(restoreAccountCredentialsPath)
  );
  commander.help();
  process.exit(1);
}

const exclusions =
  (commander[excludeCollectionsParamKey] !== undefined &&
    commander[excludeCollectionsParamKey] !== null)
    ? commander[excludeCollectionsParamKey].split(',')
    : [];

const prettyPrint =
  commander[prettyPrintParamKey] !== undefined &&
  commander[prettyPrintParamKey] !== null;

const stable =
  commander[stableParamKey] !== undefined &&
  commander[stableParamKey] !== null;

const plainJSONBackup =
  commander[plainJSONBackupParamKey] !== undefined &&
  commander[plainJSONBackupParamKey] !== null;

const accountApp: Object = accountCredentialsPath
  ? getFireApp(accountCredentialsPath)
  : {};

try {
  mkdirp.sync(backupPath);
} catch (error) {
  console.log(
    colors.bold(colors.red('Unable to create backup path: ')) +
      colors.bold(backupPath) +
      ' - ' +
      error
  );
  process.exit(1);
}

const restoreAccountApp: Object = restoreAccountCredentialsPath
  ? getFireApp(restoreAccountCredentialsPath)
  : {};

// from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
const promiseSerial = funcs => {
  return funcs.reduce((promise, func) => {
    return promise.then(result => {
      return func().then(() => {
        return Array.prototype.concat.bind(result);
      });
    });
  }, Promise.resolve([]));
};

const isExcluded = fullPath => {
  if (exclusions.length > 0) {
    const escapedPath = fullPath.split('/').reduce((previousValue, currentValue, currentIndex) => {
      return previousValue + (currentIndex % 2 === 1 ? `/${currentValue}` : '/*');
    })
    return exclusions.find(exclusion => fullPath.startsWith(exclusion)) ||
      exclusions.find(exclusion => escapedPath.startsWith(exclusion));
  }
  return false;
};

const backupDocument = (
  document: Object,
  backupPath: string,
  logPath: string
): Promise<any> => {

  const fullPath = logPath + document.id

  if (isExcluded(fullPath)) {
    console.log(`Skipping backup of Document ${fullPath}`);
    return promiseSerial([() => Promise.resolve()]);
  }

  console.log(
    "Backing up Document '" +
      fullPath +
      "'" +
      (plainJSONBackup === true
        ? ' with -J --plainJSONBackup'
        : ' with type information')
  );

  try {
    mkdirp.sync(backupPath);
    let fileContents: string;
    const documentBackup =
      plainJSONBackup === true
        ? document.data()
        : constructDocumentObjectToBackup(document.data());
    if (prettyPrint === true) {
      if (stable === true) {
        fileContents = stringify(documentBackup, { space: 2 });
      } else {
        fileContents = JSON.stringify(documentBackup, null, 2);
      }
    } else {
      if (stable === true) {
        fileContents = stringify(documentBackup);
      } else {
        fileContents = JSON.stringify(documentBackup);
      }
    }
    fs.writeFileSync(backupPath + '/' + document.id + '.json', fileContents);

    return document.ref.getCollections().then(collections => {
      return promiseSerial(
        collections.map(collection => {
          return () => {
            return backupCollection(
              collection,
              backupPath + '/' + collection.id,
              fullPath + '/'
            );
          };
        })
      );
    });
  } catch (error) {
    console.log(
      colors.bold(
        colors.red(
          "Unable to create backup path or write file, skipping backup of Document '" +
            document.id +
            "': "
        )
      ) +
        colors.bold(backupPath) +
        ' - ' +
        error
    );
    return Promise.reject(error);
  }
};

const backupCollection = (
  collection: Object,
  backupPath: string,
  logPath: string
): Promise<void> => {
  const fullPath = logPath + collection.id

  if (isExcluded(fullPath)) {
    console.log(`Skipping backup of Collection ${fullPath}`);
    return promiseSerial([() => Promise.resolve()]);
  }

  if (exclusions.length > 0) {
    const escapedPath = fullPath.split('/').reduce((previousValue, currentValue, currentIndex) => {
      return previousValue + (currentIndex % 2 === 1 ? `/${currentValue}` : '/*')
    })
    if (exclusions.find(exclusion => fullPath.startsWith(exclusion)) ||
      exclusions.find(exclusion => escapedPath.startsWith(exclusion))) {
      return promiseSerial([() => Promise.resolve()])
    }
  }

  try {
    mkdirp.sync(backupPath);

    return collection.get().then(snapshots => {
      const backupFunctions = [];
      snapshots.forEach(document => {
        backupFunctions.push(() => {
          const backupDocumentPromise = backupDocument(
            document,
            backupPath + '/' + document.id,
            fullPath + '/'
          );
          restoreDocument(fullPath, document);
          return backupDocumentPromise;
        });
      });
      return promiseSerial(backupFunctions);
    });
  } catch (error) {
    console.log(
      colors.bold(
        colors.red(
          "Unable to create backup path, skipping backup of Collection '" +
            collection.id +
            "': "
        )
      ) +
        colors.bold(backupPath) +
        ' - ' +
        error
    );
    return Promise.reject(error);
  }
};

const accountDb = accountCredentialsPath ? accountApp.firestore() : null;

export const restoreAccountDb = restoreAccountCredentialsPath
  ? restoreAccountApp.firestore()
  : null;

const restoreDocument = (collectionName: string, document: Object) => {
  const restoreMsg = `Restoring to collection ${collectionName} document ${
    document.id
  }`;
  console.log(`${restoreMsg}...`);
  return Promise.resolve(
    // TODO: use saveDocument using merge as an option
    !restoreAccountDb
      ? null
      : restoreAccountDb
          .collection(collectionName)
          .doc(document.id)
          .set(document.data())
  ).catch(error => {
    console.log(
      colors.bold(colors.red(`Error! ${restoreMsg}` + ' - ' + error))
    );
  });
};

const restoreBackup = (
  path: string,
  restoreAccountDb: Object,
  promisesChain: Array = []
) => {
  const promisesResult = promisesChain;
  fs.readdirSync(path).forEach(element => {
    const elementPath = `${path}/${element}`;
    const stats = fs.statSync(elementPath);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
      const folderPromises = restoreBackup(
        elementPath,
        restoreAccountDb,
        promisesChain
      );
      promisesResult.concat(folderPromises);
    } else {
      const documentId = path.split('/').pop();
      const pathWithoutId = path.substr(0, path.lastIndexOf('/'));
      // remove from the path the global backupPath
      const pathWithoutBackupPath = pathWithoutId.replace(backupPath, '');
      const collectionName = pathWithoutBackupPath;

      const restoreMsg = `Restoring to collection ${collectionName} document ${elementPath}`;
      console.log(`${restoreMsg}`);

      const documentDataValue = fs.readFileSync(elementPath);
      const documentData = constructFirestoreDocumentObject(
        JSON.parse(documentDataValue),
        { firestore: restoreAccountDb }
      );
      promisesResult.push(
        saveDocument(
          restoreAccountDb,
          collectionName,
          documentId,
          documentData,
          { merge: mergeData }
        ).catch(saveError => {
          const saveErrorMsg = `\n !!! Uh-Oh, error saving collection ${collectionName} document ${elementPath}`;
          console.error(saveErrorMsg, saveError);
          if (!saveError.metadata) {
            saveError.metadata = {};
          }
          saveError.metadata.collectionName = collectionName;
          saveError.metadata.document = elementPath;
          return Promise.reject(saveError);
        })
      );
    }
  });
  return promisesResult;
};

const mustExecuteBackup: boolean =
  !!accountDb || (!!accountDb && !!restoreAccountDb);
if (mustExecuteBackup) {
  accountDb.getCollections().then(collections => {
    return promiseSerial(
      collections.map(collection => {
        return () => {
          return backupCollection(
            collection,
            backupPath + '/' + collection.id,
            '/'
          );
        };
      })
    );
  });
}

const mustExecuteRestore: boolean =
  !accountDb && !!restoreAccountDb && !!backupPath;
if (mustExecuteRestore) {
  const promisesRes = restoreBackup(backupPath, restoreAccountDb);
  Promise.all(promisesRes)
    .then(restoration => console.log(`\n -- Restore Completed! -- \n`))
    .catch(errors => {
      console.log(`\n !!! Restore NOT Complete; there were Errors !!!\n`);
      (errors instanceof Array ? errors : [errors]).map(console.error);
    });
}
