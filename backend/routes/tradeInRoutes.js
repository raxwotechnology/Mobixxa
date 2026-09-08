const express = require('express');
const router = express.Router();
const {
  calculateTradeInValuation,
  createTradeInRecord,
  getTradeIns,
  getPopularTradeInModels,
  convertToRefurbishedStock,
} = require('../controllers/tradeInController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/models', getPopularTradeInModels);
router.post('/calculate', calculateTradeInValuation);

router.route('/')
  .post(protect, createTradeInRecord)
  .get(protect, getTradeIns);

router.post('/:id/add-to-inventory', protect, authorize('admin', 'manager'), convertToRefurbishedStock);

module.exports = router;
