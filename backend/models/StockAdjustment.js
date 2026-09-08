const mongoose = require('mongoose');

const stockAdjustmentSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['addition', 'deduction', 'damage', 'return'], required: true },
    quantity: { type: Number, required: true },
    imei: [{ type: String }],
    reason: { type: String, required: true },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending_approval', 'approved', 'rejected'], default: 'approved' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
