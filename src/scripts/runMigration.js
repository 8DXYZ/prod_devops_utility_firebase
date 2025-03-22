require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {testConnection, exportDocument, importDocument, copyDocument } = require('./firestoreImporterExporter');


const appConfig = require("../lib/app.json");
const firebaseService = require('../lib/firebase');


const realtime = firebaseService.getAdminRealtimeDBService();
const firestore = firebaseService.getAdminFirestoreService();
const store = firebaseService.getAdminStorageBucket();;
const adminAuth = firebaseService.getAdminAuthService();
const admin = store;



const sourceFirestore = firestore; // Assuming passed as initialized Firestore instance
const targetFirestore = firestore;



async function runCommandLine() {
    const args = process.argv.slice(2); // Get arguments excluding "node" and script name
    const command = args[0]; // The first argument is the command (export, import, copy)
  
    // Handle each command
    switch (command) {
      case 'export':
        if (args.length < 3) {
          console.log('Usage: node script.js export <docId> <configPath>');
          return;
        }
        const docId = args[1];
        const exportConfigPath = args[2];
  
        // Ensure the configPath file exists, if not, create it
        ensureFileExists(exportConfigPath);
  
        try {
          // Read and parse the export config file (it can be empty or malformed)
          let exportConfig = {};
          const fileContent = fs.readFileSync(exportConfigPath, 'utf-8');
          
          // Check if the file is not empty before parsing
          if (fileContent.trim() !== '') {
            exportConfig = JSON.parse(fileContent);
          }
          
          // Export the document
          await exportDocument(docId, exportConfigPath, firestore);
        } catch (error) {
          console.error('Error reading or parsing config file:', error);
        }
        break;
  
      case 'import':
        if (args.length < 3) {
          console.log('Usage: node script.js import <jsonFile> <targetDocumentPath>');
          return;
        }
        const jsonFile = args[1];
        const targetDocumentPath = args[2];
        //const firestoreInstance = args[3];  // Assume the Firestore instance is passed directly
  
        try {
          // Ensure the jsonFile exists
          ensureFileExists(jsonFile);
  
          // Call the importDocument function with the Firestore instance, json file, and document path
          await importDocument(jsonFile, targetDocumentPath, firestore);
        } catch (error) {
          console.error('Error importing document:', error);
        }
        break;
  
        case 'copy':
            if (args.length < 3) {
              console.log('Usage: node script.js copy <sourceDocId> <targetDocId> <sourceFirestoreInstance> <targetFirestoreInstance>');
              return;
            }
      
            const sourceDocId = args[1];
            const targetDocId = args[2];
          //  const sourceFirestoreInstance = args[3];
          //  const targetFirestoreInstance = args[4];
      
            // Ensure both source and target Firestore instances are passed correctly
            try {
             // Initialize source and target Firestore instances
             // const sourceFirestore = sourceFirestoreInstance; // Assuming passed as initialized Firestore instance
             // const targetFirestore = targetFirestoreInstance; // Assuming passed as initialized Firestore instance
             // const sourceFirestore = firestore; // Assuming passed as initialized Firestore instance
             // const targetFirestore = firestore; // Assuming passed as initialized Firestore instance
             // Call the copyDocument function with the source and target Firestore instances
              await copyDocument({ sourceDocId, targetDocId }, sourceFirestore, targetFirestore);
            } catch (error) {
              console.error('Error during copy process:', error);
            }
            break;
  
      case 'test':
        if (args.length < 1) {
          console.log('Usage: node script.js test');
          return;
        }
        
        await testConnection();
        break;
  
      default:
        console.log('Unknown command. Use "export", "import", or "copy".');
    }
  }

/**
 * Ensures the config file exists. If not, creates it as an empty file.
 * @param {string} filePath - The path to the config file.
 */
function ensureFileExists(filePath) {
  const dir = path.dirname(filePath); // Get the directory path from the provided filePath
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });  // Create the directory if it doesn't exist
  }

  // Ensure the file exists, if not, create an empty file
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
    console.log(`Created empty file at ${filePath}`);
  }
}

runCommandLine();