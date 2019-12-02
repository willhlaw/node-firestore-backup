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

function commaSeparatedList(value) {
  return value.split(',')
}

function commaSeparatedListAndRegExp(value) {
  return value.split(',').map(entry => new RegExp(entry))
}

const accountCredentialsPathParamKey = 'accountCredentials';
const accountCredentialsPathParamDescription =
  'Google Cloud account credentials JSON file';

const backupPathParamKey = 'backupPath';
const backupPathParamDescription = 'Path to store backup';

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
const excludeCollectionParamKey = 'excludeCollections';
const excludeCollectionParamDescription = 'Excludes provided collections when backing up, e.g. [/collection1/doc1/subcollection2],[collection3]';

const excludePatternParamKey = 'excludePattern';
const excludePatternParamDescription = 'Exclude patterns to match against when backing up, e.g. [regex1],[regex2]'

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
  .option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription)
  .option('-S, --' + stableParamKey, stableParamParamDescription)

  .option('-J, --' + plainJSONBackupParamKey, plainJSONBackupParamDescription)
  .option('-e, --' + excludeCollectionParamKey + ' <collections>', excludeCollectionParamDescription, commaSeparatedList)
  .option('-E, --' + excludePatternParamKey + ' <regex>', excludePatternParamDescription, commaSeparatedListAndRegExp)
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

const prettyPrint =
  commander[prettyPrintParamKey] !== undefined &&
  commander[prettyPrintParamKey] !== null;

const stable =
  commander[stableParamKey] !== undefined &&
  commander[stableParamKey] !== null;

const plainJSONBackup =
  commander[plainJSONBackupParamKey] !== undefined &&
  commander[plainJSONBackupParamKey] !== null;

const excludeCollections = commander[excludeCollectionParamKey] || [];

const excludePatterns = commander[excludePatternParamKey] || [];

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

const backupDocument = (
  document: Object,
  backupPath: string,
  logPath: string
): Promise<any> => {
  console.log(
    "Backing up Document '" +
      logPath +
      document.id +
      "'" +
      (plainJSONBackup === true
        ? ' with -J --plainJSONBackup'
        : ' with type information')
  );

  if(excludePatterns.some(pattern => pattern.test(logPath + document.id))){
    console.log(`Skipping ${document.id}`);
    return promiseSerial([() => Promise.resolve()])
  }

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
              logPath + document.id + '/'
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
  const collectionPath = logPath + collection.id
  console.log("Backing up Collection '" + collectionPath + "'");

  if (excludeCollections.includes(collectionPath) || excludePatterns.some(pattern => pattern.test(collectionPath))) {
    console.log(`Skipping ${collection.id}`);
    return promiseSerial([() => Promise.resolve()]);
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
            logPath + collection.id + '/'
          );
          restoreDocument(logPath + collection.id, document);
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
