const mongoose = require('mongoose');

const accountSchema = mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true }, // e.g., 'Commercial Bank - Main', 'Cash Drawer'
    type: { 
      type: String, 
      enum: ['Cash', 'Bank', 'Mobile Wallet', 'Other'], 
      required: true 
    },
    accountNumber: { type: String },
    bankName: { type: String },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);
