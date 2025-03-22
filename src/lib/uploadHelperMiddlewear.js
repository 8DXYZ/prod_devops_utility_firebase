const firebaseService = require('./firebase');
const storage = firebaseService.getAdminStorageService();
const bucket = storage.bucket();

const multer = require('multer');

const path = require('path');

const upload = multer({
  storage: multer.diskStorage({}),
});
const uploadHelper = async (req, res, next) => {

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadPromises = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      try {
        const fileName = Date.now() + path.extname(file.originalname); // Create a unique filename
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: file.mimetype,
        });

        blobStream.on('error', (err) => {
          reject(err);
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve({ fileName: file.originalname, url: publicUrl });
        });

        // Pipe the file stream directly to Firebase Storage
        const fileStream = req.file.stream;
        fileStream.pipe(blobStream);
      } catch (error) {
        reject(error);
      }
    });
  });

  try {
    // Await all uploads to complete
    const uploadedFiles = await Promise.all(uploadPromises);
    res.status(200).json({ message: 'Files uploaded successfully', files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }


};

module.exports = uploadHelper;
