# firestore-backup-restore

A Google Firebase Firestore backup and restore tool. This project was forked from https://github.com/steadyequipment/node-firestore-backup.git and extended. Node-firestore-backup is an excellent product and this project will stay in sync with its updates by monitoring it with ![Backstroke logo](https://backstroke.co/assets/img/logo.png) [Backstroke](https://backstroke.co/).

## Installation

Install using [**npm**](https://www.npmjs.com/).

```sh
npm install -g firestore-backup-restore
```

or [**yarn**](https://yarnpkg.com/en/)

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
1. Navigate to **Project Settings** (at the time of writing the **gear** icon button at the top left of the page).
1. Navigate to **Service Accounts**
1. Click _Generate New Private Key_

This downloaded json file contains the proper credentials needed for **firestore-backup-restore** to authenticate.

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

Example restore a backup:

```sh
firestore-backup-restore --backupPath /backups/myDatabase --restoreAccountCredentials path/to/restore/credentials/file.json
```

### Backup with pretty printing:

* `-P`, `--prettyPrint` - JSON backups done with pretty-printing.

### Backup without type information as plain JSON documents:

* `-J`, `--plainJSONBackup` - JSON backups done without preserving any type information.

- Lacks full fidelity restore to Firestore.
- Can be used for other export purposes.

Example:

```sh
firestore-backup-restore --accountCredentials path/to/account/credentials/file.json --backupPath /backups/myDatabase --prettyPrint
```

## Contributions

Feel free to report bugs in the [Issue Tracker](https://github.com/willhlaw/node-firestore-backup-restore/issues), fork and create pull requests!
