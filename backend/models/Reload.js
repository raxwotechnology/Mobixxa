const mongoose = require('mongoose');

const reloadSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    operator: {
      type: String,
      required: [true, 'Operator is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    type: {
      type: String,
      enum: ['Prepaid', 'Postpaid', 'Bill Payment'],
      default: 'Prepaid',
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    isCredit: {
      type: Boolean,
      default: false,
    },
    creditSettled: {
      type: Boolean,
      default: false,
    },
    creditSettledAt: {
      type: Date,
    },
    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: String, // YYYY-MM-DD
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Completed',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reloadSchema.index({ mobileNumber: 1 });
reloadSchema.index({ storeId: 1, date: 1 });
reloadSchema.index({ isCredit: 1, storeId: 1 });
reloadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reload', reloadSchema);
