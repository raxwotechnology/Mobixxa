const mongoose = require('mongoose');

const leavePolicySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    periodType: {
      type: String,
      enum: ['daily', 'monthly', 'half_yearly', 'annual'],
      default: 'monthly',
    },
    allowedLeaves: {
      type: Number,
      default: 4, // e.g. 4 leaves per month
    },
    unusedLeaveBonusPerDay: {
      type: Number,
      default: 1000, // Bonus paid per unused leave day if employee works on leave days
    },
    annualLeaves: {
      type: Number,
      default: 14,
    },
    sickLeaves: {
      type: Number,
      default: 7,
    },
    casualLeaves: {
      type: Number,
      default: 7,
    },
    deductionPerExcessLeave: {
      type: Number,
      default: 1500, // Deduction per excess leave taken beyond allowed allowance
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const LeavePolicy = mongoose.model('LeavePolicy', leavePolicySchema);

module.exports = LeavePolicy;
