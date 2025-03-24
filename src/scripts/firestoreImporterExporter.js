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

    // Get the main document
    const documentRef = firestore.doc(docId);
    const docSnapshot = await documentRef.get();

    if (!docSnapshot.exists) {
      console.log(`Document with ID ${docId} not found.`);
      return;
    }

    // Initialize the JSON structure with the document data
    const data = {
      [docId]: {
        document: await formatDocument(docSnapshot),  // Fields go here
        collections: {}  // Subcollections go here
      }
    };

    // Recursively fetch subcollections and their documents
    console.log(`Fetching subcollections for document ${docId}`);
    await fetchSubcollections(docId, data[docId].collections, firestore);

    // Ensure that the document has a document field (empty if none) and a collections field
    if (Object.keys(data[docId].document).length === 0) {
      data[docId].document = {};  // Set an empty document if no fields
    }
    if (Object.keys(data[docId].collections).length === 0) {
      data[docId].collections = {};  // Set an empty collections object if no subcollections
    }

    // Write the resulting data to the specified configPath file
    console.log(`Writing export data to ${configPath}`);
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Exported document and subcollections to ${configPath}`);
  } catch (error) {
    console.error('Error exporting document:', error);
  }
}

/**
 * Formats the document data according to the schema (fields only).
 * @param {Object} docSnapshot - The Firestore document snapshot.
 * @returns {Object} The formatted document data.
 */
async function formatDocument(docSnapshot) {
  const docData = docSnapshot.data();
  const formattedData = {};

  // If the document has data (fields), format it
  if (docData) {
    for (const key in docData) {
      const value = docData[key];
      const dataType = typeof value === 'object' && value !== null
        ? (Array.isArray(value) ? 'array' : 'object') // Check if the value is a nested object (map or array)
        : typeof value; // For primitive values

      formattedData[key] = value;  // Set the field data in the document
    }
  }

  return formattedData;
}

/**
 * Recursively fetches subcollections of a document and adds them to the JSON data under collections.
 * @param {string} docId - The document ID to fetch subcollections for.
 * @param {Object} collections - The collections object to append subcollections to.
 * @param {Object} firestore - The Firestore instance (already initialized).
 */
async function fetchSubcollections(docId, collections, firestore) {
  try {
    console.log(`Fetching subcollections for document ${docId}`);
    const subcollections = await firestore.doc(docId).listCollections();

    // If the document has no subcollections, ensure the collections field is empty
    if (subcollections.length === 0) {
      collections = {};
    }

    for (const subcollection of subcollections) {
      const subcollectionName = subcollection.id;
      collections[subcollectionName] = {
        document: {}, // We will store the documents in this subcollection
        collections: {} // Subcollections within this subcollection (handled recursively)
      };

      const subcollectionSnapshot = await subcollection.get();
      for (const doc of subcollectionSnapshot.docs) {
        collections[subcollectionName].document[doc.id] = await formatDocument(doc);
        console.log(`Subcollection document ${doc.id} fetched for ${subcollectionName}`);
        // Recursively handle subcollections inside this subcollection
        await fetchSubcollections(doc.ref.path, collections[subcollectionName].collections, firestore);
      }

      // Ensure that the subcollection has a document field (empty if none) and a collections field
      if (Object.keys(collections[subcollectionName].document).length === 0) {
        collections[subcollectionName].document = {};  // Empty document if no fields
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
 * Imports a Firestore document and its subcollections from a JSON file to a user-specified target Firestore document path.
 * @param {string} jsonFile - Path to the JSON file to import from.
 * @param {string} targetDocumentPath - Firestore document path to which the data will be imported.
 * @param {Object} firestore - The Firestore instance to import the data into (already initialized).
 */
async function importDocument(jsonFile, targetDocumentPath, firestore) {
  try {
    // Read and parse the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    console.log(`JSON data read from ${jsonFile}`);

    // Log available keys in the JSON file (just for debugging)
    console.log('Available paths in JSON:', Object.keys(jsonData));

    // Extract the data from the JSON (using the user-specified targetDocumentPath)
    if (!jsonData || !jsonData[targetDocumentPath]) {
      console.error(`No data found in the JSON file for the specified target path: ${targetDocumentPath}`);
      return;
    }

    // Import the document data (main document and subcollections) to the user-specified target path
    console.log(`Importing data to Firestore path: ${targetDocumentPath}`);
    await importSubcollections(jsonData, targetDocumentPath, firestore);
    console.log(`Imported document data from ${jsonFile} to ${targetDocumentPath}`);
  } catch (error) {
    console.error('Error importing document:', error);
  }
}

/**
 * Recursively imports a document and its subcollections from the JSON structure to Firestore.
 * @param {Object} data - The data object to be imported (document and subcollections).
 * @param {string} documentPath - The path where the data will be imported in Firestore.
 * @param {Object} firestore - The Firestore instance to import the data into (already initialized).
 */
async function importSubcollections(data, documentPath, firestore) {
  try {
    const documentData = data[documentPath].document;

    // Handle fields in the document
    if (documentData) {
      console.log(`Importing document fields:`, documentData);
      await firestore.doc(documentPath).set(documentData);
      console.log(`Document imported to ${documentPath}`);
    } else {
      console.log(`No document fields to import for ${documentPath}`);
    }

    // Handle subcollections in the "collections" part of the JSON
    if (data[documentPath].collections) {
      for (const collectionName in data[documentPath].collections) {
        const subcollectionData = data[documentPath].collections[collectionName];
        // Recursively import each document in the subcollection
        await importSubcollectionsToSubcollection(subcollectionData, documentPath, collectionName, firestore);
      }
    }
  } catch (error) {
    console.error(`Error importing subcollections for ${documentPath}:`, error);
  }
}

/**
 * Helper function to import a subcollection recursively.
 * @param {Object} subcollectionData - The data for the subcollection (documents).
 * @param {string} parentPath - The parent document path to which the subcollection will be added.
 * @param {string} collectionName - The name of the subcollection.
 * @param {Object} firestore - The Firestore instance to import the data into (already initialized).
 */
async function importSubcollectionsToSubcollection(subcollectionData, parentPath, collectionName, firestore) {
  try {
    const subcollectionPath = `${parentPath}/${collectionName}`;

    // Log to show the subcollection data we're about to import
    console.log(`Processing subcollection at ${subcollectionPath}`);
    if (subcollectionData.document) {
      for (const docId in subcollectionData.document) {
        const docData = subcollectionData.document[docId];

        // Import each document in the subcollection
        await firestore.collection(subcollectionPath).doc(docId).set(docData);
        console.log(`Document ${docId} imported to ${subcollectionPath}`);

        // Recursively handle any nested subcollections for the document
        if (subcollectionData.collections && subcollectionData.collections[docId]) {
          const nestedSubcollectionData = subcollectionData.collections[docId];
          await importSubcollectionsToSubcollection(nestedSubcollectionData, `${subcollectionPath}/${docId}`, collectionName, firestore);
        }
      }
    } else {
      console.log(`No documents in subcollection ${collectionName} at ${subcollectionPath}`);
    }
  } catch (error) {
    console.error(`Error importing subcollection ${collectionName} at ${parentPath}:`, error);
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
