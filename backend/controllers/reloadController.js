const mongoose = require("mongoose");
const Reload = require("../models/Reload");
const ReloadStock = require("../models/ReloadStock");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Store = require("../models/Store");
const Supplier = require("../models/Supplier");
const SupplierPayment = require("../models/SupplierPayment");
const { recordTransaction, reverseTransaction } = require("../services/ledgerService");

// @desc Record a new reload
// @route POST /api/reloads
// @access Private
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
      customerName,
      date,
      isCredit: reqIsCredit,
      status: reqStatus,
    } = req.body;

    // BUG-12 FIX: Only admins can provide storeId; non-admins use resolveReloadStoreId
    const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;
    let assignedStore = await resolveReloadStoreId(
      req,
      isAdmin ? storeId : null,
    );

    if (!assignedStore) {
      res.status(400);
      return next(
        new Error(
          "No store found for this transaction. Please ensure your account is linked to a store.",
        ),
      );
    }

    const isCredit =
      reqIsCredit === true ||
      reqIsCredit === "true" ||
      String(paymentMethod).toLowerCase() === "credit";
    const targetDate = date
      ? String(date).trim().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const finalPaymentMethod = isCredit ? "Credit" : paymentMethod || "Cash";
    const finalStatus = reqStatus || (isCredit ? "Pending" : "Completed");
    const numericAmount = Math.max(0, Number(amount) || 0);

    // 1. Create Transaction for the record
    let transaction = null;
    try {
      transaction = await Transaction.create({
        storeId: assignedStore || null,
        accountId: isCredit ? null : accountId || null,
        type: "income",
        category: isCredit ? "Credit Reload" : "Reload & Bill Payment",
        amount: numericAmount,
        paymentMethod: finalPaymentMethod,
        description: `${isCredit ? "[CREDIT] " : ""}${type || "Prepaid"} Reload: ${operator || "Telecom"} - ${mobileNumber}${customerName ? ` (${customerName})` : ""}`,
        date: new Date(),
        createdBy: req.user._id,
      });
    } catch (tErr) {
      console.error("[Reload Transaction Warning]:", tErr.message);
    }

    // 2. Create Reload record
    const reload = await Reload.create({
      storeId: assignedStore || null,
      date: targetDate,
      mobileNumber: String(mobileNumber || "").trim(),
      customerName: customerName ? String(customerName).trim() : undefined,
      operator: String(operator || "Other").trim(),
      amount: numericAmount,
      type: type || "Prepaid",
      paymentMethod: finalPaymentMethod,
      isCredit,
      creditSettled: false,
      notes: notes ? String(notes).trim() : "",
      transactionId: transaction?._id || null,
      createdBy: req.user._id,
      status: finalStatus,
    });

    res.status(201).json({
      success: true,
      data: reload,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all reloads
// @route GET /api/reloads
// @access Private
const getReloads = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      date,
      storeId,
      operator,
      isCredit,
      paymentMethod,
    } = req.query;
    const filter = {};

    // BUG-12 FIX: Only admins can use storeId from query; non-admins use their assigned store
    const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;
    let assignedStore = null;

    if (isAdmin && storeId && storeId !== "all") {
      assignedStore = storeId;
    } else if (req.user?.role === "manager") {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    } else if (req.user?.assignedStore) {
      assignedStore = req.user.assignedStore;
    }

    if (assignedStore && assignedStore !== "all") {
      filter.storeId = assignedStore;
    }

    if (operator) filter.operator = operator;
    if (isCredit !== undefined) {
      filter.isCredit = isCredit === "true" || isCredit === true;
    }
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (date) {
      const targetDateStr = String(date).trim().split("T")[0];
      const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);
      filter.$or = [
        { date: targetDateStr },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ];
    } else if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const reloads = await Reload.find(filter)
      .populate("createdBy", "name")
      .populate("settledBy", "name")
      .populate("storeId", "name")
      .sort({ createdAt: -1 });

    res.json(reloads);
  } catch (error) {
    next(error);
  }
};

