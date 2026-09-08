const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');

// Ensure uploads directory exists (safely for serverless read-only environments)
const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Uploads directory creation skipped:', err.message);
}

// Multer config for logo upload (memoryStorage for serverless, diskStorage for server)
const storage = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|svg|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Invalid image file type'));
  },
});

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
