// authMiddleware.js
const multer = require('multer');
const path = require('path');
const upload = multer({
  storage: multer.memoryStorage(),
});
const tokenValidateMiddlewear =async (req, res, next) => {
  try {
    console.log(req.files);
    upload.array('files', 10);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid Token' });
  }
};

module.exports = tokenValidateMiddlewear;
