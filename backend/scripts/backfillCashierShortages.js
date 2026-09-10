// One-time backfill: mirror already-closed PosSession variances into the
// Cashier Cash Accountability ledger. The endSession hook only creates a
// CashierShortage record going forward — shifts closed before that hook
// existed have real variance data sitting on PosSession but no ledger row.
require('dotenv').config();
const connectDB = require('../config/db');
const PosSession = require('../models/PosSession');
const CashierShortage = require('../models/CashierShortage');

const run = async () => {
  try {
    await connectDB();

    const sessions = await PosSession.find({ status: 'closed', variance: { $ne: 0 } }).lean();

    let created = 0;
    let skipped = 0;

    for (const session of sessions) {
      const existing = await CashierShortage.findOne({ sourceSessionId: session._id });
      if (existing) { skipped += 1; continue; }

      await CashierShortage.create({
        storeId: session.storeId,
        sourceSessionId: session._id,
        cashierId: session.cashierId,
        date: session.endedAt || session.updatedAt || session.createdAt,
        expectedCash: session.expectedCash,
        countedCash: session.closingCashCountedAmount,
        variance: session.variance,
        type: session.variance < 0 ? 'short' : 'over',
        varianceNote: session.varianceNote,
      });
      created += 1;
    }

    console.log(`Backfill complete. Closed sessions with variance: ${sessions.length}, created: ${created}, already existed: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exit(1);
  }
};

run();
