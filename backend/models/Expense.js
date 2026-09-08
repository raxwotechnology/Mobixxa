const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Counter Petty Cash',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Tea & Refreshments',
    },
    type: {
      type: String,
      enum: ['Expense', 'Income'],
      default: 'Expense',
    },
    customCategory: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentMethod: { 
      type: String, 
      enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque'], 
      default: 'Cash' 
    },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Cancelled'],
      default: 'Pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    payee: {
      type: String,
      trim: true,
      default: '',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receipt: {
      type: String, // URL to receipt image
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ storeId: 1, date: -1 });
expenseSchema.index({ status: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
