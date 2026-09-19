/**
 * Shared attendance/leave -> salary calculation.
 *
 * Single source of truth for: unapproved-absence deduction, the pooled
 * off-day/leave allowance ("N leaves per period") and its overage deduction,
 * the full-attendance allowance, and late/early/half-day penalties. Used by
 * payrollController (calculateSalary, processSalaryPayment) and the
 * self/admin attendance-summary endpoint so the numbers can never drift
 * between a preview, a processed payslip, and a standalone summary view.
 *
 * Everything here is recomputed from Attendance/Leave rows every call —
 * nothing is trusted from a stored running total. The one exception is a
 * month that already has a locked Payroll record: getAttendanceSummary()
 * returns that record's frozen attendanceBreakdown instead of recomputing,
 * so a later policy edit can't make an already-paid month's displayed
 * numbers drift from what the employee was actually paid.
 */
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const LeavePolicy = require('../models/LeavePolicy');
const AttendancePolicy = require('../models/AttendancePolicy');
const Payroll = require('../models/Payroll');
const { getSriLankaDateBoundaries } = require('./timezone');

const monthRange = (year, month) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 0, 23, 59, 59, 999),
});

// Minutes owed round up to the next full block — 0 minutes owes nothing,
// 1 minute into a block owes the whole block. Late and OT share this so the
// two can't drift into different rounding rules for the same lateness/overage.
const roundUpToBlock = (minutes, blockSize) => {
  if (minutes <= 0 || !blockSize) return 0;
  return Math.ceil(minutes / blockSize) * blockSize;
};

/**
 * One day's late-arrival deduction and overtime addition from a policy and
 * that day's actual check-in/check-out. This is the single formula behind
 * the stored Attendance day record, the Late Deductions and Overtime views,
 * and payroll — never reimplemented per screen.
 *
 * Grace applies only to lateness (arriving up to graceTimeMinutes late is
 * free); there is no symmetric grace on the OT side since the shop pays for
 * any full block worked past shiftEndTime.
 */
const computeDayPayrollAdjustment = (policy, checkIn, checkOut) => {
  if (!policy || !checkIn || !checkOut) {
    return { lateMinutes: 0, lateDeduction: 0, otMinutes: 0, otAddition: 0, netAdjustment: 0 };
  }

  const graceMinutes = policy.graceTimeMinutes || 0;
  const lateBlock = policy.lateBlockMinutes || 30;
  const lateRate = policy.lateArrivalPenalty || 0;
  const otBlock = policy.otBlockMinutes || 30;
  const otRate = policy.otRatePerBlock || 0;

  const [startH, startM] = (policy.shiftStartTime || '09:00').split(':').map(Number);
  const shiftStartMinutes = startH * 60 + startM;
  const [endH, endM] = (policy.shiftEndTime || '17:00').split(':').map(Number);
  const shiftEndMinutes = endH * 60 + endM;

  const ci = getSriLankaDateBoundaries(checkIn);
  const co = getSriLankaDateBoundaries(checkOut);
  const checkInMinutes = ci.hour * 60 + ci.minute;
  const checkOutMinutes = co.hour * 60 + co.minute;

  const rawLateMinutes = Math.max(0, checkInMinutes - shiftStartMinutes - graceMinutes);
  const lateMinutes = roundUpToBlock(rawLateMinutes, lateBlock);
  const lateDeduction = (lateMinutes / lateBlock) * lateRate;

  const rawOtMinutes = Math.max(0, checkOutMinutes - shiftEndMinutes);
  const otMinutes = roundUpToBlock(rawOtMinutes, otBlock);
  const otAddition = (otMinutes / otBlock) * otRate;

  return {
    lateMinutes,
    lateDeduction,
    otMinutes,
    otAddition,
    netAdjustment: parseFloat((otAddition - lateDeduction).toFixed(2)),
  };
};

/**
 * The AttendancePolicy version actually in effect for a given date — a rate
 * edit creates a new version rather than mutating the old one (see
 * policyController.updateAttendancePolicy), so recalculating a past month
 * always uses the rate that applied then, even after rates change later.
 */
const getEffectiveAttendancePolicy = async (employee, forDate) => {
  const assigned = employee?.employeeInfo?.attendancePolicyId
    ? await AttendancePolicy.findById(employee.employeeInfo.attendancePolicyId)
    : await AttendancePolicy.findOne({ isDefault: true });
  if (!assigned) return null;

  const versions = await AttendancePolicy.find({ name: assigned.name }).sort({ effectiveFrom: -1 });
  const effective = versions.find((v) => !v.effectiveFrom || v.effectiveFrom <= forDate);
  return effective || assigned;
};

