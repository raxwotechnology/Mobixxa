const express = require('express');
const router = express.Router();
const {
  getSupplierSummary,
  getSupplierPayments,
  getSupplierLedger,
  recordPayment,
  recordPurchase,
  updateTransaction,
  deleteTransaction,
  updateChequeStatus,
} = require('../controllers/supplierPaymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', authorize('admin', 'manager', 'cashier'), getSupplierSummary);
router.get('/payments', authorize('admin', 'manager', 'cashier'), getSupplierPayments);
router.get('/:supplierId/ledger', authorize('admin', 'manager', 'cashier'), getSupplierLedger);
router.post('/:supplierId/pay', authorize('admin', 'manager', 'cashier'), recordPayment);
router.post('/:supplierId/purchase', authorize('admin', 'manager', 'cashier'), recordPurchase);
router.put('/transaction/:id', authorize('admin', 'manager', 'cashier'), updateTransaction);
router.put('/cheque-status/:id', authorize('admin', 'manager', 'cashier'), updateChequeStatus);
router.delete('/transaction/:id', authorize('admin'), deleteTransaction);

module.exports = router;