// @desc Mark a pending credit reload as paid — always settled in full,
//          locked afterward (no un-settle from this endpoint).
// @route PUT /api/reloads/:id/settle
// @access Private (any cashier/manager/admin)
const settleCreditReload = async (req, res, next) => {
  try {
    const reload = await Reload.findById(req.params.id);
    if (!reload) {
      res.status(404);
      return next(new Error("Credit reload entry not found"));
    }
    if (!reload.isCredit) {
      res.status(400);
      return next(new Error("This entry is not a credit reload"));
    }
    if (reload.creditSettled) {
      res.status(400);
      return next(new Error("This credit reload has already been settled"));
    }

    const paymentMethod = req.body.paymentMethod || "Cash";

    reload.creditSettled = true;
    reload.creditSettledAt = new Date();
    reload.settledBy = req.user._id;
    await reload.save();

    const desc = `Credit Reload Settled: ${reload.operator} - ${reload.mobileNumber}${reload.customerName ? ` (${reload.customerName})` : ""}`;

    // 1. Transaction — general ledger / audit trail, same pattern as the
    //    sibling settleCreditOrder feature for POS sale credit.
    try {
      await Transaction.create({
        storeId: reload.storeId,
        type: "income",
        category: "Credit Reload Settle",
        amount: reload.amount,
        paymentMethod,
        description: desc,
        date: new Date(),
        createdBy: req.user._id,
      });
    } catch (txErr) {
      console.error(
        "[Credit Reload Settle] Transaction log notice:",
        txErr.message,
      );
    }

    // 2. Expense(type: Income) — the "Other Cash In (Ledger)" mechanism that
    //    actually flows into cashInOther / Total Day Revenue / Balance & Shift
    //    Summary. Without this, the settlement would be recorded but invisible
    //    to daily cash reporting.
    try {
      const Expense = require("../models/Expense");
      const allowedMethods = ["Cash", "Bank Transfer", "Card", "Cheque"];
      await Expense.create({
        storeId: reload.storeId,
        type: "Income",
        category: "Credit Reload Collection",
        title: `Credit Reload Collected - ${reload.mobileNumber}`,
        amount: reload.amount,
        paymentMethod: allowedMethods.includes(paymentMethod)
          ? paymentMethod
          : "Cash",
        status: "Paid",
        date: new Date(),
        notes: desc,
        createdBy: req.user._id,
      });
    } catch (expErr) {
      console.error(
        "[Credit Reload Settle] Expense(Income) log notice:",
        expErr.message,
      );
    }

    const populated = await Reload.findById(reload._id)
      .populate("createdBy", "name")
      .populate("settledBy", "name");

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Helper: resolve the store to act on. BUG-12 FIX: For non-admin users,
// ignores client-provided explicitStoreId and always derives from req.user.
// Only admins can override store selection via explicitStoreId.
const resolveReloadStoreId = async (req, explicitStoreId) => {
  const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;

  // BUG-12: Only allow explicit storeId for admins
  let assignedStore = isAdmin ? explicitStoreId : null;

  if (!assignedStore) {
    if (req.user?.role === "manager") {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    } else if (req.user?.assignedStore) {
      assignedStore = req.user.assignedStore;
    } else if (req.user?.role === "admin") {
      const store = await Store.findOne({ isActive: true });
      if (store) assignedStore = store._id;
    }
  }
  if (!assignedStore) {
    const anyStore = await Store.findOne({ isActive: true });
    if (anyStore) assignedStore = anyStore._id;
  }
  return assignedStore;
};

// Helper: opening stock for a new day always carries forward from that exact
// operator/cardValue's most recent ACTUALLY CLOSED day (however far back the
// gap) — or 0 if it has never been closed before. Deliberately ignores any
// still-open/untouched placeholder days in between: those have no finalized
// In-Hand count yet, so they must never be treated as a source of truth for
// a later day's Opening.
const getCarriedOpeningStock = async (
  storeId,
  operator,
  cardValue,
  targetDate,
) => {
  const prevClosed = await ReloadStock.findOne({
    storeId,
    operator,
    cardValue,
    date: { $lt: targetDate },
    status: "closed",
  }).sort({ date: -1 });
  if (!prevClosed) return 0;
  return Number(prevClosed.closingStock) || 0;
};

// A record counts as "pristine" — a system-generated carry-forward preview
// that no one has actually acted on yet — only while it has never been
// added to, closed, or corrected. Only pristine records are safe to
// silently refresh; anything a cashier has actually touched must never be
// rewritten here.
const isPristineStockRecord = (stockItem) =>
  stockItem.status === "open" &&
  (stockItem.addedStock || 0) === 0 &&
  (!stockItem.addLog || stockItem.addLog.length === 0) &&
  (!stockItem.adjustLog || stockItem.adjustLog.length === 0);

// Helper: find today's stock record for this item, creating it (with the
// carried-forward opening) if it doesn't exist yet. If a record already
// exists but is still just a pristine, untouched preview, its Opening is
// refreshed against the current carry-forward source before being returned
// — otherwise it would stay permanently frozen at whatever value was true
// the moment it was first auto-created (e.g. from viewing a future date
// before an earlier day actually got closed), even after that earlier day's
// real closing later changes.
const findOrCreateReloadStockItem = async (
  req,
  { storeId, operator, cardValue, date },
) => {
  const stockItem = await ReloadStock.findOne({
    storeId,
    date,
    operator,
    cardValue,
  });
  const carriedOpening = await getCarriedOpeningStock(
    storeId,
    operator,
    cardValue,
    date,
  );

  if (stockItem) {
    if (
      isPristineStockRecord(stockItem) &&
      stockItem.openingStock !== carriedOpening
    ) {
      stockItem.openingStock = carriedOpening;
      stockItem.totalStock = carriedOpening;
      stockItem.closingStock = carriedOpening;
      await stockItem.save();
    }
    return stockItem;
  }

  return ReloadStock.create({
    storeId,
    date,
    operator,
    cardValue,
    openingStock: carriedOpening,
    addedStock: 0,
    totalStock: carriedOpening,
    closingStock: carriedOpening,
    sellOutAmount: 0,
    sellOutValue: 0,
    status: "open",
    recordedBy: req.user._id,
  });
};

// @desc Get daily reload stocks
// @route GET /api/reloads/stocks
// @access Private
const getReloadStocks = async (req, res, next) => {
  try {
    const { date, storeId } = req.query;
    const targetDate = date
      ? String(date).trim().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const filter = { date: targetDate };

    // BUG-12 FIX: Only admins can use storeId from query; non-admins use their assigned store
    const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;
    let assignedStore = null;

    if (isAdmin && storeId && storeId !== "all") {
      assignedStore = storeId;
    } else if (req.user?.role === "manager") {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    } else if (req.user?.assignedStore) {
      assignedStore = req.user.assignedStore;
    }

    if (assignedStore && assignedStore !== "all") {
      filter.storeId = assignedStore;
    }

    // Ensure every operator/denomination this store has EVER tracked has its
    // own record for targetDate, Opening auto-carried from that exact
    // item's own most recent CLOSED day (however far back the gap). Runs
    // for every known item on every view — not just ones missing a row for
    // today — because an item that already has a record here might still be
    // a pristine, untouched preview that was auto-created before a later
    // real closing changed its true carry value; findOrCreateReloadStockItem
    // self-heals that case (and only that case) in place, using the same
    // logic the add/close endpoints use, so this listing endpoint can never
    // disagree with them on Opening.
    if (filter.storeId) {
      const storeObjectId = mongoose.Types.ObjectId.isValid(filter.storeId)
        ? new mongoose.Types.ObjectId(filter.storeId)
        : filter.storeId;
      const knownPairs = await ReloadStock.aggregate([
        { $match: { storeId: storeObjectId, date: { $lt: targetDate } } },
        { $group: { _id: { operator: "$operator", cardValue: "$cardValue" } } },
      ]);

      for (const { _id: pair } of knownPairs) {
        await findOrCreateReloadStockItem(req, {
          storeId: filter.storeId,
          operator: pair.operator,
          cardValue: pair.cardValue,
          date: targetDate,
        });
      }
    }

    const stocks = await ReloadStock.find(filter)
      .populate("recordedBy", "name")
      .sort({ operator: 1, cardValue: 1 });

    res.json(stocks);
  } catch (error) {
    next(error);
  }
};

// @desc Add stock (append-only log entry) to a reload/card item for a date
// @route POST /api/reloads/stocks/add
// @access Private
const addReloadStock = async (req, res, next) => {
  try {
    // `qty` is the new, preferred field name for the amount being added.
    // `addedStock` is accepted too for the older AdminReloads.jsx caller.
    // `openingStock` is accepted only for that same legacy caller — Opening
    // is otherwise always system-derived (carried forward) and never
    // settable from the newer Reload & Card Management screen, which never
    // sends it.
    const {
      storeId,
      operator,
      cardValue,
      openingStock,
      addedStock,
      qty,
      notes,
      date,
    } = req.body;
    const targetDate = date
      ? String(date).trim().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const addQty = Math.max(0, Number(qty ?? addedStock) || 0);

    if (!addQty) {
      res.status(400);
      return next(new Error("Please enter a valid quantity to add"));
    }

    const assignedStore = await resolveReloadStoreId(req, storeId);
    const cleanOperator = String(operator || "Other").trim();
    const cleanCardVal = Number(cardValue) || 1;

    const stockItem = await findOrCreateReloadStockItem(req, {
      storeId: assignedStore,
      operator: cleanOperator,
      cardValue: cleanCardVal,
      date: targetDate,
    });

    if (stockItem.status === "closed") {
      res.status(400);
      return next(
        new Error(
          `${cleanOperator} is already closed for ${targetDate}. Use the adjust action if a correction is needed.`,
        ),
      );
    }

    if (openingStock !== undefined && openingStock !== "") {
      stockItem.openingStock = Math.max(0, Number(openingStock) || 0);
    }

    stockItem.addLog.push({
      qty: addQty,
      addedBy: req.user._id,
      addedAt: new Date(),
      notes: notes || "",
    });
    stockItem.addedStock = stockItem.addLog.reduce(
      (sum, l) => sum + (l.qty || 0),
      0,
    );
    stockItem.totalStock = stockItem.openingStock + stockItem.addedStock;
    stockItem.closingStock = stockItem.totalStock; // live preview until actually closed
    if (notes !== undefined) stockItem.notes = notes;
    stockItem.recordedBy = req.user._id;
    await stockItem.save();

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc Close evening shop stock balance & auto-calculate Sell-Out & Income Ledger
// @route POST /api/reloads/stocks/close
// @access Private
const closeReloadStock = async (req, res, next) => {
  try {
    const { stockId, storeId, operator, cardValue, date, closingStock, notes } =
      req.body;

    let stockItem = null;
    if (stockId) {
      stockItem = await ReloadStock.findById(stockId);
      if (!stockItem) {
        res.status(404);
        return next(new Error("Reload stock record not found"));
      }
    } else {
      // No stockId yet (item never had a stock action today) — find or
      // create it (with carried-forward opening) so closing still works.
      const targetDate = date
        ? String(date).trim().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const assignedStore = await resolveReloadStoreId(req, storeId);
      stockItem = await findOrCreateReloadStockItem(req, {
        storeId: assignedStore,
        operator: String(operator || "Other").trim(),
        cardValue: Number(cardValue) || 1,
        date: targetDate,
      });
    }

    if (stockItem.status === "closed") {
      res.status(400);
      return next(
        new Error(
          `${stockItem.operator} is already closed for ${stockItem.date}. Use the adjust action if a correction is needed.`,
        ),
      );
    }

    const safeClosing = Math.max(0, Number(closingStock) || 0);
    stockItem.closingStock = safeClosing;
    stockItem.sellOutAmount = Math.max(
      0,
      stockItem.totalStock - stockItem.closingStock,
    );
    stockItem.sellOutValue =
      stockItem.sellOutAmount * (Number(stockItem.cardValue) || 1);
    stockItem.status = "closed";
    stockItem.closedAt = new Date();
    stockItem.closedBy = req.user._id;
    if (notes !== undefined) stockItem.notes = notes;
    stockItem.recordedBy = req.user._id;

    // Auto Create / Update Financial Transaction for Income Ledger — routed
    // through ledgerService so the sale actually credits an Account, not just
    // a standalone Transaction row.
    if (stockItem.sellOutValue > 0) {
      const itemTitle =
        stockItem.cardValue === 1
          ? "E-Reload Float"
          : `Rs. ${stockItem.cardValue} Cards`;
      const desc = `Daily Reload Sales (${stockItem.operator} - ${itemTitle}): ${stockItem.sellOutAmount} sold`;

      if (stockItem.transactionId) {
        // Closing value changed (re-close/correction) — reverse the prior
        // posting before recording the corrected one, so the account balance
        // never drifts from what's actually on the books.
        await reverseTransaction(stockItem.transactionId, {
          reason: "Reload stock closing value corrected",
          createdBy: req.user._id,
        });
      }

      const defaultAccount =
        (await Account.findOne({ isDefault: true }).lean()) ||
        (await Account.findOne().lean());

      const trans = await recordTransaction({
        storeId: stockItem.storeId,
        accountId: defaultAccount?._id || undefined,
        type: "income",
        category: "Reload & Bill Payment",
        amount: stockItem.sellOutValue,
        paymentMethod: "Cash",
        description: desc,
        date: new Date(),
        createdBy: req.user._id,
      });
      stockItem.transactionId = trans._id;
    }

    await stockItem.save();

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc Correct a locked (closed) reload stock record — the only way to
//          change openingStock/addedStock/closingStock once closed. Always
//          logged to adjustLog with a mandatory reason.
// @route POST /api/reloads/stocks/adjust
// @access Private/Admin/Manager (route-level authorize)
const adjustReloadStock = async (req, res, next) => {
  try {
    const { stockId, field, newValue, reason } = req.body;

    if (!reason || !String(reason).trim()) {
      res.status(400);
      return next(
        new Error("A reason is required to adjust a locked stock record"),
      );
    }
    if (!["openingStock", "addedStock", "closingStock"].includes(field)) {
      res.status(400);
      return next(new Error("Invalid field to adjust"));
    }

    const stockItem = await ReloadStock.findById(stockId);
    if (!stockItem) {
      res.status(404);
      return next(new Error("Reload stock record not found"));
    }

    const oldValue = Number(stockItem[field] || 0);
    const updatedValue = Math.max(0, Number(newValue) || 0);

    stockItem[field] = updatedValue;
    stockItem.totalStock = stockItem.openingStock + stockItem.addedStock;
    stockItem.sellOutAmount = Math.max(
      0,
      stockItem.totalStock - stockItem.closingStock,
    );
    stockItem.sellOutValue =
      stockItem.sellOutAmount * (Number(stockItem.cardValue) || 1);

    stockItem.adjustLog.push({
      field,
      oldValue,
      newValue: updatedValue,
      reason: String(reason).trim(),
      adjustedBy: req.user._id,
      adjustedAt: new Date(),
    });
    stockItem.recordedBy = req.user._id;

    // Keep the income ledger entry in sync with the corrected sell-out value.
    if (stockItem.transactionId) {
      await Transaction.findByIdAndUpdate(stockItem.transactionId, {
        amount: stockItem.sellOutValue,
        description: `[ADJUSTED] Daily Reload Sales (${stockItem.operator}): ${reason}`,
      });
    } else if (stockItem.sellOutValue > 0) {
      const trans = await Transaction.create({
        storeId: stockItem.storeId,
        type: "income",
        category: "Reload & Bill Payment",
        amount: stockItem.sellOutValue,
        paymentMethod: "Cash",
        description: `[ADJUSTED] Daily Reload Sales (${stockItem.operator}): ${reason}`,
        date: new Date(),
        createdBy: req.user._id,
      });
      stockItem.transactionId = trans._id;
    }

    await stockItem.save();

    res.status(200).json({ success: true, data: stockItem });
  } catch (error) {
    next(error);
  }
};

// @desc Add Supplier / Service Float Payment Expense
// @route POST /api/reloads/supplier-payment
// @access Private
const addReloadSupplierPayment = async (req, res, next) => {
  try {
    const { storeId, supplierName, operator, amount, paymentMethod, notes } =
      req.body;

    // BUG-12 FIX: Only admins can provide storeId; non-admins use resolveReloadStoreId
    const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;
    let assignedStore = await resolveReloadStoreId(
      req,
      isAdmin ? storeId : null,
    );

    // 1. Find or create the Supplier record for the Distributor
    const cleanSupplierName = (
      supplierName || `${operator || "Telecom"} Distributor`
    ).trim();
    let supplier = await Supplier.findOne({
      name: { $regex: new RegExp(`^${cleanSupplierName}$`, "i") },
    });

    if (!supplier) {
      supplier = await Supplier.create({
        name: cleanSupplierName,
        companyName: `${operator || "Telecom"} Reload Distribution`,
        contactPerson: `${operator || "Telecom"} Distribution Agent`,
        phone: "+94770000000",
        email: `reload_${Date.now()}@supplier.local`,
        category: "Mobile Reloads & SIM Cards",
        storeId: assignedStore || null,
        status: "active",
      });
    }

    // 2. Map paymentMethod for SupplierPayment enum
    let mappedMethod = "cash";
    const pmLower = (paymentMethod || "").toLowerCase();
    if (pmLower.includes("bank") || pmLower.includes("transfer"))
      mappedMethod = "bank_transfer";
    else if (pmLower.includes("cheque")) mappedMethod = "cheque";
    else if (pmLower.includes("cash")) mappedMethod = "cash";
    else mappedMethod = "other";

    const numericAmount = Math.max(0, Number(amount) || 0);

    // 3. Create SupplierPayment record
    let supplierPaymentRecord = null;
    if (supplier && assignedStore) {
      supplierPaymentRecord = await SupplierPayment.create({
        supplierId: supplier._id,
        storeId: assignedStore,
        type: "payment",
        amount: numericAmount,
        paymentMethod: mappedMethod,
        description: `Reload Float / Card Payment (${operator || "Network"}) - ${notes || cleanSupplierName}`,
        date: new Date(),
        createdBy: req.user._id,
      });
    }

    // 4. Create Ledger Expense Transaction
    const transaction = await Transaction.create({
      storeId: assignedStore || null,
      type: "expense",
      category: "Reload Supplier Cost",
      amount: numericAmount,
      paymentMethod: paymentMethod || "Cash",
      description: `Reload Supplier Purchase (${operator || "Float"}) - ${cleanSupplierName}`,
      notes,
      date: new Date(),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: transaction,
      supplierPayment: supplierPaymentRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Bulk save whole Daily In-Hand Reload & Card Sheet with auto-calculated Sell-Out
// @route POST /api/reloads/stocks/save-sheet
// @access Private
const saveReloadDailySheet = async (req, res, next) => {
  try {
    const { storeId, date, items } = req.body;
    const targetDate = date
      ? String(date).trim().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // BUG-12 FIX: Only admins can provide storeId; non-admins use resolveReloadStoreId
    const isAdmin = req.user?.role === "admin" || req.user?.isSuperAdmin;
    let assignedStore = await resolveReloadStoreId(
      req,
      isAdmin ? storeId : null,
    );

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      return next(new Error("No sheet items provided"));
    }

    const updatedRecords = [];
    let totalDailySellOutRevenue = 0;

    for (const item of items) {
      const rawOperator = String(item.operator || item.label || "Other").trim();
      const operator = rawOperator || "Other";
      const cardValue = Number(item.cardValue) || 1;
      const openingStock = Math.max(0, Number(item.openingStock) || 0);
      const addedStock = Math.max(0, Number(item.addedStock) || 0);
      const totalStock = openingStock + addedStock;
      const closingStock =
        item.closingStock !== undefined &&
        item.closingStock !== null &&
        item.closingStock !== ""
          ? Math.max(0, Number(item.closingStock) || 0)
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
        if (item.notes !== undefined) record.notes = item.notes;
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
          notes: item.notes || "",
          recordedBy: req.user._id,
        });
      }
      updatedRecords.push(record);
    }

    res.status(200).json({
      success: true,
      data: updatedRecords,
      totalSellOutRevenue: totalDailySellOutRevenue,
      message: "Daily reload balance sheet saved & synced successfully!",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReload,
  getReloads,
  settleCreditReload,
  getReloadStocks,
  getTodayReloadSheet: getReloadStocks,
  addReloadStock,
  closeReloadStock,
  adjustReloadStock,
  addReloadSupplierPayment,
  saveReloadDailySheet,
  saveReloadSheet: saveReloadDailySheet,
};
