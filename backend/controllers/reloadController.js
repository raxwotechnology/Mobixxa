const Reload = require('../models/Reload');
const ReloadStock = require('../models/ReloadStock');
const Transaction = require('../models/Transaction');
const Store = require('../models/Store');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');

// @desc    Record a new reload
// @route   POST /api/reloads
// @access  Private
const createReload = async (req, res, next) => {
  try {
    const { 
      mobileNumber, 
      operator, 
      amount, 
      type, 
      paymentMethod, 
      notes, 
      storeId,
      accountId,
      customerName 
    } = req.body;

    let assignedStore = storeId;
    if (!assignedStore) {
      if (req.user.role === 'manager') {
        const store = await Store.findOne({ managerId: req.user._id });
        if (store) assignedStore = store._id;
      } else if (req.user.assignedStore) {
        assignedStore = req.user.assignedStore;
      } else if (req.user.role === 'admin') {
        const store = await Store.findOne({ isActive: true });
        if (store) assignedStore = store._id;
      }
    }

    if (!assignedStore) {
      res.status(400);
      return next(new Error('No store found for this transaction. Please ensure your account is linked to a store.'));
    }

    const isCredit = String(paymentMethod).toLowerCase() === 'credit';

    // 1. Create Transaction for the record
    let transaction = null;
    try {
      transaction = await Transaction.create({
        storeId: assignedStore || null,
        accountId: isCredit ? null : (accountId || null),
        type: 'income',
        category: isCredit ? 'Credit Reload' : 'Reload & Bill Payment',
        amount: Number(amount),
        paymentMethod: isCredit ? 'Credit' : (paymentMethod || 'Cash'),
        description: `${isCredit ? '[CREDIT] ' : ''}${type || 'Prepaid'} Reload: ${operator} - ${mobileNumber}${customerName ? ` (${customerName})` : ''}`,
        date: new Date(),
        createdBy: req.user._id,
      });
    } catch (tErr) {
      console.error('[Reload Transaction Warning]:', tErr.message);
    }

    // 2. Create Reload record
    const reload = await Reload.create({
      storeId: assignedStore || null,
      mobileNumber,
      customerName: customerName || undefined,
      operator,
      amount: Number(amount),
      type: type || 'Prepaid',
      paymentMethod: isCredit ? 'Credit' : (paymentMethod || 'Cash'),
      isCredit,
      creditSettled: false,
      notes,
      transactionId: transaction?._id || null,
      createdBy: req.user._id,
      status: 'Completed'
    });

    res.status(201).json({
      success: true,
      data: reload,
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reloads
// @route   GET /api/reloads
// @access  Private
const getReloads = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, operator } = req.query;
    const filter = {};

    let assignedStore = storeId;
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    }

    if (assignedStore && assignedStore !== 'all') {
      filter.storeId = assignedStore;
    }
    
    if (operator) filter.operator = operator;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const reloads = await Reload.find(filter)
      .populate('createdBy', 'name')
      .populate('storeId', 'name')
      .sort({ createdAt: -1 });

    res.json(reloads);
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily reload stocks
// @route   GET /api/reloads/stocks
// @access  Private
// @desc    Get daily reload stocks
// @route   GET /api/reloads/stocks
// @access  Private
const getReloadStocks = async (req, res, next) => {
  try {
    const { date, storeId } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filter = { date: targetDate };

    let assignedStore = storeId;
    if (assignedStore && assignedStore !== 'all') {
      filter.storeId = assignedStore;
    } else if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) filter.storeId = store._id;
    } else if (req.user.assignedStore) {
      filter.storeId = req.user.assignedStore;
    }

    let stocks = await ReloadStock.find(filter)
      .populate('recordedBy', 'name')
      .sort({ operator: 1, cardValue: 1 });

    // Auto-carry forward Opening Stock from previous date if today's records don't exist yet
    if (stocks.length === 0 && filter.storeId) {
      const prevStockItem = await ReloadStock.findOne({
        storeId: filter.storeId,
        date: { $lt: targetDate }
      }).sort({ date: -1 });

      if (prevStockItem) {
        const prevStocks = await ReloadStock.find({
          storeId: filter.storeId,
          date: prevStockItem.date
        });

        for (const prevItem of prevStocks) {
          const carriedOpening = prevItem.closingStock !== undefined && prevItem.closingStock !== null
            ? prevItem.closingStock 
            : prevItem.totalStock;

          await ReloadStock.create({
            storeId: filter.storeId,
            date: targetDate,
            operator: prevItem.operator,
            cardValue: prevItem.cardValue,
            openingStock: carriedOpening,
            addedStock: 0,
            totalStock: carriedOpening,
            closingStock: carriedOpening,
            sellOutAmount: 0,
            sellOutValue: 0,
            notes: `Auto-carried from ${prevItem.date}`,
            recordedBy: req.user._id
          });
        }

        stocks = await ReloadStock.find(filter)
          .populate('recordedBy', 'name')
          .sort({ operator: 1, cardValue: 1 });
      }
    }

    res.json(stocks);
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update reload stock (Opening / Added stock)
// @route   POST /api/reloads/stocks/add
// @access  Private
const addReloadStock = async (req, res, next) => {
  try {
    const { storeId, operator, cardValue, openingStock, addedStock, notes, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let assignedStore = storeId;
    if (!assignedStore) {
      if (req.user.role === 'manager') {
        const store = await Store.findOne({ managerId: req.user._id });
        if (store) assignedStore = store._id;
      } else if (req.user.assignedStore) {
        assignedStore = req.user.assignedStore;
      } else if (req.user.role === 'admin') {
        const store = await Store.findOne({ isActive: true });
        if (store) assignedStore = store._id;
      }
    }

    let stockItem = await ReloadStock.findOne({
      storeId: assignedStore,
      date: targetDate,
      operator,
      cardValue: Number(cardValue || 1),
    });

    if (stockItem) {
      if (openingStock !== undefined && openingStock !== '') stockItem.openingStock = Number(openingStock);
      if (addedStock !== undefined && addedStock !== '') stockItem.addedStock += Number(addedStock);
      stockItem.totalStock = stockItem.openingStock + stockItem.addedStock;
      stockItem.closingStock = stockItem.totalStock; // reset evening balance to total stock until closed
      stockItem.sellOutAmount = 0;
      stockItem.sellOutValue = 0;
      if (notes) stockItem.notes = notes;
      stockItem.recordedBy = req.user._id;
      await stockItem.save();
    } else {
      const openVal = Number(openingStock || 0);
      const addVal = Number(addedStock || 0);
      const totalVal = openVal + addVal;
      stockItem = await ReloadStock.create({
        storeId: assignedStore,
        date: targetDate,
        operator,
        cardValue: Number(cardValue || 1),
        openingStock: openVal,
        addedStock: addVal,
        totalStock: totalVal,
        closingStock: totalVal,
        sellOutAmount: 0,
        sellOutValue: 0,
        notes,
        recordedBy: req.user._id,
      });
    }

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Close evening shop stock balance & auto-calculate Sell-Out & Income Ledger
// @route   POST /api/reloads/stocks/close
// @access  Private
const closeReloadStock = async (req, res, next) => {
  try {
    const { stockId, closingStock, notes } = req.body;

    const stockItem = await ReloadStock.findById(stockId);
    if (!stockItem) {
      res.status(404);
      return next(new Error('Reload stock record not found'));
    }

    stockItem.closingStock = Number(closingStock);
    stockItem.sellOutAmount = Math.max(0, stockItem.totalStock - stockItem.closingStock);
    stockItem.sellOutValue = stockItem.sellOutAmount * stockItem.cardValue;
    if (notes) stockItem.notes = notes;
    stockItem.recordedBy = req.user._id;

    // Auto Create / Update Financial Transaction for Income Ledger
    if (stockItem.sellOutValue > 0) {
      const itemTitle = stockItem.cardValue === 1 ? 'E-Reload Float' : `Rs. ${stockItem.cardValue} Cards`;
      const desc = `Daily Reload Sales (${stockItem.operator} - ${itemTitle}): ${stockItem.sellOutAmount} sold`;

      if (stockItem.transactionId) {
        await Transaction.findByIdAndUpdate(stockItem.transactionId, {
          amount: stockItem.sellOutValue,
          description: desc
        });
      } else {
        const trans = await Transaction.create({
          storeId: stockItem.storeId,
          type: 'income',
          category: 'Reload & Bill Payment',
          amount: stockItem.sellOutValue,
          paymentMethod: 'Cash',
          description: desc,
          date: new Date(),
          createdBy: req.user._id
        });
        stockItem.transactionId = trans._id;
      }
    }

    await stockItem.save();

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Supplier / Service Float Payment Expense
// @route   POST /api/reloads/supplier-payment
// @access  Private
const addReloadSupplierPayment = async (req, res, next) => {
  try {
    const { storeId, supplierName, operator, amount, paymentMethod, notes } = req.body;

    let assignedStore = storeId;
    if (!assignedStore) {
      if (req.user.role === 'manager') {
        const store = await Store.findOne({ managerId: req.user._id });
        if (store) assignedStore = store._id;
      } else if (req.user.assignedStore) {
        assignedStore = req.user.assignedStore;
      } else if (req.user.role === 'admin') {
        const store = await Store.findOne({ isActive: true });
        if (store) assignedStore = store._id;
      }
    }

    if (!assignedStore) {
      const anyStore = await Store.findOne({ isActive: true });
      if (anyStore) assignedStore = anyStore._id;
    }

    // 1. Find or create the Supplier record for the Distributor
    const cleanSupplierName = (supplierName || `${operator || 'Telecom'} Distributor`).trim();
    let supplier = await Supplier.findOne({
      name: { $regex: new RegExp(`^${cleanSupplierName}$`, 'i') }
    });

    if (!supplier) {
      supplier = await Supplier.create({
        name: cleanSupplierName,
        companyName: `${operator || 'Telecom'} Reload Distribution`,
        contactPerson: `${operator || 'Telecom'} Distribution Agent`,
        phone: '+94770000000',
        email: `reload_${Date.now()}@supplier.local`,
        category: 'Mobile Reloads & SIM Cards',
        storeId: assignedStore || null,
        status: 'active'
      });
    }

    // 2. Map paymentMethod for SupplierPayment enum
    let mappedMethod = 'cash';
    const pmLower = (paymentMethod || '').toLowerCase();
    if (pmLower.includes('bank') || pmLower.includes('transfer')) mappedMethod = 'bank_transfer';
    else if (pmLower.includes('cheque')) mappedMethod = 'cheque';
    else if (pmLower.includes('cash')) mappedMethod = 'cash';
    else mappedMethod = 'other';

    // 3. Create SupplierPayment record
    let supplierPaymentRecord = null;
    if (supplier && assignedStore) {
      supplierPaymentRecord = await SupplierPayment.create({
        supplierId: supplier._id,
        storeId: assignedStore,
        type: 'payment',
        amount: Number(amount),
        paymentMethod: mappedMethod,
        description: `Reload Float / Card Payment (${operator || 'Network'}) - ${notes || cleanSupplierName}`,
        date: new Date(),
        createdBy: req.user._id
      });
    }

    // 4. Create Ledger Expense Transaction
    const transaction = await Transaction.create({
      storeId: assignedStore || null,
      type: 'expense',
      category: 'Reload Supplier Cost',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      description: `Reload Supplier Purchase (${operator || 'Float'}) - ${cleanSupplierName}`,
      notes,
      date: new Date(),
      createdBy: req.user._id
    });

    res.status(201).json({ 
      success: true, 
      data: transaction, 
      supplierPayment: supplierPaymentRecord 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk save whole Daily In-Hand Reload & Card Sheet with auto-calculated Sell-Out
// @route   POST /api/reloads/stocks/save-sheet
// @access  Private
const saveReloadDailySheet = async (req, res, next) => {
  try {
    const { storeId, date, items } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let assignedStore = storeId;
    if (!assignedStore) {
      if (req.user.role === 'manager') {
        const store = await Store.findOne({ managerId: req.user._id });
        if (store) assignedStore = store._id;
      } else if (req.user.assignedStore) {
        assignedStore = req.user.assignedStore;
      } else if (req.user.role === 'admin') {
        const store = await Store.findOne({ isActive: true });
        if (store) assignedStore = store._id;
      }
    }

    if (!assignedStore) {
      const anyStore = await Store.findOne({ isActive: true });
      if (anyStore) assignedStore = anyStore._id;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      return next(new Error('No sheet items provided'));
    }

    const updatedRecords = [];
    let totalDailySellOutRevenue = 0;

    for (const item of items) {
      const operator = item.operator;
      const cardValue = Number(item.cardValue || 1);
      const openingStock = Number(item.openingStock || 0);
      const addedStock = Number(item.addedStock || 0);
      const totalStock = openingStock + addedStock;
      const closingStock = item.closingStock !== undefined && item.closingStock !== null && item.closingStock !== ''
        ? Number(item.closingStock)
        : totalStock;
      const sellOutAmount = Math.max(0, totalStock - closingStock);
      const sellOutValue = sellOutAmount * cardValue;

      totalDailySellOutRevenue += sellOutValue;

      let record = await ReloadStock.findOne({
        storeId: assignedStore,
        date: targetDate,
        operator,
        cardValue,
      });

      if (record) {
        record.openingStock = openingStock;
        record.addedStock = addedStock;
        record.totalStock = totalStock;
        record.closingStock = closingStock;
        record.sellOutAmount = sellOutAmount;
        record.sellOutValue = sellOutValue;
        if (item.notes) record.notes = item.notes;
        record.recordedBy = req.user._id;
        await record.save();
      } else {
        record = await ReloadStock.create({
          storeId: assignedStore,
          date: targetDate,
          operator,
          cardValue,
          openingStock,
          addedStock,
          totalStock,
          closingStock,
          sellOutAmount,
          sellOutValue,
          notes: item.notes || '',
          recordedBy: req.user._id,
        });
      }
      updatedRecords.push(record);
    }

    res.status(200).json({
      success: true,
      data: updatedRecords,
      totalSellOutRevenue: totalDailySellOutRevenue,
      message: 'Daily reload balance sheet saved & synced successfully! 📊✅'
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 3 — Daily Float Bookkeeping Sheet (ReloadSheet model)
// ─────────────────────────────────────────────────────────────────────────────
const ReloadSheet = require('../models/ReloadSheet');

/**
 * Helper: resolve which storeId to use for the current request user.
 */
const resolveStore = async (req, overrideStoreId) => {
  if (overrideStoreId) return overrideStoreId;
  if (req.user.role === 'manager') {
    const store = await Store.findOne({ managerId: req.user._id });
    if (store) return store._id;
  }
  if (req.user.assignedStore) return req.user.assignedStore;
  if (req.user.role === 'admin') {
    const store = await Store.findOne({ isActive: true });
    if (store) return store._id;
  }
  const anyStore = await Store.findOne({ isActive: true });
  return anyStore ? anyStore._id : null;
};

/**
 * Helper: compute derived fields for every operator row and return totals.
 */
const deriveSheetTotals = (operators) => {
  let totalAddedToday = 0;
  let totalEveningInHand = 0;
  let totalSoldOutRevenue = 0;
  let totalCommissionAmount = 0;
  let totalNetRevenue = 0;

  const derived = operators.map((op) => {
    const openingStock   = Number(op.openingStock   || 0);
    const addedToday     = Number(op.addedToday     || 0);
    const totalFloat     = openingStock + addedToday;
    const eveningInHand  = Number(op.eveningInHand  !== undefined && op.eveningInHand !== null ? op.eveningInHand : totalFloat);
    const todaySoldOut   = Math.max(0, totalFloat - eveningInHand);
    const commissionRate = Number(op.commissionRate !== undefined ? op.commissionRate : 4);
    const commissionAmount = Number(((todaySoldOut * commissionRate) / 100).toFixed(2));
    const netRevenue     = Number((todaySoldOut - commissionAmount).toFixed(2));

    totalAddedToday      += addedToday;
    totalEveningInHand   += eveningInHand;
    totalSoldOutRevenue  += todaySoldOut;
    totalCommissionAmount += commissionAmount;
    totalNetRevenue      += netRevenue;

    return {
      operatorName:    op.operatorName,
      openingStock,
      addedToday,
      totalFloat,
      eveningInHand,
      todaySoldOut,
      commissionRate,
      commissionAmount,
      netRevenue,
    };
  });

  return {
    operators: derived,
    totalAddedToday,
    totalEveningInHand,
    totalSoldOutRevenue: Number(totalSoldOutRevenue.toFixed(2)),
    totalCommissionAmount: Number(totalCommissionAmount.toFixed(2)),
    totalNetRevenue: Number(totalNetRevenue.toFixed(2)),
  };
};

// ── 1. POST /api/reloads/save-sheet ─────────────────────────────────────────
// @desc  Upsert today's daily float bookkeeping sheet & sync to cash drawer.
// @route POST /api/reloads/save-sheet
// @access Private
const saveReloadSheet = async (req, res, next) => {
  try {
    const { date, operators, storeId: bodyStoreId, syncToDrawer } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!Array.isArray(operators) || operators.length === 0) {
      res.status(400);
      return next(new Error('No operator rows provided'));
    }

    const assignedStore = await resolveStore(req, bodyStoreId);

    // Compute derived fields server-side (single source of truth)
    const {
      operators: derivedOperators,
      totalAddedToday,
      totalEveningInHand,
      totalSoldOutRevenue,
      totalCommissionAmount,
      totalNetRevenue,
    } = deriveSheetTotals(operators);

    // Find or create the sheet for this store+date
    let sheet = await ReloadSheet.findOne({ storeId: assignedStore, date: targetDate });

    let transactionId = sheet?.transactionId || null;
    let syncedToDrawer = sheet?.syncedToDrawer || false;

    // Create or update a finance Transaction for this sheet
    if (syncToDrawer !== false && totalSoldOutRevenue > 0) {
      const txDesc = `Daily Reload Float Sell-Out (${targetDate}): Rs. ${totalSoldOutRevenue.toLocaleString()} total across ${derivedOperators.length} operators`;
      if (transactionId) {
        // Update existing transaction amount
        await Transaction.findByIdAndUpdate(transactionId, {
          amount: totalSoldOutRevenue,
          description: txDesc,
        });
      } else {
        // Create new Transaction
        const tx = await Transaction.create({
          storeId: assignedStore || null,
          type: 'income',
          category: 'Reload & Bill Payment',
          amount: totalSoldOutRevenue,
          paymentMethod: 'Cash',
          description: txDesc,
          date: new Date(),
          createdBy: req.user._id,
        });
        transactionId = tx._id;
      }
      syncedToDrawer = true;
    }

    const sheetPayload = {
      storeId: assignedStore,
      date: targetDate,
      cashier: {
        id: req.user._id,
        name: req.user.name || '',
      },
      operators: derivedOperators,
      totalAddedToday,
      totalEveningInHand,
      totalSoldOutRevenue,
      totalCommissionAmount,
      totalNetRevenue,
      syncedToDrawer,
      transactionId,
    };

    if (sheet) {
      Object.assign(sheet, sheetPayload);
      await sheet.save();
    } else {
      sheet = await ReloadSheet.create(sheetPayload);
    }

    res.status(200).json({
      success: true,
      data: sheet,
      message: `Daily Reload Sheet saved & synced to cash drawer! 📊✅  Total Sold-Out: Rs. ${totalSoldOutRevenue.toLocaleString()}`,
    });
  } catch (error) {
    next(error);
  }
};

// ── 2. GET /api/reloads/today ────────────────────────────────────────────────
// @desc  Fetch today's reload sheet, or pre-populate opening from yesterday's evening.
// @route GET /api/reloads/today
// @access Private
const getTodayReloadSheet = async (req, res, next) => {
  try {
    const { storeId: queryStoreId, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const assignedStore = await resolveStore(req, queryStoreId);

    // 1. Look for today's sheet
    const todaySheet = await ReloadSheet.findOne({ storeId: assignedStore, date: targetDate }).lean();
    if (todaySheet) {
      return res.json({ success: true, data: todaySheet, source: 'today' });
    }

    // 2. No sheet today — find yesterday's sheet and carry forward eveningInHand → openingStock
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdaySheet = await ReloadSheet.findOne({
      storeId: assignedStore,
      date: { $lte: yesterdayStr },
    })
      .sort({ date: -1 })
      .lean();

    if (yesterdaySheet && Array.isArray(yesterdaySheet.operators)) {
      // Carry forward: eveningInHand becomes openingStock for today
      const prePopulated = {
        date: targetDate,
        storeId: assignedStore,
        operators: yesterdaySheet.operators.map((op) => ({
          operatorName:    op.operatorName,
          openingStock:    op.eveningInHand || 0, // yesterday's closing becomes today's opening
          addedToday:      0,
          totalFloat:      op.eveningInHand || 0,
          eveningInHand:   op.eveningInHand || 0,
          todaySoldOut:    0,
          commissionRate:  op.commissionRate || 4,
          commissionAmount: 0,
          netRevenue:      0,
        })),
        totalAddedToday:       0,
        totalEveningInHand:    yesterdaySheet.totalEveningInHand || 0,
        totalSoldOutRevenue:   0,
        totalCommissionAmount: 0,
        totalNetRevenue:       0,
        syncedToDrawer:        false,
      };
      return res.json({ success: true, data: prePopulated, source: 'yesterday' });
    }

    // 3. No history at all — return empty shell (frontend fills with defaults)
    return res.json({ success: true, data: null, source: 'empty' });
  } catch (error) {
    next(error);
  }
};

// ── 3. GET /api/reloads/history ──────────────────────────────────────────────
// @desc  Fetch past reload sheet history with optional date filtering.
// @route GET /api/reloads/history
// @access Private
const getReloadSheetHistory = async (req, res, next) => {
  try {
    const { storeId: queryStoreId, startDate, endDate, limit = 30, page = 1 } = req.query;
    const assignedStore = await resolveStore(req, queryStoreId);

    const filter = {};
    if (assignedStore) filter.storeId = assignedStore;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [sheets, total] = await Promise.all([
      ReloadSheet.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReloadSheet.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sheets,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReload,
  getReloads,
  getReloadStocks,
  addReloadStock,
  closeReloadStock,
  addReloadSupplierPayment,
  saveReloadDailySheet,
  // Sprint 3 — ReloadSheet endpoints
  saveReloadSheet,
  getTodayReloadSheet,
  getReloadSheetHistory,
};
