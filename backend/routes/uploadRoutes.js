const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { validateMagicBytes } = require('../utils/fileValidation');

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

// Helper function to read file header buffer whether in memory or on disk
function getFileHeaderBuffer(file) {
  if (file.buffer) {
    return file.buffer;
  }
  if (file.path) {
    const fd = fs.openSync(file.path, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    return buffer;
  }
  return null;
}

// @desc    Upload an image (Avatar, Product, etc)
// @route   POST /api/upload/image
router.post('/image', protect, uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // BUG-27 Fix: Validate binary magic bytes on the server
  const fileBuffer = getFileHeaderBuffer(req.file);
  const isValidMagicBytes = validateMagicBytes(fileBuffer, ['jpg', 'png', 'webp']);

  if (!isValidMagicBytes) {
    // If stored on disk, remove spoofed file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: 'Security validation failed: File content does not match image format.',
    });
  }

  let fileUrl;
  if (req.file.buffer) {
    fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  } else if (req.file.filename) {
    fileUrl = `/uploads/${req.file.filename}`;
  } else {
    fileUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
  }
  res.json({
    message: 'Image uploaded successfully',
    url: fileUrl,
  });
});

// @desc    Upload a document (Employee Agreement, NIC, etc)
// @route   POST /api/upload/document
router.post('/document', protect, uploadDocument.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // BUG-27 Fix: Validate binary magic bytes for documents and images
  const fileBuffer = getFileHeaderBuffer(req.file);
  const isValidMagicBytes = validateMagicBytes(fileBuffer, ['pdf', 'doc', 'docx', 'jpg', 'png']);

  if (!isValidMagicBytes) {
    // If stored on disk, remove spoofed file
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: 'Security validation failed: File content does not match allowed document format.',
    });
  }

  res.json({
    message: 'Document uploaded successfully',
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
  });
});

module.exports = router;