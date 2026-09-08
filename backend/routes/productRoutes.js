const express = require('express');
const router = express.Router();
const {
  getProducts,
  searchProducts,
  getFeaturedProducts,
  getDeals,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getPriceHistory,
  getNextSku,
} = require('../controllers/productController');
const { protect, authorize, requirePermission } = require('../middleware/authMiddleware');

// Public routes (order matters — put specific before :id)
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/deals', getDeals);
router.get('/my-store', protect, authorize('manager'), getMyProducts);
router.get('/next-sku', protect, getNextSku);

router.route('/')
  .get(getProducts)
  .post(protect, requirePermission('products'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, requirePermission('products'), updateProduct)
  .delete(protect, requirePermission('products'), deleteProduct);

router.get('/:id/price-history', protect, requirePermission('products'), getPriceHistory);

module.exports = router;

