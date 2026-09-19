const mongoose = require('mongoose');

// Locked snapshot of the attendance/leave figures used to compute this month's
// payroll — lets the summary be redisplayed later without re-deriving from
// policy values that may have since changed (see computeMonthlyAttendanceSummary).
const attendanceBreakdownSchema = mongoose.Schema(
  {
    periodType: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    allowedLeaves: { type: Number, default: 0 },
    leaveDaysTaken: { type: Number, default: 0 }, // cumulative within the period, for display
    extraOffDaysThisMonth: { type: Number, default: 0 }, // what was actually deducted this run
    unapprovedAbsences: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    lateDeductionTotal: { type: Number, default: 0 },
    allowanceReleased: { type: Boolean, default: false },
    leaveIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leave' }],
    attendanceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }],
  },
  { _id: false }
);

const payrollSchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Store',
    },
    month: {
      type: Number,
      required: true, // 1-12
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    daysWorked: {
      type: Number,
      default: 0,
    },
    totalWorkingDays: {
      type: Number,
      default: 26,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0, // manual bonuses only — see targetBonus for auto-computed target incentives
    },
    targetBonus: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    cashierRecoveryDeduction: {
      type: Number,
      default: 0,
    },
    advanceDeduction: {
      type: Number,
      default: 0,
    },
    attendanceDeductions: {
      type: Number,
      default: 0, // sum of unapprovedAbsenceDeduction + excessOffDayDeduction, kept for paysheet display
    },
    unapprovedAbsenceDeduction: {
      type: Number,
      default: 0,
    },
    excessOffDayDeduction: {
      type: Number,
      default: 0,
    },
    attendanceAllowance: {
      type: Number,
      default: 0,
    },
    attendanceBreakdown: {
      type: attendanceBreakdownSchema,
      default: () => ({}),
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    // Sri Lanka EPF/ETF calculations
    epfEmployee: {
      type: Number,
      default: 0, // 8% of basic
    },
    epfEmployer: {
      type: Number,
      default: 0, // 12% of basic
    },
    etfEmployer: {
      type: Number,
      default: 0, // 3% of basic
    },
    grossSalary: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer',
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    finalizedAt: {
      type: Date,
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Append-only corrections layered on top of an already-finalized payslip —
    // the original netSalary is never edited, only added to. Same idiom as
    // CashierShortage.correctionHistory.
    adjustments: [
      {
        label: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        note: { type: String, trim: true },
        adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        adjustedAt: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// One payroll record per employee per month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
