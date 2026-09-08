const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middleware/authMiddleware');
const {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');

router.use(protect, requirePermission('suppliers'));

router.route('/')
  .get(listSuppliers)
  .post(createSupplier);

router.route('/:id')
  .put(updateSupplier)
  .delete(deleteSupplier);

module.exports = router;

