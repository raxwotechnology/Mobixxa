const mongoose = require('mongoose');

const salaryAdvanceSchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'deducted'],
      default: 'approved',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deductedInPayroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payroll',
    },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque'],
      default: 'cash',
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    ledgerTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);

module.exports = SalaryAdvance;
