const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    breakStart: {
      type: Date,
    },
    breakEnd: {
      type: Date,
    },
    breakMinutes: {
      type: Number,
      default: 0,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    // Policy-driven late/OT figures, computed once (checkOut, or a correction)
    // and stored — not recomputed ad hoc by each view. See
    // utils/attendanceSalaryCalc.computeDayPayrollAdjustment for the formula.
    lateMinutes: {
      type: Number,
      default: 0,
    },
    lateDeduction: {
      type: Number,
      default: 0,
    },
    otMinutes: {
      type: Number,
      default: 0,
    },
    otAddition: {
      type: Number,
      default: 0,
    },
    netAdjustment: {
      type: Number,
      default: 0, // otAddition - lateDeduction
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave', 'late'],
      default: 'present',
    },
    notes: {
      type: String,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Append-only log of check-in/check-out corrections (same idiom as
    // Payroll.adjustments / CashierShortage.correctionHistory) — a fixed
    // time never silently overwrites the previous one without a trail.
    corrections: [
      {
        field: { type: String, enum: ['checkIn', 'checkOut'], required: true },
        oldValue: { type: Date },
        newValue: { type: Date },
        correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        correctedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index: one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
