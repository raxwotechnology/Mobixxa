const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup Multer Storage (memoryStorage for serverless, diskStorage for server)
const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination(req, file, cb) {
        cb(null, 'uploads/');
      },
      filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
      },
    });

function checkFileType(file, cb, isDocument = false) {
  const filetypes = isDocument ? /pdf|doc|docx|jpg|jpeg|png/ : /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${isDocument ? 'PDF, DOC, and Images' : 'Images'} are allowed.`));
  }
}

const uploadImage = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, false);
  },
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, true);
  },
});

// @desc    Upload an image (Avatar, Product, etc)
// @route   POST /api/upload/image
router.post('/image', protect, uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'Image uploaded successfully',
    url: `/uploads/${req.file.filename}`
  });
});

// @desc    Upload a document (Employee Agreement, NIC, etc)
// @route   POST /api/upload/document
router.post('/document', protect, uploadDocument.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'Document uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
  });
});

module.exports = router;
