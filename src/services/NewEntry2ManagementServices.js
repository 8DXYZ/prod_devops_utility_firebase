const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { Readable } = require('stream');
const path = require('path');
const crypto = require('crypto');
const firebaseService = require('../lib/firebase');
const {} = require('../lib/firebase');
const { handleResponse, firebaseCRUD, firebaseRestful } = require('@8DXYZ/firebase-restful');
const dbSource = firebaseService.getAdminRealtimeDBService();
const root = `${process.env.ENV}/${process.env.FIREBASE_REALTIME_DEMO_ROOT}`;
const ref = dbSource.ref(`${root}/entries`);
const RESPONSE = { SUCCESS: 'success', ERROR: 'error' };
const DEBUG = process.env.DEBUG;
const bucket = firebaseService.getAdminStorageBucket();


const upload = multer({
  storage: multer.diskStorage({}),
});

const _updateNewEntry = async (operationObj) => {
  operationObj.operation = 'PUT';
  operationObj.ref = ref;
  operationObj.exec = async (operationObj) => { return await firebaseRestful.PUT(operationObj) };
  return await firebaseCRUD(operationObj);
};


const _deleteNewEntry = async (operationObj) => {
  console.log(operationObj);
  operationObj.operation = 'DELETE';
  operationObj.ref = ref;
  operationObj.exec = async (operationObj) => { return await firebaseRestful.DELETE(operationObj) };

  //to override the default referene implementation do this
  //operationObj.exec = async (operationObj)=>{
  ////do the database operations
  //let result = null;
  //const {payload, ref}= operationObj;
  //return result;
  //}

  return await firebaseCRUD(operationObj);
};


const _uploadFiles = async (operationObj) => {

  async function generateSignedUrl( bucketName, fileName, years) {
    const options = {
      version: 'v4', // Use version 4 of signed URLs
      action: 'read', // Action can be 'read', 'write', or 'delete'
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // Expires in 7 days
    };
  
    // Get a reference to the file
    const [url] = await bucket
      .file("public/"+fileName)
      .getSignedUrl(options);
     return url;
    //console.log(`The signed URL for ${fileName} is ${url}`);
  }
 
  operationObj.operation = 'POST';
  //operationObj.next = false; //determin if this is a terminating with response back to the caller

  operationObj.ref = ref;
  //use default reference implementation of custom error using native error response

  // operationObj.exec=async (operationObj)=>{return await firebaseRestful.POST(operationObj)};

  //to override the default referene implementation do this



  operationObj.exec = async (operationObj) => {

    // Initialize Multer with memory storage configuration
    const upload = multer({ storage: multer.memoryStorage() });
   
    let req = operationObj.payload.req;
    let res = operationObj.payload.res;
    const files = await new Promise((resolve, reject) => {
      upload.array('files', 10)(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(operationObj.uploadedFiles);
      });
    });
  
      // Accept up to 5 files with key 'files'
    

      // Log uploaded files information to the console
      console.log(req.files);
      try {
     
      const uploadPromises  = req.files.map((file) => {
        return new Promise(async (resolve, reject) => {
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            
            const fileName = uuidv4()+"-"+ file.originalname; // Create a unique filename
            console.log(fileName);
            console.log(bucket.name);
            const blob = bucket.file("public/"+fileName);
           // console.log(blob);
           const blobStream = blob.createWriteStream({
             resumable: false,
             contentType: file.mimetype,
           });

           blobStream.on('error', (err) => {
             console.log(err);
             reject(err);
           });

            blobStream.on('finish', async () => {
              //const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
              //const publicUrl = await firebaseService.getAdminStorageDownloadUrl()(blob);
              const publicUrl=await firebaseService.getAdminStorageDownloadUrl()(blob);
              //const publicUrl = await generateSignedUrl("/public",fileName,0 )
              resolve({ fileName: file.originalname, url: publicUrl });
            });


            // Pipe the file stream directly to Firebase Storage

            // Create a stream from the buffer and pipe it to Firebase
            const readableStream = new Readable();
            readableStream._read = () => {}; // No-op _read method
            readableStream.push(file.buffer);
            readableStream.push(null); // End the stream
    
            readableStream.pipe(blobStream);

        });
      });

       //Await all uploads to complete
       return  await Promise.all(uploadPromises);;
       
      } catch (error) {
        
       return { error: error.message };
      }
      return files;
  }

  return await firebaseCRUD(operationObj);

};
module.exports = {

  updateNewEntry: async (operationObj) => {
    let payload = JSON.parse(JSON.stringify(await _updateNewEntry(operationObj)));
    return payload;
  },

  deleteNewEntry: async (operationObj) => {
    let payload = JSON.parse(JSON.stringify(await _deleteNewEntry(operationObj)));
    return payload;
  },
  uploadFiles: async (operationObj) => {
    let payload = JSON.parse(JSON.stringify(await _uploadFiles(operationObj)));
    return payload;
  },
}