const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

/**
 * Centralized service to record transactions and update account balances.
 * This ensures all financial data is synchronized across POS, Expenses, and Income.
 */
const recordTransaction = async ({
  storeId,
  accountId,
  type, // 'income' | 'expense' | 'transfer'
  category,
  amount,
  paymentMethod,
  chequeDetails,
  referenceNo,
  description,
  createdBy,
  date = new Date()
}) => {
  // Normalize paymentMethod for Transaction model enum (e.g., 'bank_transfer' -> 'Bank Transfer')
  let normalizedMethod = paymentMethod;
  const map = {
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'cheque': 'Cheque',
    'card': 'Card',
    'payhere': 'Card',
    'other': 'Card',
    'koko': 'Koko',
    'hire_purchase': 'Hire Purchase'
  };
  if (map[paymentMethod?.toLowerCase()]) {
    normalizedMethod = map[paymentMethod.toLowerCase()];
  }

  // 1. Create the transaction record
  const transaction = await Transaction.create({
    storeId,
    accountId,
    type,
    category,
    amount,
    paymentMethod: normalizedMethod,
    chequeDetails,
    referenceNo,
    description,
    createdBy,
    date
  });

  // 2. Update account balance if an account is linked
  // Note: For cheques, we only update when cleared (handled in status update controllers)
  if (accountId && paymentMethod?.toLowerCase() !== 'cheque') {
    const account = await Account.findById(accountId);
    if (account) {
      if (type === 'income') {
        account.balance += Number(amount);
      } else if (type === 'expense') {
        account.balance -= Number(amount);
      }
      await account.save();
    }
  }

  return transaction;
};

/**
 * Special handler for transfers between accounts
 */
const recordTransfer = async ({
  storeId,
  fromAccountId,
  toAccountId,
  amount,
  referenceNo,
  description,
  createdBy
}) => {
  // 1. Deduct from source
  await recordTransaction({
    storeId,
    accountId: fromAccountId,
    type: 'expense',
    category: 'Internal Transfer (Out)',
    amount,
    paymentMethod: 'Bank Transfer',
    referenceNo,
    description: `Transfer to ${toAccountId}: ${description}`,
    createdBy
  });

  // 2. Add to destination
  await recordTransaction({
    storeId,
    accountId: toAccountId,
    type: 'income',
    category: 'Internal Transfer (In)',
    amount,
    paymentMethod: 'Bank Transfer',
    referenceNo,
    description: `Transfer from ${fromAccountId}: ${description}`,
    createdBy
  });
};

/**
 * Append-only reversal: writes a new, equal-and-opposite Transaction against
 * the same account (never edits/deletes the original), so a delete/refund in
 * any module restores Account.balance without losing the audit trail.
 */
const reverseTransaction = async (originalTransactionId, { reason, createdBy } = {}) => {
  const original = await Transaction.findById(originalTransactionId);
  if (!original) return null;

  if (!original.accountId) {
    // No account was ever touched — nothing to offset, just hide it.
    original.voided = true;
    original.voidedAt = new Date();
    await original.save();
    return null;
  }

  // A cheque that was never cleared (still Pending/Bounced) never touched
  // the balance — there is nothing to reverse, and recordTransaction's own
  // "don't apply cheques at creation" rule would otherwise let a reversal of
  // an UNCLEARED cheque silently move money that was never moved. A CLEARED
  // cheque, by contrast, already applied its balance change and must be
  // reversed immediately — so it's built directly here (bypassing
  // recordTransaction's cheque handling, which is for new pending cheques,
  // not for undoing an already-applied one), and labeled as a bank
  // adjustment rather than 'Cheque' so it never re-enters cheque listings
  // that assume every 'Cheque' row carries chequeDetails.
  if (original.paymentMethod === 'Cheque' && original.chequeDetails?.status !== 'Cleared') {
    // Never moved the balance, so there's nothing to offset — but it's still
    // being withdrawn, so hide it the same way a reversed one would be.
    original.voided = true;
    original.voidedAt = new Date();
    await original.save();
    return null;
  }

  const reversedType = original.type === 'income' ? 'expense' : 'income';
  const reversalPaymentMethod = original.paymentMethod === 'Cheque' ? 'Bank Transfer' : original.paymentMethod;

  const reversal = await Transaction.create({
    storeId: original.storeId,
    accountId: original.accountId,
    type: reversedType,
    category: `Reversal: ${original.category}`,
    amount: original.amount,
    paymentMethod: reversalPaymentMethod,
    referenceNo: original.referenceNo,
    description: `Reversal of transaction ${original._id}${reason ? ' — ' + reason : ''}`,
    createdBy,
    date: new Date()
  });

  const account = await Account.findById(original.accountId);
  if (account) {
    if (reversedType === 'income') account.balance += original.amount;
    else account.balance -= original.amount;
    await account.save();
  }

  // Hide the superseded original from ledger lists/totals (it's fully offset
  // by the reversal now) without deleting it — the record stays queryable.
  original.voided = true;
  original.voidedAt = new Date();
  await original.save();

  return reversal;
};

/**
 * Shared cheque clearing/bouncing logic. A cheque-tendered transaction never
 * moves Account.balance at creation (see recordTransaction) — only when its
 * status changes to/from 'Cleared' does money actually move, and it must
 * move on the date that happens, not the date the cheque was entered.
 * Every module that tracks its own cheques (Financials, Supplier Payments)
 * should call this instead of mutating account.balance directly, so the
 * transaction's `date` always reflects when the balance actually changed.
 */
const setChequeStatus = async (transactionId, { status, clearedDate, createdBy } = {}) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.paymentMethod !== 'Cheque' || !transaction.chequeDetails) {
    return transaction;
  }

  const oldStatus = transaction.chequeDetails.status;
  if (oldStatus === status) return transaction;

  const wasApplied = oldStatus === 'Cleared';
  const nowApplied = status === 'Cleared';

  if (transaction.accountId && wasApplied !== nowApplied) {
    const account = await Account.findById(transaction.accountId);
    if (account) {
      const sign = transaction.type === 'income' ? 1 : transaction.type === 'expense' ? -1 : 0;
      account.balance += nowApplied ? sign * transaction.amount : -sign * transaction.amount;
      await account.save();
    }
    // The balance moves on the clearing date — attribute the ledger row to
    // that date (not the date the cheque was originally entered) so
    // date-filtered reports (Financials, balance-report) match reality.
    if (nowApplied) {
      transaction.date = clearedDate ? new Date(clearedDate) : new Date();
    }
  }

  transaction.chequeDetails.status = status;
  await transaction.save();
  return transaction;
};

module.exports = {
  recordTransaction,
  recordTransfer,
  reverseTransaction,
  setChequeStatus
};
