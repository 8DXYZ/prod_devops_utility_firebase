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
    // Ensure the directory exists before writing the file
    const dir = path.dirname(configPath); // Get the directory path from the provided configPath
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });  // Create the directory if it doesn't exist
    }

    // Ensure the file exists, if not, create an empty file
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify({}), 'utf-8');
    }

    // Read and parse the export config file (assuming it contains Firestore credentials)
    let exportConfig = {};
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      if (fileContent.trim() !== '') {
        exportConfig = JSON.parse(fileContent); // Read the JSON config if the file is not empty
      }
    } catch (error) {
      console.error('Error parsing JSON config:', error);
      return;
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
    await fetchSubcollections(docId, data[docId].collections, firestore);

    // Write the resulting data to the specified configPath file
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

  for (const key in docData) {
    const value = docData[key];
    const dataType = typeof value === 'object' && value !== null
      ? (Array.isArray(value) ? 'array' : 'object') // Check if the value is a nested object (map or array)
      : typeof value; // For primitive values

    formattedData[key] = value;  // Set the field data in the document
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
    const subcollections = await firestore.doc(docId).listCollections();

    for (const subcollection of subcollections) {
      const subcollectionName = subcollection.id;
      collections[subcollectionName] = {
        document: {}, // We will store the documents in this subcollection
        collections: {} // Subcollections within this subcollection (handled recursively)
      };

      const subcollectionSnapshot = await subcollection.get();
      for (const doc of subcollectionSnapshot.docs) {
        collections[subcollectionName].document[doc.id] = await formatDocument(doc);
        // Recursively handle subcollections inside this subcollection
        await fetchSubcollections(doc.ref.path, collections[subcollectionName].collections, firestore);
      }
    }
  } catch (error) {
    console.error(`Error fetching subcollections for ${docId}:`, error);
  }
}



/**
 * Imports a Firestore document and its subcollections from a JSON file to a specific target Firestore document path.
 * @param {string} jsonFile - Path to the JSON file to import from.
 * @param {string} targetDocumentPath - Firestore document path to which the data will be imported.
 * @param {Object} firestore - The Firestore instance to import the data into (already initialized).
 */
async function importDocument(jsonFile, targetDocumentPath, firestore) {
  try {
    // Read and parse the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    // Import the document data (main document and subcollections)
    await importSubcollections(Object.values(jsonData)[0], targetDocumentPath, firestore);
    console.log(`Imported document data from ${jsonFile} to ${targetDocumentPath}`);
  } catch (error) {
    console.error('Error importing document:', error);
  }
}

/**
 * Recursively imports a document and its subcollections from the JSON structure.
 * @param {Object} data - The data object to be imported (document and subcollections).
 * @param {string} documentPath - The path where the data will be imported in Firestore.
 * @param {Object} firestore - The Firestore instance to import the data into (already initialized).
 */
async function importSubcollections(data, documentPath, firestore) {
  try {
    const documentData = {};

    // Handle fields in the document
    if (data.document) {
      // Iterate through fields in the "document" part of the JSON
      for (const key in data.document) {
        const fieldValue = data.document[key];
        documentData[key] = fieldValue; // Assign field data to the documentData object
      }
    }

    // Set the main document data (fields only) in Firestore
    if (Object.keys(documentData).length > 0) {
      await firestore.doc(documentPath).set(documentData);
      console.log(`Document imported to ${documentPath}`);
    } else {
      console.log(`No document data to import for ${documentPath}`);
    }

    // Handle subcollections in the "collections" part of the JSON
    if (data.collections) {
      for (const collectionName in data.collections) {
        const subcollectionData = data.collections[collectionName];

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

    for (const docId in subcollectionData.document) {
      const docData = subcollectionData.document[docId];

      // Import each document in the subcollection
      await firestore.collection(subcollectionPath).doc(docId).set(docData);
      console.log(`Document ${docId} imported to ${subcollectionPath}`);

      // Recursively handle any nested subcollections for the document
      if (subcollectionData.collections) {
        for (const nestedCollection in subcollectionData.collections) {
          const nestedSubcollectionData = subcollectionData.collections[nestedCollection];
          await importSubcollectionsToSubcollection(nestedSubcollectionData, `${subcollectionPath}/${docId}`, nestedCollection, firestore);
        }
      }
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
