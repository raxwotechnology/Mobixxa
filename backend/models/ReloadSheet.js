const mongoose = require('mongoose');

const operatorRowSchema = new mongoose.Schema(
  {
    operatorName: {
      type: String,
      required: true,
      trim: true,
    },
    openingStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    addedToday: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFloat: {
      type: Number,
      default: 0,
    },
    eveningInHand: {
      type: Number,
      default: 0,
      min: 0,
    },
    todaySoldOut: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 4,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    netRevenue: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const reloadSheetSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    cashier: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        trim: true,
      },
    },
    operators: {
      type: [operatorRowSchema],
      default: [],
    },
    totalAddedToday: {
      type: Number,
      default: 0,
    },
    totalEveningInHand: {
      type: Number,
      default: 0,
    },
    totalSoldOutRevenue: {
      type: Number,
      default: 0,
    },
    totalCommissionAmount: {
      type: Number,
      default: 0,
    },
    totalNetRevenue: {
      type: Number,
      default: 0,
    },
    syncedToDrawer: {
      type: Boolean,
      default: false,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reloadSheetSchema.index({ storeId: 1, date: 1 }, { unique: true });
reloadSheetSchema.index({ date: -1 });

module.exports = mongoose.model('ReloadSheet', reloadSheetSchema);
