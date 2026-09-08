const mongoose = require('mongoose');

const creditPaymentSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amountPaid: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Card'], required: true },
    referenceNo: { type: String },
    date: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CreditPayment', creditPaymentSchema);
