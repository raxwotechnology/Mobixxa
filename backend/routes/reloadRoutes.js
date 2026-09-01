const express = require('express');
const router = express.Router();
const {
  createReload,
  getReloads,
  settleCreditReload,
  getReloadStocks,
  addReloadStock,
  closeReloadStock,
  adjustReloadStock,
  addReloadSupplierPayment,
  saveReloadDailySheet,
} = require('../controllers/reloadController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getReloads)
  .post(createReload);

router.put('/:id/settle', settleCreditReload);

router.get('/stocks', getReloadStocks);
router.post('/stocks/add', addReloadStock);
router.post('/stocks/close', closeReloadStock);
router.post('/stocks/adjust', authorize('admin', 'manager'), adjustReloadStock);
router.post('/stocks/save-sheet', saveReloadDailySheet);
router.post('/supplier-payment', addReloadSupplierPayment);

module.exports = router;
