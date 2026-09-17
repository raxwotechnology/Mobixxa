const CashierShortage = require('../models/CashierShortage');
const CashierRecovery = require('../models/CashierRecovery');
const User = require('../models/User');
const Store = require('../models/Store');

// Resolve the store scope for the current request the same way financeController does:
// managers are locked to their own store, admins may pass ?storeId= or see all.
const resolveStoreFilter = async (req) => {
  const { storeId } = req.query;
  if (req.user.role === 'manager') {
    const store = await Store.findOne({ managerId: req.user._id });
    return store ? { storeId: store._id } : {};
  }
  if (storeId && storeId !== 'all') {
    return { storeId };
  }
  return {};
};

const buildDateFilter = (req) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  return Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};
};

// @desc    Per-cashier accumulated shortage / recovered / outstanding
// @route   GET /api/cashier-accountability/summary
// @access  Private/Admin/Manager
const getCashierSummary = async (req, res, next) => {
  try {
    const storeFilter = await resolveStoreFilter(req);
    const dateFilter = buildDateFilter(req);
    const { cashierId } = req.query;

    const cashierMatch = { role: 'cashier', isActive: { $ne: false } };
    if (storeFilter.storeId) cashierMatch.assignedStore = storeFilter.storeId;
    if (cashierId) cashierMatch._id = cashierId;

    const cashiers = await User.find(cashierMatch).select('_id name email').lean();

    const shortages = await CashierShortage.find({ ...storeFilter, ...dateFilter }).lean();
    const recoveries = await CashierRecovery.find({ ...storeFilter, ...dateFilter }).lean();

    const totals = new Map();
    const ensure = (id) => {
      const key = String(id);
      if (!totals.has(key)) {
        totals.set(key, { totalShortage: 0, totalOver: 0, totalRecovered: 0 });
      }
      return totals.get(key);
    };

    shortages.forEach((s) => {
      const t = ensure(s.cashierId);
      if (s.type === 'short') t.totalShortage += Math.abs(s.variance);
      else t.totalOver += s.variance;
    });
    recoveries.forEach((r) => {
      const t = ensure(r.cashierId);
      t.totalRecovered += r.amount;
    });

    const result = cashiers.map((c) => {
      const t = totals.get(String(c._id)) || { totalShortage: 0, totalOver: 0, totalRecovered: 0 };
      return {
        cashier: c,
        cashierId: c._id,
        totalShortage: t.totalShortage,
        totalOver: t.totalOver,
        totalRecovered: t.totalRecovered,
        outstanding: Math.max(0, t.totalShortage - t.totalRecovered),
      };
    });

    // Include any cashier that has shortage/recovery rows but is no longer
    // in the active cashiers list (e.g. deactivated) — keep the ledger visible.
    const knownIds = new Set(cashiers.map((c) => String(c._id)));
    for (const [id, t] of totals.entries()) {
      if (!knownIds.has(id)) {
        const u = await User.findById(id).select('_id name email').lean();
        result.push({
          cashier: u || { _id: id, name: 'Unknown / Deactivated', email: '' },
          cashierId: id,
          totalShortage: t.totalShortage,
          totalOver: t.totalOver,
          totalRecovered: t.totalRecovered,
          outstanding: Math.max(0, t.totalShortage - t.totalRecovered),
        });
      }
    }

    result.sort((a, b) => b.outstanding - a.outstanding);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Detail sheet — one row per shortage/over event
// @route   GET /api/cashier-accountability/shortages
// @access  Private/Admin/Manager
const getShortageLedger = async (req, res, next) => {
  try {
    const storeFilter = await resolveStoreFilter(req);
    const dateFilter = buildDateFilter(req);
    const { cashierId, type } = req.query;

    const filter = { ...storeFilter, ...dateFilter };
    if (cashierId) filter.cashierId = cashierId;
    if (type) filter.type = type;

    const rows = await CashierShortage.find(filter)
      .populate('cashierId', 'name email')
      .populate('reassignments.toCashierId', 'name')
      .populate('reassignments.fromCashierId', 'name')
      .sort({ date: -1 });

    res.json(rows);
  } catch (error) { next(error); }
};

// @desc    Recovery/deduction history
// @route   GET /api/cashier-accountability/recoveries
// @access  Private/Admin/Manager
const getRecoveries = async (req, res, next) => {
  try {
    const storeFilter = await resolveStoreFilter(req);
    const dateFilter = buildDateFilter(req);
    const { cashierId } = req.query;

    const filter = { ...storeFilter, ...dateFilter };
    if (cashierId) filter.cashierId = cashierId;

    const rows = await CashierRecovery.find(filter)
      .populate('cashierId', 'name email')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json(rows);
  } catch (error) { next(error); }
};

// @desc    Reassign a shortage/over event to a different cashier (logged, not silent)
// @route   PUT /api/cashier-accountability/shortages/:id/reassign
// @access  Private/Admin/Manager
const reassignShortage = async (req, res, next) => {
  try {
    const { toCashierId, reason } = req.body;
    if (!toCashierId || !String(reason || '').trim()) {
      res.status(400);
      return next(new Error('toCashierId and reason are required'));
    }

    const target = await User.findOne({ _id: toCashierId, role: { $in: ['cashier', 'manager', 'admin'] } });
    if (!target) {
      res.status(404);
      return next(new Error('Target cashier not found'));
    }

    const record = await CashierShortage.findById(req.params.id);
    if (!record) {
      res.status(404);
      return next(new Error('Shortage record not found'));
    }

    record.reassignments.push({
      fromCashierId: record.cashierId,
      toCashierId,
      reason: reason.trim(),
      changedBy: req.user._id,
      changedAt: new Date(),
    });
    record.cashierId = toCashierId;
    await record.save();

    const populated = await CashierShortage.findById(record._id)
      .populate('cashierId', 'name email')
      .populate('reassignments.toCashierId', 'name')
      .populate('reassignments.fromCashierId', 'name');

    res.json(populated);
  } catch (error) { next(error); }
};

// @desc    Record a salary deduction / recovery against a cashier's outstanding balance
// @route   POST /api/cashier-accountability/recoveries
// @access  Private/Admin/Manager
const recordDeduction = async (req, res, next) => {
  try {
    const { cashierId, amount, date, note, payrollPeriod, overrideReason } = req.body;

    if (!cashierId || !amount || Number(amount) <= 0) {
      res.status(400);
      return next(new Error('cashierId and a positive amount are required'));
    }

    const periodMonth = Number(payrollPeriod?.month);
    const periodYear = Number(payrollPeriod?.year);
    if (!periodMonth || periodMonth < 1 || periodMonth > 12 || !periodYear) {
      res.status(400);
      return next(new Error('payrollPeriod (month and year) is required'));
    }

    const cashier = await User.findById(cashierId);
    if (!cashier) {
      res.status(404);
      return next(new Error('Cashier not found'));
    }

    // Recompute the outstanding balance fresh — never trust a cached total.
    const shortages = await CashierShortage.find({ cashierId, type: 'short' }).lean();
    const recoveries = await CashierRecovery.find({ cashierId }).lean();
    const totalShortage = shortages.reduce((s, r) => s + Math.abs(r.variance), 0);
    const totalRecovered = recoveries.reduce((s, r) => s + r.amount, 0);
    const outstanding = Math.max(0, totalShortage - totalRecovered);

    const amt = Number(amount);
    if (amt > outstanding + 0.01 && !String(overrideReason || '').trim()) {
      res.status(400);
      return next(new Error(`Amount exceeds outstanding balance of Rs. ${outstanding.toFixed(2)}. Provide overrideReason to force it.`));
    }

    let storeId;
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      storeId = store?._id;
    } else if (req.body.storeId) {
      storeId = req.body.storeId;
    }

    const recovery = await CashierRecovery.create({
      storeId,
      cashierId,
      amount: amt,
      date: date ? new Date(date) : new Date(),
      note,
      payrollPeriod: { month: periodMonth, year: periodYear },
      overrideReason: amt > outstanding + 0.01 ? overrideReason.trim() : undefined,
      recordedBy: req.user._id,
      recordedAt: new Date(),
    });

    const populated = await CashierRecovery.findById(recovery._id)
      .populate('cashierId', 'name email')
      .populate('recordedBy', 'name');

    res.status(201).json(populated);
  } catch (error) { next(error); }
};

// @desc    List active cashiers for the reassign/record-deduction pickers
// @route   GET /api/cashier-accountability/cashiers
// @access  Private/Admin/Manager
const listCashiers = async (req, res, next) => {
  try {
    const storeFilter = await resolveStoreFilter(req);
    const match = { role: { $in: ['cashier', 'manager'] }, isActive: { $ne: false } };
    if (storeFilter.storeId) match.assignedStore = storeFilter.storeId;

    const cashiers = await User.find(match).select('_id name email role').lean();
    res.json(cashiers);
  } catch (error) { next(error); }
};

module.exports = {
  getCashierSummary,
  getShortageLedger,
  getRecoveries,
  reassignShortage,
  recordDeduction,
  listCashiers,
};
