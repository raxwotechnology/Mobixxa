const HirePurchase = require("../models/HirePurchase");
const Order = require("../models/Order");
const Store = require("../models/Store");
const { recordTransaction } = require("../services/ledgerService");

const mongoose = require("mongoose");

// Helper function to resolve the user's store ID based on their role
const resolveUserStoreId = async (req) => {
  const user = req.user;
  // Admin/SuperAdmin can see all stores (no filter)
  if (user.role === "admin" || user.isSuperAdmin) {
    return null;
  }
  // Manager — find the store they manage
  if (user.role === "manager") {
    const store = await Store.findOne({ managerId: user._id })
      .select("_id")
      .lean();
    return store?._id || null;
  }
  // Cashier / stockEmployee — use their assignedStore
  if (user.role === "cashier" || user.role === "stockEmployee") {
    return user.assignedStore || null;
  }
  // Other roles should not have access (handled by route middleware)
  return null;
};

// Helper function to verify if a user can access an HP record based on store
const canAccessHPRecord = async (req, hpRecord) => {
  const user = req.user;
  // Admin/SuperAdmin can access any record
  if (user.role === "admin" || user.isSuperAdmin) {
    return true;
  }
  // Manager can only access records from their managed store
  if (user.role === "manager") {
    const store = await Store.findOne({ managerId: user._id })
      .select("_id")
      .lean();
    return store && String(store._id) === String(hpRecord.storeId);
  }
  // Cashier/stockEmployee can only access records from their assigned store
  if (user.role === "cashier" || user.role === "stockEmployee") {
    return (
      user.assignedStore &&
      String(user.assignedStore) === String(hpRecord.storeId)
    );
  }
  return false;
};

