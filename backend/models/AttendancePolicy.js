const mongoose = require('mongoose');

const attendancePolicySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // Not unique: a rate change creates a new version with the same name
      // (see policyController.updateAttendancePolicy) rather than mutating
      // history, so recalculating a past month uses the rate in effect then.
    },
    shiftStartTime: {
      type: String,
      default: '09:00', // HH:MM
    },
    shiftEndTime: {
      type: String,
      default: '17:00', // HH:MM
    },
    graceTimeMinutes: {
      type: Number,
      default: 15,
    },
    lateArrivalPenalty: {
      type: Number,
      default: 0, // Rs. deducted per lateBlockMinutes block of lateness
    },
    lateBlockMinutes: {
      type: Number,
      default: 30, // Late minutes round up to this block size before billing
    },
    earlyCheckoutPenalty: {
      type: Number,
      default: 0, // Deduction per early check-out
    },
    otRatePerBlock: {
      type: Number,
      default: 100, // Rs. earned per otBlockMinutes block worked past shiftEndTime
    },
    otBlockMinutes: {
      type: Number,
      default: 30, // OT minutes round up to this block size before billing
    },
    halfDayThresholdHours: {
      type: Number,
      default: 4, // Hours below this count as half-day or absent
    },
    absentDayDeduction: {
      type: Number,
      default: 0, // Fixed Rs. deducted for an unapproved absent day (replaces pro-rata)
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Effective-date versioning: effectiveTo is null on the currently active
    // version of a given `name`. See policyController.updateAttendancePolicy.
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

attendancePolicySchema.index({ name: 1, effectiveFrom: -1 });

const AttendancePolicy = mongoose.model('AttendancePolicy', attendancePolicySchema);

module.exports = AttendancePolicy;
