const mongoose = require('mongoose');

const tradeInSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    imeiNumber: {
      type: String,
      trim: true,
      default: '',
    },
    storageCapacity: {
      type: String,
      default: '128GB',
    },
    baseEstimatedPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    grade: {
      type: String,
      enum: ['Grade A (Like New)', 'Grade B (Minor Scratches)', 'Grade C (Dented / Scratched)', 'Grade D (Faulty / Cracked)'],
      default: 'Grade B (Minor Scratches)',
    },
    conditionDetails: {
      screenCondition: { type: String, default: 'good' }, // 'perfect', 'scratched', 'cracked'
      batteryHealth: { type: Number, default: 85 },
      bodyCondition: { type: String, default: 'good' }, // 'flawless', 'minor_dents', 'major_dents'
      cameraWorking: { type: Boolean, default: true },
      biometricsWorking: { type: Boolean, default: true }, // Face ID / Fingerprint
      originalBox: { type: Boolean, default: false },
      originalCharger: { type: Boolean, default: false },
    },
    deductions: [
      {
        reason: String,
        amount: Number,
      },
    ],
    finalValuationPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    customerNic: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['quoted', 'applied_to_pos', 'added_to_refurbished_stock', 'cancelled'],
      default: 'quoted',
    },
    appliedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TradeIn', tradeInSchema);
