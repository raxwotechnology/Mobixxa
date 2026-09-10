const mongoose = require('mongoose');

// Append-only ledger of salary deductions / recoveries against a cashier's
// accumulated shortage — never edited or deleted, only added to.
const cashierRecoverySchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
    // Unused today — a hook for a later Overtime/Payroll integration.
    payrollPeriod: { type: String, trim: true },
    // Only set when the amount was allowed to exceed the outstanding balance.
    overrideReason: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

cashierRecoverySchema.index({ cashierId: 1, date: -1 });

module.exports = mongoose.model('CashierRecovery', cashierRecoverySchema);
