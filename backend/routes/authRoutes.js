const express = require('express');
const router = express.Router();
const {
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  authUser,
  getMe,
  updateProfile,
  getCashiersList,
  posLogin,
  verifyPassword,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/register/request-otp', requestRegistrationOtp);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/login', authUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/cashiers', getCashiersList);
router.post('/pos-login', posLogin);
router.post('/verify-password', protect, verifyPassword);

// Forgot Password & Reset Routes
router.post('/forgot-password/request-otp', requestPasswordReset);
router.post('/forgot-password/verify-otp', verifyResetOtp);
router.post('/forgot-password/reset', resetPassword);

module.exports = router;
