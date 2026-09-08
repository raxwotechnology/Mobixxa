const mongoose = require('mongoose');

const reloadStockSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    operator: {
      type: String,
      required: true,
      trim: true,
    },
    cardValue: {
      type: Number,
      default: 1, // e.g. Rs. 50, 100, 500 card denomination OR 1 for total currency balance
    },
    openingStock: {
      type: Number,
      default: 0,
    },
    addedStock: {
      type: Number,
      default: 0,
    },
    totalStock: {
      type: Number,
      default: 0, // openingStock + addedStock
    },
    closingStock: {
      type: Number,
      default: 0, // Entered physical shop balance in evening
    },
    sellOutAmount: {
      type: Number,
      default: 0, // totalStock - closingStock
    },
    sellOutValue: {
      type: Number,
      default: 0, // sellOutAmount * cardValue
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    // Locking: once closed, this item's In-Hand/Sold for this date are final —
    // further stock adds or closings are rejected; corrections go through the
    // separate, logged adjustLog path instead.
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    closedAt: { type: Date },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Append-only audit trail of every "Add Stock" action — addedStock is
    // always derived as the sum of these, never set directly.
    addLog: [
      {
        qty: { type: Number, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        notes: { type: String, trim: true, default: '' },
      },
    ],
    // Logged corrections made after closing (admin/manager only).
    adjustLog: [
      {
        field: { type: String, enum: ['openingStock', 'addedStock', 'closingStock'], required: true },
        oldValue: { type: Number },
        newValue: { type: Number },
        reason: { type: String, required: true, trim: true },
        adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        adjustedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

reloadStockSchema.index({ storeId: 1, date: 1, operator: 1 });

module.exports = mongoose.model('ReloadStock', reloadStockSchema);