// Calendar period containing (month, year) for a given policy periodType.
// 'daily' has no meaningful multi-day reset cycle for a monthly payroll run,
// so it falls back to the calendar month like an unset/unknown periodType.
const periodRange = (periodType, year, month) => {
  switch (periodType) {
    case 'quarterly': {
      const qStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
      return {
        start: new Date(year, qStartMonth - 1, 1),
        end: new Date(year, qStartMonth + 2, 0, 23, 59, 59, 999),
        lastMonthOfPeriod: qStartMonth + 2,
      };
    }
    case 'half_yearly': {
      const hStartMonth = Math.floor((month - 1) / 6) * 6 + 1;
      return {
        start: new Date(year, hStartMonth - 1, 1),
        end: new Date(year, hStartMonth + 5, 0, 23, 59, 59, 999),
        lastMonthOfPeriod: hStartMonth + 5,
      };
    }
    case 'annual':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999), lastMonthOfPeriod: 12 };
    case 'monthly':
    case 'daily':
    default: {
      const { start, end } = monthRange(year, month);
      return { start, end, lastMonthOfPeriod: month };
    }
  }
};

/**
 * Live-computed monthly attendance/leave summary for one employee.
 * Never persisted by this function — callers decide what (if anything) to store.
 */
const computeMonthlyAttendanceSummary = async (employeeId, month, year) => {
  const employee = await User.findById(employeeId)
    .populate('employeeInfo.leavePolicyId')
    .populate('employeeInfo.attendancePolicyId');
  if (!employee) throw new Error('Employee not found');

  const leavePolicy =
    employee.employeeInfo?.leavePolicyId || (await LeavePolicy.findOne({ isDefault: true }));
  const attendancePolicy =
    employee.employeeInfo?.attendancePolicyId || (await AttendancePolicy.findOne({ isDefault: true }));

  const { start: monthStart, end: monthEnd } = monthRange(year, month);
  const allowedLeaves = leavePolicy?.allowedLeaves || 0;
  const unusedLeaveBonusPerDay = leavePolicy?.unusedLeaveBonusPerDay || 0;
  const deductionPerExcessLeave = leavePolicy?.deductionPerExcessLeave || 0;
  const absentDayDeduction = attendancePolicy?.absentDayDeduction || 0;
  const periodType = leavePolicy?.periodType || 'monthly';
  const { start: periodStart, end: periodEnd, lastMonthOfPeriod } = periodRange(periodType, year, month);

  const attendances = await Attendance.find({ employeeId, date: { $gte: monthStart, $lte: monthEnd } });
  const presentDays = attendances.filter((a) => ['present', 'late'].includes(a.status)).length;
  const halfDays = attendances.filter((a) => a.status === 'half-day').length;
  const totalWorkingDaysCount = presentDays + halfDays * 0.5;

  const unapprovedAbsenceRows = attendances.filter((a) => a.status === 'absent');
  const unapprovedAbsences = unapprovedAbsenceRows.length;
  const unapprovedAbsenceDeduction = unapprovedAbsences * absentDayDeduction;

  // Late/early/half-day penalties. Late itself is read from each day's
  // stored, block-rounded lateDeduction (computed once at checkOut by
  // computeDayPayrollAdjustment) rather than recomputed here — the two must
  // never drift. Early-checkout and half-day penalties stay live-computed.
  let lateEarlyHalfDayDeduction = 0;
  let lateDeductionTotal = 0;
  const basicSalary = employee.employeeInfo?.salary || 0;
  const dailyRate = basicSalary / 30;
  if (attendancePolicy) {
    const earlyPenalty = attendancePolicy.earlyCheckoutPenalty || 0;
    const halfDayThreshold = attendancePolicy.halfDayThresholdHours || 4;
    const [endH, endM] = (attendancePolicy.shiftEndTime || '17:00').split(':').map(Number);
    const shiftEndMinutes = endH * 60 + endM;

    attendances.forEach((att) => {
      if (att.status === 'absent') return; // covered by absentDayDeduction above
      if (att.status === 'half-day' || (att.hoursWorked > 0 && att.hoursWorked < halfDayThreshold)) {
        lateEarlyHalfDayDeduction += dailyRate / 2;
        return;
      }
      lateDeductionTotal += att.lateDeduction || 0;
      lateEarlyHalfDayDeduction += att.lateDeduction || 0;
      if (att.checkOut) {
        const { hour, minute } = getSriLankaDateBoundaries(att.checkOut);
        if (shiftEndMinutes - (hour * 60 + minute) > 0) lateEarlyHalfDayDeduction += earlyPenalty;
      }
    });
  } else {
    attendances.forEach((att) => {
      if (att.status === 'half-day') lateEarlyHalfDayDeduction += dailyRate / 2;
      lateDeductionTotal += att.lateDeduction || 0;
      lateEarlyHalfDayDeduction += att.lateDeduction || 0;
    });
  }

  // Pooled leave/off-days — incremental (before vs. through this month) so a
  // multi-month period's overage is only ever deducted once, in the month it
  // first crosses the allowance, not re-deducted every month of the period.
  const leavesInPeriod = await Leave.find({
    employeeId,
    status: 'approved',
    leaveType: { $ne: 'unpaid' },
    startDate: { $gte: periodStart, $lte: monthEnd },
  });
  const leaveDaysBefore = leavesInPeriod
    .filter((l) => l.startDate < monthStart)
    .reduce((sum, l) => sum + l.totalDays, 0);
  const leaveDaysThrough = leaveDaysBefore + leavesInPeriod
    .filter((l) => l.startDate >= monthStart && l.startDate <= monthEnd)
    .reduce((sum, l) => sum + l.totalDays, 0);
  const extraOffDaysThisMonth = Math.max(0, leaveDaysThrough - allowedLeaves) - Math.max(0, leaveDaysBefore - allowedLeaves);
  const excessOffDayDeduction = extraOffDaysThisMonth * (deductionPerExcessLeave || absentDayDeduction);
  const leaveIds = leavesInPeriod
    .filter((l) => l.startDate >= monthStart && l.startDate <= monthEnd)
    .map((l) => l._id);

  // Unpaid-type leave never draws from the pool — always deducted, flat per month.
  const unpaidLeaves = await Leave.find({
    employeeId,
    status: 'approved',
    leaveType: 'unpaid',
    startDate: { $gte: monthStart, $lte: monthEnd },
  });
  const unpaidLeaveDays = unpaidLeaves.reduce((sum, l) => sum + l.totalDays, 0);
  const unpaidLeaveDeduction = unpaidLeaveDays * absentDayDeduction;
  unpaidLeaves.forEach((l) => leaveIds.push(l._id));

  // Full-attendance allowance qualifies only on zero pool usage AND zero
  // unapproved absence across the *whole* period so far, but the money only
  // actually releases in the period's final month — otherwise a quarterly
  // bonus would be paid out (and re-checked) every single month.
  const periodUnapprovedAbsences = await Attendance.countDocuments({
    employeeId,
    date: { $gte: periodStart, $lte: monthEnd },
    status: 'absent',
  });
  const qualifiesForAllowance = periodUnapprovedAbsences === 0 && leaveDaysThrough === 0;
  const allowanceReleased = month === lastMonthOfPeriod;
  const pendingAttendanceAllowance = qualifiesForAllowance ? allowedLeaves * unusedLeaveBonusPerDay : 0;
  const attendanceAllowance = allowanceReleased ? pendingAttendanceAllowance : 0;

  const attendanceDeductions =
    unapprovedAbsenceDeduction + excessOffDayDeduction + unpaidLeaveDeduction + lateEarlyHalfDayDeduction;

  return {
    locked: false,
    employeeId,
    month,
    year,
    workingDays: attendances.length,
    presentDays,
    halfDays,
    totalWorkingDaysCount,
    periodType,
    periodStart,
    periodEnd,
    allowedLeaves,
    leaveDaysTaken: leaveDaysThrough, // cumulative within the period, through this month
    extraOffDaysThisMonth,
    unapprovedAbsences,
    unpaidLeaveDays,
    unapprovedAbsenceDeduction,
    excessOffDayDeduction,
    unpaidLeaveDeduction,
    lateEarlyHalfDayDeduction,
    lateDeductionTotal,
    otEarnedTotal: attendances.reduce((sum, a) => sum + (a.otAddition || 0), 0),
    attendanceDeductions,
    qualifiesForAllowance,
    allowanceReleased,
    pendingAttendanceAllowance,
    attendanceAllowance,
    leaveIds,
    attendanceIds: unapprovedAbsenceRows.map((a) => a._id),
  };
};

