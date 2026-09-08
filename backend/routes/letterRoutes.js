const express = require('express');
const router = express.Router();
const { getIssuedLetters, issueLetter, deleteLetter } = require('../controllers/letterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('manager', 'admin'), getIssuedLetters);
router.post('/', authorize('manager', 'admin'), issueLetter);
router.delete('/:id', authorize('admin'), deleteLetter);

module.exports = router;
