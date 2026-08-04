const express = require('express');
const router = express.Router();
const {
  calculateTradeInValuation,
  createTradeInRecord,
  getTradeIns,
  getPopularTradeInModels,
  convertToRefurbishedStock,
} = require('../controllers/tradeInController');
const { protect, admin, manager } = require('../middleware/authMiddleware');

router.get('/models', getPopularTradeInModels);
router.post('/calculate', calculateTradeInValuation);

router.route('/')
  .post(protect, createTradeInRecord)
  .get(protect, getTradeIns);

router.post('/:id/add-to-inventory', protect, manager, convertToRefurbishedStock);

module.exports = router;
