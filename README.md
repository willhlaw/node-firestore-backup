# firestore-backup-restore
A Google Firebase Firestore backup and restore tool. This project was forked from https://github.com/steadyequipment/node-firestore-backup.git and extended. Node-firestore-backup is an excellent product and this project will stay in sync with its updates by monitoring it with ![Backstroke logo](https://backstroke.co/assets/img/logo.png) [Backstroke](https://backstroke.co/).

## Installation
Install using [__npm__](https://www.npmjs.com/).

```sh
npm install -g firestore-backup-restore
```

 or [__yarn__](https://yarnpkg.com/en/)

```sh
yarn global add firestore-backup-restore
```

Alternatively download the source.

```sh
git clone https://github.com/willhlaw/node-firestore-backup-restore/commits/master
```

### Retrieving Google Cloud Account Credentials

1. Visit the [Firebase Console](https://console.firebase.google.com)
1. Select your project
1. Navigate to __Project Settings__ (at the time of writing the __gear__ icon button at the top left of the page).
1. Navigate to __Service Accounts__
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for __firestore-backup-restore__ to authenticate.


## Usage

### Backup:
* `-a`, `--accountCredentials` `<path>` - Google Cloud account credentials JSON file.
* `-B`, `--backupPath` `<path>`- Path to store the backup.
* `-a2`, `--restoreAccountCredentials` `<path>` - Google Cloud account credentials JSON file for restoring documents.

Example backup:
```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase
```

Example backup and restore:
```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --restoreAccountCredentials path/to/restore/credentials/file.json
```

### Backup with pretty printing:
* `-P`, `--prettyPrint` - JSON backups done with pretty-printing.

Example:
```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --prettyPrint
```

## Contributions
Feel free to report bugs in the [Issue Tracker](https://github.com/willhlaw/node-firestore-backup-restore/issues), fork and create pull requests!