/**
 * Summary for display/decisioning: returns the locked Payroll snapshot for an
 * already-processed month, or a live computation otherwise.
 */
const getAttendanceSummary = async (employeeId, month, year) => {
  const existing = await Payroll.findOne({ employeeId, month: Number(month), year: Number(year) });
  if (existing) {
    const b = existing.attendanceBreakdown || {};
    return {
      locked: true,
      employeeId,
      month: Number(month),
      year: Number(year),
      periodType: b.periodType,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      allowedLeaves: b.allowedLeaves || 0,
      leaveDaysTaken: b.leaveDaysTaken || 0,
      extraOffDaysThisMonth: b.extraOffDaysThisMonth || 0,
      unapprovedAbsences: b.unapprovedAbsences || 0,
      unpaidLeaveDays: b.unpaidLeaveDays || 0,
      unapprovedAbsenceDeduction: existing.unapprovedAbsenceDeduction || 0,
      excessOffDayDeduction: existing.excessOffDayDeduction || 0,
      attendanceDeductions: existing.attendanceDeductions || 0,
      attendanceAllowance: existing.attendanceAllowance || 0,
      lateDeductionTotal: b.lateDeductionTotal || 0,
      otEarnedTotal: existing.overtimePay || 0,
      allowanceReleased: !!b.allowanceReleased,
      leaveIds: b.leaveIds || [],
      attendanceIds: b.attendanceIds || [],
      payrollId: existing._id,
    };
  }
  return computeMonthlyAttendanceSummary(employeeId, month, year);
};

module.exports = {
  computeMonthlyAttendanceSummary,
  getAttendanceSummary,
  monthRange,
  periodRange,
  computeDayPayrollAdjustment,
  getEffectiveAttendancePolicy,
};
