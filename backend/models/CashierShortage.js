const mongoose = require('mongoose');

// Append-only: reassigning a shortage to a different cashier is logged here,
// never a silent overwrite of cashierId.
const reassignmentSchema = mongoose.Schema(
  {
    fromCashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toCashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Mirrors PosSession.corrections — if the source shift settlement is later
// corrected, the old/new variance is preserved here rather than just overwritten.
const correctionEchoSchema = mongoose.Schema(
  {
    previousVariance: { type: Number },
    newVariance: { type: Number },
    correctedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cashierShortageSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    // One shortage row per shift settlement — the source of truth stays PosSession.
    sourceSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosSession', required: true, unique: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    expectedCash: { type: Number, default: 0 },
    countedCash: { type: Number, default: 0 },
    variance: { type: Number, required: true }, // signed; negative = short, positive = over
    type: { type: String, enum: ['short', 'over'], required: true },
    varianceNote: { type: String, trim: true },
    reassignments: { type: [reassignmentSchema], default: [] },
    correctionHistory: { type: [correctionEchoSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cashierShortageSchema.index({ storeId: 1, cashierId: 1, date: -1 });

module.exports = mongoose.model('CashierShortage', cashierShortageSchema);
