const express = require("express");
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
  logoutUser,
  verifyPassword,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
  createStaffUser,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");

router.post("/register", authLimiter, registerUser);
router.post("/register/request-otp", authLimiter, requestRegistrationOtp);
router.post("/register/verify-otp", authLimiter, verifyRegistrationOtp);
router.post("/login", authLimiter, authUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/cashiers", getCashiersList);
router.post("/pos-login", authLimiter, posLogin);
router.post("/verify-password", protect, verifyPassword);

//ADMIN ONLY ROUTE: Safely create Admins, Managers, Cashiers, etc.
router.post("/create-staff", protect, authorize, createStaffUser);

// Forgot Password & Reset Routes - BUG-14 FIX: Apply strict rate limiting to password reset endpoints
router.post("/forgot-password/request-otp", authLimiter, requestPasswordReset);
router.post("/forgot-password/verify-otp", authLimiter, verifyResetOtp);
router.post("/forgot-password/reset", authLimiter, resetPassword);

module.exports = router;
