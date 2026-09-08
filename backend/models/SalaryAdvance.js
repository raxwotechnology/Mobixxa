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
  },
  {
    timestamps: true,
  }
);

const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);

module.exports = SalaryAdvance;
