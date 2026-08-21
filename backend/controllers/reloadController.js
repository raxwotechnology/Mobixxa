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
        description: `${isCredit ? '[CREDIT / ණයට] ' : ''}${type || 'Prepaid'} Reload: ${operator} - ${mobileNumber}${customerName ? ` (${customerName})` : ''}`,
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

module.exports = {
  createReload,
  getReloads,
  getReloadStocks,
  addReloadStock,
  closeReloadStock,
  addReloadSupplierPayment,
};
