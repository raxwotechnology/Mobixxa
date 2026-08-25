const express = require('express');
const router = express.Router();
const {
  createReload,
  getReloads,
  getReloadStocks,
  addReloadStock,
  closeReloadStock,
  addReloadSupplierPayment,
  saveReloadDailySheet,
  // Sprint 3 — ReloadSheet endpoints
  saveReloadSheet,
  getTodayReloadSheet,
  getReloadSheetHistory,
} = require('../controllers/reloadController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getReloads)
  .post(createReload);

// ── Existing ReloadStock endpoints (unchanged) ─────────────────────────────
router.get('/stocks', getReloadStocks);
router.post('/stocks/add', addReloadStock);
router.post('/stocks/close', closeReloadStock);
router.post('/stocks/save-sheet', saveReloadDailySheet);
router.post('/supplier-payment', addReloadSupplierPayment);

// ── Sprint 3 — ReloadSheet (daily float bookkeeping) endpoints ─────────────
router.post('/save-sheet', saveReloadSheet);
router.get('/today', getTodayReloadSheet);
router.get('/history', getReloadSheetHistory);

module.exports = router;
