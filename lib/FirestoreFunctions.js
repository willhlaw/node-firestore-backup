// Helper functions to work with Firestore instances
import colors from 'colors';
import fs from 'fs';
import Firebase from 'firebase-admin';

// Initializes and returns Firebase App and then .firestore() can be called
const getFireApp = (credentialsPath: string, appName?: string): Object => {
  try {
    const credentialsBuffer = fs.readFileSync(credentialsPath);
    const credentials = JSON.parse(credentialsBuffer.toString());
    const appInstance = Firebase.initializeApp(
      {
        credential: Firebase.credential.cert(credentials)
      },
      appName || credentialsPath
    );
    Firebase.firestore().settings({ timestampsInSnapshots: true })
    return appInstance;
  } catch (error) {
    console.log(
      colors.bold(colors.red('Unable to read: ')) +
        colors.bold(credentialsPath) +
        ' - ' +
        error
    );
    return error;
  }
};

// Create a DocumentReference instance without the _firestore field since
// it does not need to be stored or used for restoring - The restore firestore
// is used to change DocumentReference app partition to the restore database
//
// firestore is a FirebaseApp firestore instance
// referencePath looks like:
// "_referencePath": {
//   "segments": ["CompanyCollection", "An7xh0LqvWDocumentId",
//      "RoomsSubCollection", "conferenceRoom-001"],
//   "_projectId": "backuprestore-f8687",
//   "_databaseId": "(default)"
// }
const constructDocumentReference = (
  firestore: Object,
  referencePath: Object
): Object => {
  if (!firestore || !referencePath || !referencePath.segments) {
    return;
  }

  let segments = [...referencePath.segments];
  let docRef = firestore;

  while (segments.length) {
    let collectionName = segments.shift();
    let documentName = segments.shift();
    docRef = docRef.collection(collectionName).doc(documentName);
  }

  // Create proper instance of DocumentReference
  let documentReference = new Firebase.firestore.DocumentReference(
    firestore,
    docRef._referencePath
  );

  // Remove _firestore field since it is not necessary
  delete documentReference._firestore;

  return documentReference;
};

export { getFireApp, constructDocumentReference };
