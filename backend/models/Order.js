const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Store',
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        name: String,
        image: String,
        barcode: String,
        sku: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        unitCostAtSale: { type: Number, default: 0 },
        imei: [{ type: String }],
      },
    ],
    deliveryAddress: {
      street: String,
      line2: String,
      city: String,
      district: String,
      state: String,
      zipCode: String,
      country: String,
    },
    deliverySlot: {
      date: Date,
      timeSlot: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    // Currency used for this order
    currency: {
      type: String,
      enum: ['LKR', 'USD'],
      default: 'LKR',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'cod', 'wallet', 'payhere', 'cash', 'mobile_money', 'koko', 'bank_transfer', 'cheque', 'hire_purchase', 'credit'],
      default: 'cod',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    // Koko 3-installment payment breakdown details
    kokoDetails: {
      transactionId: { type: String },
      kokoRef: { type: String },
      installmentsCount: { type: Number, default: 3 },
      installmentAmount: { type: Number },
      paidInstallments: { type: Number, default: 1 },
      nextPaymentDate: { type: Date },
      installmentsSchedule: [
        {
          installmentNo: { type: Number },
          amount: { type: Number },
          dueDate: { type: Date },
          status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
          paidAt: { type: Date },
        },
      ],
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'assigned_delivery',
        'packed',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'completed',
      ],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['WEB', 'POS'],
      default: 'WEB',
    },
    isPosOrder: {
      type: Boolean,
      default: false,
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    invoiceNumber: {
      type: String,
      sparse: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['courier', 'pickup', 'delivery'],
      default: 'courier',
    },
    customerDetails: {
      fullName: String,
      phone: String,
      email: String,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    notes: {
      type: String,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    posSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PosSession',
    },
    // Delivery Guy assignment
    deliveryGuyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tenderedAmount: {
      type: Number,
    },
    changeGiven: {
      type: Number,
    },
    // Loyalty & Promo
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
    },
    voucherCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    // POS customer info
    customerName: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
    customerNic: {
      type: String,
    },
    customerAddress: {
      type: String,
    },
    couponCode: {
      type: String,
    },
    paymentOtpRequired: {
      type: Boolean,
      default: false,
    },
    paymentOtpVerifiedAt: {
      type: Date,
    },
    sendReceiptEmail: {
      type: Boolean,
      default: true,
    },
    receiptEmail: {
      type: String,
    },
    receiptEmailSentAt: {
      type: Date,
    },
    receiptEmailError: {
      type: String,
    },
    sendSmsReceipt: {
      type: Boolean,
      default: false,
    },
    printReceipt: {
      type: Boolean,
      default: true,
    },
    // Returns (customer)
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'on_hold', 'rejected', 'resolved'],
      default: 'none',
    },
    customerReturnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerReturn',
    },
    returnedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    // Credit sale tracking
    isCredit: {
      type: Boolean,
      default: false,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    creditPaidAt: {
      type: Date,
    },
    creditNote: {
      type: String,
    },
    payments: [
      {
        method: { type: String, required: true },
        amount: { type: Number, required: true },
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
        chequeDetails: {
          number: String,
          bank: String,
          dueDate: Date,
        },
      },
    ],
    exchangeReturnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerReturn',
    },
    exchangeCredit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
