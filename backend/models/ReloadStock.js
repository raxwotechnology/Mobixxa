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
      enum: ['Dialog', 'Mobitel', 'Hutch', 'Airtel', 'SLT', 'EzCash', 'mCash', 'Other'],
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
  },
  {
    timestamps: true,
  }
);

reloadStockSchema.index({ storeId: 1, date: 1, operator: 1 });

module.exports = mongoose.model('ReloadStock', reloadStockSchema);
