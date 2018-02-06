'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constructDocumentReference = exports.getFireApp = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _firebaseAdmin = require('firebase-admin');

var _firebaseAdmin2 = _interopRequireDefault(_firebaseAdmin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Initializes and returns Firebase App and then .firestore() can be called
var getFireApp = function getFireApp(credentialsPath, appName) {
  try {
    var credentialsBuffer = _fs2.default.readFileSync(credentialsPath);
    var credentials = JSON.parse(credentialsBuffer.toString());
    return _firebaseAdmin2.default.initializeApp({
      credential: _firebaseAdmin2.default.credential.cert(credentials)
    }, appName || credentialsPath);
  } catch (error) {
    console.log(_colors2.default.bold(_colors2.default.red('Unable to read: ')) + _colors2.default.bold(credentialsPath) + ' - ' + error);
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
// Helper functions to work with Firestore instances
var constructDocumentReference = function constructDocumentReference(firestore, referencePath) {
  if (!firestore || !referencePath || !referencePath.segments) {
    return;
  }

  var segments = [].concat((0, _toConsumableArray3.default)(referencePath.segments));
  var docRef = firestore;

  while (segments.length) {
    var collectionName = segments.shift();
    var documentName = segments.shift();
    docRef = docRef.collection(collectionName).doc(documentName);
  }

  // Create proper instance of DocumentReference
  var documentReference = new _firebaseAdmin2.default.firestore.DocumentReference(firestore, docRef._referencePath);

  // Remove _firestore field since it is not necessary
  delete documentReference._firestore;

  return documentReference;
};

exports.getFireApp = getFireApp;
exports.constructDocumentReference = constructDocumentReference;