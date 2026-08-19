const express = require('express');
const router = express.Router();
const {
  createReload,
  getReloads,
  getReloadStocks,
  addReloadStock,
  closeReloadStock,
} = require('../controllers/reloadController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getReloads)
  .post(createReload);

router.get('/stocks', getReloadStocks);
router.post('/stocks/add', addReloadStock);
router.post('/stocks/close', closeReloadStock);

module.exports = router;
