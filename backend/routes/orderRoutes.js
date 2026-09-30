const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  generatePayHereHash,
  generatePosPayHereHash,
  requestPaymentOtp,
  verifyPaymentOtp,
  payHereNotify,
  kokoNotify,
  getStoreOrders,
  cancelMyOrder,
  checkWarrantyByImei,
} = require('../controllers/orderController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

// Public routes (no auth)
router.get('/warranty-check/:imei', checkWarrantyByImei);
router.post('/payhere-notify', payHereNotify);
router.post('/koko-notify', kokoNotify);

// Orders routes (supports both authenticated users and guest checkout)
router.route('/').post(optionalProtect, createOrder);
router.route('/my').get(protect, getMyOrders);
router.route('/store').get(protect, authorize('manager'), getStoreOrders);
router.route('/pos/payhere-hash').post(protect, generatePosPayHereHash);
router.route('/:id').get(optionalProtect, getOrderById);
router.route('/:id/status').put(protect, authorize('manager', 'admin'), updateOrderStatus);
router.route('/:id/payhere-hash').post(protect, generatePayHereHash);
router.route('/:id/payment-otp/request').post(protect, requestPaymentOtp);
router.route('/:id/payment-otp/verify').post(protect, verifyPaymentOtp);
router.route('/:id/cancel').put(protect, cancelMyOrder);

module.exports = router;

