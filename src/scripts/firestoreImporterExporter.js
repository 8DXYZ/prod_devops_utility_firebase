require('dotenv').config();

const appConfig = require("../lib/app.json");
const firebaseService = require('../lib/firebase');
const path = require('path');

const realtime = firebaseService.getAdminRealtimeDBService();
const firestore = firebaseService.getAdminFirestoreService();
const store = firebaseService.getAdminStorageBucket();;
const adminAuth = firebaseService.getAdminAuthService();
const admin = store;



const fs = require('fs');


async function testConnection() {
        console.log(firestore);
  }



/**
 * Exports a Firestore document with its subcollections to a JSON file.
 * @param {string} docId - The document ID to export.
 * @param {string} configPath - Full path to save the exported file (including filename).
 * @param {Object} firestore - The Firestore instance (already initialized).
 */
async function exportDocument(docId, configPath, firestore) {
  try {
    console.log(`Starting export for document ${docId} to ${configPath}`);

    // Ensure the directory exists before writing the file
    const dir = path.dirname(configPath); // Get the directory path from the provided configPath
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist. Creating: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });  // Create the directory if it doesn't exist
    }

    // Ensure the file exists, if not, create an empty file
    if (!fs.existsSync(configPath)) {
      console.log(`File does not exist. Creating empty file: ${configPath}`);
      fs.writeFileSync(configPath, JSON.stringify({}), 'utf-8');
    }

    // Initialize the JSON structure with the document data
    const data = {
      [docId]: await fetchDocumentData(docId, firestore)  // Recursively fetch document and subcollections
    };

    // Write the resulting data to the specified configPath file
    console.log(`Writing export data to ${configPath}`);
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Exported document and subcollections to ${configPath}`);
  } catch (error) {
    console.error('Error exporting document:', error);
  }
}

/**
 * Recursively fetches document data including its fields and subcollections.
 * @param {string} docId - The document ID to fetch data for.
 * @param {Object} firestore - The Firestore instance (already initialized).
 * @returns {Object} The document data including fields and subcollections.
 */
async function fetchDocumentData(docId, firestore) {
  const documentRef = firestore.doc(docId);
  const docSnapshot = await documentRef.get();

  if (!docSnapshot.exists) {
    return {};
  }

  const docData = docSnapshot.data();
  const documentFields = {};

  // Format the fields of the document
  for (const field in docData) {
    documentFields[field] = docData[field];
  }

  // Fetch the subcollections of the document
  const subcollections = {};
  await fetchSubcollections(docId, subcollections, firestore);

  // Return the document's fields and subcollections in the required schema
  return {
    fields: documentFields,
    collections: subcollections
  };
}

/**
 * Recursively fetches subcollections of a document and adds them to the collections object.
 * @param {string} docId - The document ID to fetch subcollections for.
 * @param {Object} collections - The collections object to append subcollections to.
 * @param {Object} firestore - The Firestore instance (already initialized).
 */
async function fetchSubcollections(docId, collections, firestore) {
  try {
    const subcollections = await firestore.doc(docId).listCollections();

    if (subcollections.length === 0) {
      collections = {}; // Empty collections if no subcollections
    }

    for (const subcollection of subcollections) {
      const subcollectionName = subcollection.id;
      collections[subcollectionName] = {
        fields: {},       // Store fields of documents in this subcollection
        collections: {}   // Store subcollections within this subcollection
      };

      const subcollectionSnapshot = await subcollection.get();
      for (const doc of subcollectionSnapshot.docs) {
        // Saving document data in the fields of the subcollection
        collections[subcollectionName].collections[doc.id] = await fetchDocumentData(doc.ref.path, firestore);
        console.log(`Subcollection document ${doc.id} fetched for ${subcollectionName}`);
      }

      // If a subcollection has no documents or subcollections, ensure it is empty
      if (Object.keys(collections[subcollectionName].fields).length === 0) {
        collections[subcollectionName].fields = {};  // Empty fields if no fields
      }
      if (Object.keys(collections[subcollectionName].collections).length === 0) {
        collections[subcollectionName].collections = {};  // Empty collections if no subcollections
      }
    }
  } catch (error) {
    console.error(`Error fetching subcollections for ${docId}:`, error);
  }
}





/**
 * Import data into Firestore from a JSON file
 * @param {string} jsonFilePath - Path to the JSON file to import.
 * @param {string} targetDocPath - The Firestore document path to import the data to.
 */
async function importDocument(jsonFilePath, targetDocPath, firestore) {
  try {
    // Read the JSON file containing the exported Firestore data
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log(`Starting import for document ${targetDocPath} from ${jsonFilePath}`);

    // Check if the target document exists, if not, create it
    const documentRef = firestore.doc(targetDocPath);
    const docSnapshot = await documentRef.get();

    // If document doesn't exist, create it with empty data
    if (!docSnapshot.exists) {
      await documentRef.set({});
      console.log(`Created new document at ${targetDocPath}`);
    }

    // Start importing the data recursively
   // await importDocumentData(targetDocPath, data[targetDocPath], firestore);
    await importDocumentData(targetDocPath, Object.values(data)[0], firestore);
    console.log(`Import completed for document ${targetDocPath}`);
  } catch (error) {
    console.error(`Error importing document from ${jsonFilePath}:`, error);
  }
}

/**
 * Recursively imports document data and subcollections
 * @param {string} docPath - The document path in Firestore.
 * @param {Object} docData - The document data to import.
 * @param {Object} firestore - The Firestore instance.
 */
async function importDocumentData(docPath, docData, firestore) {
  const documentRef = firestore.doc(docPath);

  // Import fields for the current document
  if (docData.fields) {
    console.log(`Importing fields for document ${docPath}`);
    await documentRef.set(docData.fields, { merge: true });
  }

  // Recursively handle subcollections for the current document
  if (docData.collections) {
    console.log(`Importing collections for document ${docPath}`);
    for (const collectionName in docData.collections) {
      const collectionData = docData.collections[collectionName];
      const collectionRef = documentRef.collection(collectionName);

      // Import each document in the subcollection
      for (const docId in collectionData.collections) {
        const subDocData = collectionData.collections[docId];

        // Import the subdocument
        const subDocRef = collectionRef.doc(docId);
        console.log(`Importing subcollection document ${docId} in ${collectionName}`);
        await subDocRef.set(subDocData.fields, { merge: true });

        // Recursively handle subcollections within the subdocument
        if (subDocData.collections) {
          await importDocumentData(subDocRef.path, subDocData, firestore);
        }
      }
    }
  }
}


  
  /**
 * Copies a Firestore document and its subcollections from source to target Firestore instances.
 * This function exports the document from the source Firestore, then imports it into the target Firestore.
 * @param {Object} config - Config object containing source and target Firestore document IDs.
 * @param {Object} sourceFirestore - The source Firestore instance.
 * @param {Object} targetFirestore - The target Firestore instance.
 */
async function copyDocument(config, sourceFirestore, targetFirestore) {
  try {
    const tempExportPath = path.join(__dirname, 'temp_exported_data.json'); // Temporary file path to export data

    // Step 1: Export the document and subcollections from the source Firestore to a JSON file
    await exportDocument(config.sourceDocId, tempExportPath, sourceFirestore);

    // Step 2: Import the exported JSON file into the target Firestore at the specified target document path
    await importDocument(tempExportPath, config.targetDocId, targetFirestore);

    // Clean up by deleting the temporary export file
    fs.unlinkSync(tempExportPath);

    console.log(`Successfully copied document from ${config.sourceDocId} to ${config.targetDocId}`);
  } catch (error) {
    console.error('Error copying document:', error);
  }
}
  

// Expose the functions
module.exports = {
  testConnection,
  exportDocument,
  importDocument,
  copyDocument
};
