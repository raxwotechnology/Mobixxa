const mongoose = require('mongoose');

const overtimePaySchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0.5,
    },
    ratePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      default: 'pending',
    },
    // 'auto' records are created/refreshed by checkOut from that day's
    // Attendance OT figure; 'manual' ones are hand-entered by an admin and
    // are never touched by the automatic recompute. See hrController.checkOut.
    source: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual',
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
    },
    paidAt: {
      type: Date,
    },
    ledgerTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

overtimePaySchema.index({ employeeId: 1, date: -1 });

const OvertimePay = mongoose.model('OvertimePay', overtimePaySchema);

module.exports = OvertimePay;
