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
} = require('../controllers/reloadController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getReloads)
  .post(createReload);

router.get('/stocks', getReloadStocks);
router.post('/stocks/add', addReloadStock);
router.post('/stocks/close', closeReloadStock);
router.post('/stocks/save-sheet', saveReloadDailySheet);
router.post('/supplier-payment', addReloadSupplierPayment);

module.exports = router;