// @desc    Get all HP agreements
// @route   GET /api/hp
// @access  Private/Admin/Manager/Cashier/StockEmployee
const getHPRecords = async (req, res, next) => {
  try {
    const { status, storeId, search, orderId } = req.query;
    const filter = {};

    if (orderId) filter.orderId = orderId;

    // Enforce store-based access control
    const userStoreId = await resolveUserStoreId(req);
    if (userStoreId) {
      // Non-admin users can only see records from their assigned store
      filter.storeId = userStoreId;
    } else if (req.user.role === "admin" || req.user.isSuperAdmin) {
      // Admins can filter by storeId if provided in query, otherwise see all
      if (storeId) {
        filter.storeId = storeId;
      }
    }

    if (status === "outstanding") {
      filter.status = { $in: ["Active", "Overdue"] };
    } else if (status === "completed") {
      filter.status = "Completed";
    } else if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const matchingOrders = await Order.find({
        $or: [
          { invoiceNumber: { $regex: search, $options: "i" } },
          { "items.name": { $regex: search, $options: "i" } },
          { "items.barcode": { $regex: search, $options: "i" } },
          { "items.sku": { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const matchingOrderIds = matchingOrders.map((o) => o._id);

      const searchOr = [
        { hpCode: { $regex: search, $options: "i" } },
        { invoiceNo: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "customer.nic": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];

      if (matchingOrderIds.length > 0) {
        searchOr.push({ orderId: { $in: matchingOrderIds } });
      }

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchOr.push({ _id: search });
      }

      filter.$or = searchOr;
    }

    const records = await HirePurchase.find(filter)
      .populate("orderId")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single HP record
// @route   GET /api/hp/:id
// @access  Private/Admin/Manager/Cashier/StockEmployee
const getHPById = async (req, res, next) => {
  try {
    const record = await HirePurchase.findById(req.params.id)
      .populate({
        path: "orderId",
        populate: { path: "items.productId", select: "name images" },
      })
      .populate("createdBy", "name")
      .populate("payments.receivedBy", "name")
      .populate("payments.accountId", "name");

    if (!record) {
      res.status(404);
      return next(new Error("Record not found"));
    }

    // Verify user can access this HP record based on store
    const canAccess = await canAccessHPRecord(req, record);
    if (!canAccess) {
      res.status(403);
      return next(new Error("Not authorized to access this HP record"));
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
};

// @desc    Record HP payment
// @route   POST /api/hp/:id/payments
// @access  Private/Admin/Manager/Cashier/StockEmployee
const recordHPPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, accountId, referenceNo, notes } = req.body;
    const record = await HirePurchase.findById(req.params.id);

    if (!record) {
      res.status(404);
      return next(new Error("Record not found"));
    }

    // Verify user can access this HP record based on store
    const canAccess = await canAccessHPRecord(req, record);
    if (!canAccess) {
      res.status(403);
      return next(
        new Error("Not authorized to record payment for this HP record"),
      );
    }

    if (record.status === "Completed") {
      res.status(400);
      return next(new Error("Agreement already completed"));
    }

    let targetAccountId = accountId;
    if (!targetAccountId) {
      const Account = require("../models/Account");
      let defaultAcc =
        (await Account.findOne({ storeId: record.storeId, isDefault: true })) ||
        (await Account.findOne({ isDefault: true })) ||
        (await Account.findOne({ storeId: record.storeId })) ||
        (await Account.findOne({}));
      if (!defaultAcc) {
        try {
          defaultAcc = await Account.create({
            storeId: record.storeId,
            name: "Counter Cash Drawer",
            accountType: "cash",
            type: "Cash",
            balance: 0,
            isDefault: true,
            createdBy: req.user._id,
          });
        } catch (accErr) {
          console.error("[HP] Auto create account notice:", accErr.message);
        }
      }
      if (defaultAcc) targetAccountId = defaultAcc._id;
    }

    const normalizedMethod =
      (paymentMethod || "Cash").toLowerCase() === "card"
        ? "Card"
        : (paymentMethod || "").toLowerCase().includes("bank")
          ? "Bank Transfer"
          : "Cash";

    // Defense in depth against a double-submitted payment (double-click, slow-network
    // re-tap) reaching this endpoint twice: reject a second payment on the same
    // agreement that repeats the same amount + method within a short window, even if
    // the frontend's own submit guard were ever bypassed. Legitimate back-to-back
    // payments of the same amount are rare enough, and delayed enough by the cashier
    // re-opening/confirming the form, that this window does not block them.
    const DUP_WINDOW_MS = 8000;
    const now = Date.now();
    const isDuplicate = (record.payments || []).some((p) => {
      if (Number(p.amount) !== Number(amount)) return false;
      if (p.paymentMethod !== normalizedMethod) return false;
      const pDate = p.date ? new Date(p.date).getTime() : 0;
      return now - pDate >= 0 && now - pDate < DUP_WINDOW_MS;
    });
    if (isDuplicate) {
      res.status(409);
      return next(
        new Error(
          "A matching payment was just recorded for this agreement — possible duplicate submission. Please check Payment History before retrying.",
        ),
      );
    }

    const payment = {
      amount: Number(amount),
      paymentMethod: normalizedMethod,
      accountId: targetAccountId || undefined,
      referenceNo,
      receivedBy: req.user._id,
      date: new Date(),
      receiptNo: `HP-REC-${Date.now()}`,
    };

    record.payments.push(payment);
    record.totalPaid += Number(amount);
    record.balanceAmount = Math.max(0, record.netTotal - record.totalPaid);

    // Update installments count (rough estimate or based on amount)
    if (amount >= record.installmentAmount) {
      record.installmentsPaid += 1;
    }

    if (record.totalPaid >= record.netTotal) {
      record.status = "Completed";
    }

    // Sync associated order payment status & credit balance
    if (record.orderId) {
      try {
        const order = await Order.findById(record.orderId);
        if (order) {
          order.amountPaid = Math.min(
            order.totalAmount,
            order.amountPaid + Number(amount),
          );
          order.creditBalance = Math.max(
            0,
            order.totalAmount - order.amountPaid,
          );
          if (order.creditBalance <= 0) {
            order.paymentStatus = "completed";
          }
          await order.save();
        }
      } catch (err) {
        console.error("Failed to sync order payment status:", err);
      }
    }

    // Calculate next due date
    const nextDate = new Date(record.nextDueDate || record.startDate);
    if (record.installmentType === "Monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setDate(nextDate.getDate() + 7);
    }
    record.nextDueDate = nextDate;

    await record.save();

    // Record in ledger
    try {
      await recordTransaction({
        storeId: record.storeId,
        accountId: targetAccountId,
        type: "income",
        category: "Hire Purchase Payment",
        amount: Number(amount),
        paymentMethod: paymentMethod || "Cash",
        referenceNo: payment.receiptNo,
        description: `HP Payment from ${record.customer?.name || "Customer"} (Inv: ${record.invoiceNo || record._id})`,
        createdBy: req.user._id,
      });
    } catch (txErr) {
      console.error("[HP] Ledger income recording notice:", txErr.message);
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer purchase history
// @route   GET /api/hp/customer/:phone/history
// @access  Private/Admin/Manager/Cashier/StockEmployee
const getCustomerHistory = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const { formatSLPhone } = require("../utils/validators");

    // Normalize to standard formats for search
    const cleanPhone = phone.replace(/[\s\-()+]/g, ""); // Remove all special chars
    const basePhone = cleanPhone.replace(/^94/, "").replace(/^0/, ""); // Get last 9 digits

    // Search for 07XXXXXXXX, 7XXXXXXXX, and +947XXXXXXXX
    const phoneRegex = new RegExp(`^(\\+94|0)?${basePhone}$`);

    // Build store filter based on user role
    const storeFilter = {};
    const userStoreId = await resolveUserStoreId(req);
    if (userStoreId) {
      storeFilter.storeId = userStoreId;
    } else if (req.user.role === "admin" || req.user.isSuperAdmin) {
      // Admins can see all stores
    }

    const orders = await Order.find({
      customerPhone: phoneRegex,
      ...storeFilter,
    }).sort({ createdAt: -1 });
    const hpAgreements = await HirePurchase.find({
      "customer.phone": phoneRegex,
      ...storeFilter,
    }).sort({ createdAt: -1 });

    res.json({ orders, hpAgreements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique customers
// @route   GET /api/hp/customers/all
// @access  Private/Admin/Manager/Cashier/StockEmployee
const getAllCustomers = async (req, res, next) => {
  try {
    // Build store filter based on user role
    const storeFilter = {};
    const userStoreId = await resolveUserStoreId(req);
    if (userStoreId) {
      storeFilter.storeId = userStoreId;
    } else if (req.user.role === "admin" || req.user.isSuperAdmin) {
      // Admins can see all stores
    }

    const orderCustomers = await Order.aggregate([
      {
        $match: { customerPhone: { $exists: true, $ne: null }, ...storeFilter },
      },
      {
        $group: {
          _id: "$customerPhone",
          name: { $first: "$customerName" },
          lastSale: { $max: "$createdAt" },
        },
      },
    ]);

    const hpCustomers = await HirePurchase.aggregate([
      {
        $match: {
          "customer.phone": { $exists: true, $ne: null },
          ...storeFilter,
        },
      },
      {
        $group: {
          _id: "$customer.phone",
          name: { $first: "$customer.name" },
          lastSale: { $max: "$createdAt" },
        },
      },
    ]);

    const customerMap = new Map();

    orderCustomers.forEach((c) => {
      customerMap.set(c._id, {
        phone: c._id,
        name: c.name || "Walk-in",
        lastSale: c.lastSale,
      });
    });

    hpCustomers.forEach((c) => {
      const existing = customerMap.get(c._id);
      if (!existing || c.lastSale > existing.lastSale) {
        customerMap.set(c._id, {
          phone: c._id,
          name: c.name || "Walk-in",
          lastSale: c.lastSale,
        });
      }
    });

    const result = Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastSale) - new Date(a.lastSale),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete HP record
// @route   DELETE /api/hp/:id
// @access  Private/Admin/Manager
const deleteHPRecord = async (req, res, next) => {
  try {
    const record = await HirePurchase.findById(req.params.id);
    if (!record) {
      res.status(404);
      return next(new Error("HP record not found"));
    }

    // Verify user can access this HP record based on store
    const canAccess = await canAccessHPRecord(req, record);
    if (!canAccess) {
      res.status(403);
      return next(new Error("Not authorized to delete this HP record"));
    }

    await record.deleteOne();
    res.json({ message: "Hire Purchase record deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Update HP record
// @route   PUT /api/hp/:id
// @access  Private/Admin/Manager
const updateHPRecord = async (req, res, next) => {
  try {
    const record = await HirePurchase.findById(req.params.id);
    if (!record) {
      res.status(404);
      return next(new Error("HP record not found"));
    }

    // Verify user can access this HP record based on store
    const canAccess = await canAccessHPRecord(req, record);
    if (!canAccess) {
      res.status(403);
      return next(new Error("Not authorized to update this HP record"));
    }

    const {
      invoiceNo,
      customer,
      guarantors,
      totalAmount,
      downPayment,
      monthlyInstallment,
      interestRate,
      totalMonths,
      status,
    } = req.body;

    if (invoiceNo !== undefined) record.invoiceNo = invoiceNo;

    if (customer) {
      record.customer = {
        ...record.customer,
        ...customer,
      };
    }

    if (guarantors) {
      record.guarantors = guarantors;
    }

    if (totalAmount !== undefined)
      record.financials.totalAmount = Number(totalAmount);
    if (downPayment !== undefined)
      record.financials.downPayment = Number(downPayment);
    if (monthlyInstallment !== undefined)
      record.financials.monthlyInstallment = Number(monthlyInstallment);
    if (interestRate !== undefined)
      record.financials.interestRate = Number(interestRate);
    if (totalMonths !== undefined)
      record.financials.totalMonths = Number(totalMonths);
    if (status !== undefined) record.status = status;

    const saved = await record.save();
    res.json(saved);
  } catch (error) {
    next(error);
  }
};

const getNextHPCode = async (req, res, next) => {
  try {
    const count = await HirePurchase.countDocuments({});
    const hpCode = `HP-${String(count + 1).padStart(4, "0")}`;
    res.json({ hpCode });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHPRecords,
  getHPById,
  recordHPPayment,
  getCustomerHistory,
  getAllCustomers,
  deleteHPRecord,
  updateHPRecord,
  getNextHPCode,
};
