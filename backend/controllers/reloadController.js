const Reload = require('../models/Reload');
const ReloadStock = require('../models/ReloadStock');
const Transaction = require('../models/Transaction');
const Store = require('../models/Store');

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
      accountId 
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

    // 1. Create Transaction for the income
    const transaction = await Transaction.create({
      storeId: assignedStore || null,
      accountId: accountId || null,
      type: 'income',
      category: 'Reload & Bill Payment',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      description: `${type || 'Prepaid'} Reload: ${operator} - ${mobileNumber}`,
      date: new Date(),
      createdBy: req.user._id,
    });

    // 2. Create Reload record
    const reload = await Reload.create({
      storeId: assignedStore || null,
      mobileNumber,
      operator,
      amount: Number(amount),
      type: type || 'Prepaid',
      paymentMethod: paymentMethod || 'Cash',
      notes,
      transactionId: transaction._id,
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
    }

    const stocks = await ReloadStock.find(filter)
      .populate('recordedBy', 'name')
      .sort({ operator: 1, cardValue: 1 });

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
      stockItem.sellOutAmount = Math.max(0, stockItem.totalStock - stockItem.closingStock);
      stockItem.sellOutValue = stockItem.sellOutAmount * stockItem.cardValue;
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
        closingStock: 0,
        sellOutAmount: totalVal,
        sellOutValue: totalVal * Number(cardValue || 1),
        notes,
        recordedBy: req.user._id,
      });
    }

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc    Close evening shop stock balance & auto-calculate Sell-Out
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
    await stockItem.save();

    res.status(200).json({ success: true, data: stockItem });
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
};
