const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Koko', 'Hire Purchase'], 
      required: true 
    },

    chequeDetails: {
      number: String,
      bank: String,
      dueDate: Date,
      status: { type: String, enum: ['Pending', 'Cleared', 'Bounced'], default: 'Pending' }
    },
    referenceNo: { type: String },
    description: { type: String },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ name: String, url: String }],
    // Money is append-only: a "deleted" or "corrected" transaction is never
    // edited or hard-deleted, only reversed (see ledgerService.reverseTransaction).
    // `voided` hides the superseded original from ledger lists/totals while
    // keeping it in the database for audit — the reversal row stays visible.
    voided: { type: Boolean, default: false },
    voidedAt: { type: Date }

  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
