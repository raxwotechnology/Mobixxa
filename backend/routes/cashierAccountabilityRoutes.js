const express = require('express');
const router = express.Router();
const {
  getCashierSummary,
  getShortageLedger,
  getRecoveries,
  reassignShortage,
  recordDeduction,
  listCashiers,
} = require('../controllers/cashierAccountabilityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin & Manager only — enforced per-route, not reliant on the permissions.finance
// toggle, since this page must never be reachable by a cashier under any config.
router.get('/summary', protect, authorize('admin', 'manager'), getCashierSummary);
router.get('/shortages', protect, authorize('admin', 'manager'), getShortageLedger);
router.put('/shortages/:id/reassign', protect, authorize('admin', 'manager'), reassignShortage);
router.get('/recoveries', protect, authorize('admin', 'manager'), getRecoveries);
router.post('/recoveries', protect, authorize('admin', 'manager'), recordDeduction);
router.get('/cashiers', protect, authorize('admin', 'manager'), listCashiers);

module.exports = router;
