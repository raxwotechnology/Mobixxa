const LeavePolicy = require('../models/LeavePolicy');
const AttendancePolicy = require('../models/AttendancePolicy');
const User = require('../models/User');

// @desc    Get all leave policies
// @route   GET /api/hr/policies/leave
// @access  Private/Admin/Manager
const getLeavePolicies = async (req, res, next) => {
  try {
    const policies = await LeavePolicy.find({}).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) { next(error); }
};

// @desc    Create a leave policy
// @route   POST /api/hr/policies/leave
// @access  Private/Admin/Manager
const createLeavePolicy = async (req, res, next) => {
  try {
    const { name, periodType, allowedLeaves, unusedLeaveBonusPerDay, deductionPerExcessLeave, isDefault } = req.body;
    if (!name) {
      res.status(400);
      return next(new Error('Policy name is required'));
    }

    if (isDefault) {
      await LeavePolicy.updateMany({}, { isDefault: false });
    }

    const policy = await LeavePolicy.create({
      name,
      periodType: periodType || 'monthly',
      allowedLeaves: Number(allowedLeaves) || 4,
      unusedLeaveBonusPerDay: Number(unusedLeaveBonusPerDay) || 0,
      deductionPerExcessLeave: Number(deductionPerExcessLeave) || 0,
      isDefault: !!isDefault,
    });

    res.status(201).json(policy);
  } catch (error) { next(error); }
};

// @desc    Update a leave policy
// @route   PUT /api/hr/policies/leave/:id
// @access  Private/Admin/Manager
const updateLeavePolicy = async (req, res, next) => {
  try {
    const policy = await LeavePolicy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      return next(new Error('Leave Policy not found'));
    }

    if (req.body.isDefault) {
      await LeavePolicy.updateMany({}, { isDefault: false });
    }

    policy.name = req.body.name || policy.name;
    if (req.body.periodType) policy.periodType = req.body.periodType;
    if (req.body.allowedLeaves !== undefined) policy.allowedLeaves = Number(req.body.allowedLeaves);
    if (req.body.unusedLeaveBonusPerDay !== undefined) policy.unusedLeaveBonusPerDay = Number(req.body.unusedLeaveBonusPerDay);
    if (req.body.deductionPerExcessLeave !== undefined) policy.deductionPerExcessLeave = Number(req.body.deductionPerExcessLeave);
    if (req.body.isDefault !== undefined) policy.isDefault = !!req.body.isDefault;

    await policy.save();
    res.json(policy);
  } catch (error) { next(error); }
};

// @desc    Delete a leave policy
// @route   DELETE /api/hr/policies/leave/:id
// @access  Private/Admin/Manager
const deleteLeavePolicy = async (req, res, next) => {
  try {
    const policy = await LeavePolicy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      return next(new Error('Leave Policy not found'));
    }
    await policy.deleteOne();
    res.json({ message: 'Leave policy removed' });
  } catch (error) { next(error); }
};

// @desc    Get all attendance policies
// @route   GET /api/hr/policies/attendance
// @access  Private/Admin/Manager
const getAttendancePolicies = async (req, res, next) => {
  try {
    const policies = await AttendancePolicy.find({}).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) { next(error); }
};

// @desc    Create an attendance policy
// @route   POST /api/hr/policies/attendance
// @access  Private/Admin/Manager
const createAttendancePolicy = async (req, res, next) => {
  try {
    const { name, shiftStartTime, shiftEndTime, graceTimeMinutes, lateArrivalPenalty, lateBlockMinutes, earlyCheckoutPenalty, otRatePerBlock, otBlockMinutes, halfDayThresholdHours, absentDayDeduction, isDefault } = req.body;
    if (!name) {
      res.status(400);
      return next(new Error('Policy name is required'));
    }

    if (isDefault) {
      await AttendancePolicy.updateMany({}, { isDefault: false });
    }

    const policy = await AttendancePolicy.create({
      name,
      shiftStartTime: shiftStartTime || '09:00',
      shiftEndTime: shiftEndTime || '17:00',
      graceTimeMinutes: Number(graceTimeMinutes) || 15,
      lateArrivalPenalty: Number(lateArrivalPenalty) || 0,
      lateBlockMinutes: Number(lateBlockMinutes) || 30,
      earlyCheckoutPenalty: Number(earlyCheckoutPenalty) || 0,
      otRatePerBlock: Number(otRatePerBlock) || 0,
      otBlockMinutes: Number(otBlockMinutes) || 30,
      halfDayThresholdHours: Number(halfDayThresholdHours) || 4,
      absentDayDeduction: Number(absentDayDeduction) || 0,
      isDefault: !!isDefault,
      effectiveFrom: new Date(),
    });

    res.status(201).json(policy);
  } catch (error) { next(error); }
};

// Fields that change what a day's pay actually comes out to — editing any of
// these must version the policy rather than mutate it in place.
const RATE_AFFECTING_FIELDS = [
  'shiftStartTime', 'shiftEndTime', 'graceTimeMinutes',
  'lateArrivalPenalty', 'lateBlockMinutes', 'earlyCheckoutPenalty',
  'otRatePerBlock', 'otBlockMinutes', 'halfDayThresholdHours', 'absentDayDeduction',
];

// @desc    Update an attendance policy
// @route   PUT /api/hr/policies/attendance/:id
// @access  Private/Admin/Manager
//
// A rate/shift-hours edit doesn't mutate the existing document — it closes
// it (effectiveTo = now) and creates a new version with the same name,
// effective from now, then repoints any employee assigned to the old
// version onto the new one. getEffectiveAttendancePolicy resolves the
// version in effect for a given date, so recalculating a past month keeps
// using the rate that actually applied then. A pure name/isDefault change
// carries no history risk and is edited in place.
const updateAttendancePolicy = async (req, res, next) => {
  try {
    const policy = await AttendancePolicy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      return next(new Error('Attendance Policy not found'));
    }

    if (req.body.isDefault) {
      await AttendancePolicy.updateMany({}, { isDefault: false });
    }

    const changesRates = RATE_AFFECTING_FIELDS.some(
      (f) => req.body[f] !== undefined && String(req.body[f]) !== String(policy[f])
    );

    if (!changesRates) {
      policy.name = req.body.name || policy.name;
      if (req.body.isDefault !== undefined) policy.isDefault = !!req.body.isDefault;
      await policy.save();
      return res.json(policy);
    }

    const now = new Date();
    policy.effectiveTo = now;
    await policy.save();

    const pick = (field, fallback) =>
      req.body[field] !== undefined ? req.body[field] : fallback;

    const newVersion = await AttendancePolicy.create({
      name: req.body.name || policy.name,
      shiftStartTime: pick('shiftStartTime', policy.shiftStartTime),
      shiftEndTime: pick('shiftEndTime', policy.shiftEndTime),
      graceTimeMinutes: Number(pick('graceTimeMinutes', policy.graceTimeMinutes)),
      lateArrivalPenalty: Number(pick('lateArrivalPenalty', policy.lateArrivalPenalty)),
      lateBlockMinutes: Number(pick('lateBlockMinutes', policy.lateBlockMinutes)),
      earlyCheckoutPenalty: Number(pick('earlyCheckoutPenalty', policy.earlyCheckoutPenalty)),
      otRatePerBlock: Number(pick('otRatePerBlock', policy.otRatePerBlock)),
      otBlockMinutes: Number(pick('otBlockMinutes', policy.otBlockMinutes)),
      halfDayThresholdHours: Number(pick('halfDayThresholdHours', policy.halfDayThresholdHours)),
      absentDayDeduction: Number(pick('absentDayDeduction', policy.absentDayDeduction)),
      isDefault: req.body.isDefault !== undefined ? !!req.body.isDefault : policy.isDefault,
      effectiveFrom: now,
    });

    await User.updateMany(
      { 'employeeInfo.attendancePolicyId': policy._id },
      { $set: { 'employeeInfo.attendancePolicyId': newVersion._id } }
    );

    res.json(newVersion);
  } catch (error) { next(error); }
};

// @desc    Delete an attendance policy
// @route   DELETE /api/hr/policies/attendance/:id
// @access  Private/Admin/Manager
const deleteAttendancePolicy = async (req, res, next) => {
  try {
    const policy = await AttendancePolicy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      return next(new Error('Attendance Policy not found'));
    }
    await policy.deleteOne();
    res.json({ message: 'Attendance policy removed' });
  } catch (error) { next(error); }
};

// @desc    Assign policies to one or more employees
// @route   POST /api/hr/policies/assign
// @access  Private/Admin/Manager
const assignPoliciesToEmployee = async (req, res, next) => {
  try {
    const { employeeId, employeeIds, leavePolicyId, attendancePolicyId } = req.body;
    const ids = Array.isArray(employeeIds) && employeeIds.length > 0
      ? employeeIds
      : (employeeId ? [employeeId] : []);

    if (ids.length === 0) {
      res.status(400);
      return next(new Error('At least one employee is required'));
    }

    // A blank policy id means "reset to system default" — unset the path
    // rather than $set-ing it to undefined (Mongoose strips undefined from
    // update payloads, which would otherwise silently no-op the reset).
    const setOps = {};
    const unsetOps = {};
    if (leavePolicyId !== undefined) {
      if (leavePolicyId) setOps['employeeInfo.leavePolicyId'] = leavePolicyId;
      else unsetOps['employeeInfo.leavePolicyId'] = '';
    }
    if (attendancePolicyId !== undefined) {
      if (attendancePolicyId) setOps['employeeInfo.attendancePolicyId'] = attendancePolicyId;
      else unsetOps['employeeInfo.attendancePolicyId'] = '';
    }

    const updateOps = {};
    if (Object.keys(setOps).length) updateOps.$set = setOps;
    if (Object.keys(unsetOps).length) updateOps.$unset = unsetOps;
    if (Object.keys(updateOps).length === 0) {
      res.status(400);
      return next(new Error('Nothing to update'));
    }

    const result = await User.updateMany({ _id: { $in: ids } }, updateOps);
    res.json({
      success: true,
      message: 'Policies updated successfully',
      matchedCount: result.matchedCount ?? result.n ?? ids.length,
    });
  } catch (error) { next(error); }
};

// @desc    Assign policies to all employees
// @route   POST /api/hr/policies/assign-all
// @access  Private/Admin/Manager
const assignPoliciesToAllEmployees = async (req, res, next) => {
  try {
    const { leavePolicyId, attendancePolicyId } = req.body;

    const updateObj = {};
    if (leavePolicyId !== undefined) {
      updateObj['employeeInfo.leavePolicyId'] = leavePolicyId || null;
    }
    if (attendancePolicyId !== undefined) {
      updateObj['employeeInfo.attendancePolicyId'] = attendancePolicyId || null;
    }

    await User.updateMany(
      { role: { $ne: 'customer' } },
      { $set: updateObj }
    );

    res.json({ success: true, message: 'Policies assigned to all employees successfully' });
  } catch (error) { next(error); }
};

module.exports = {
  getLeavePolicies,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  getAttendancePolicies,
  createAttendancePolicy,
  updateAttendancePolicy,
  deleteAttendancePolicy,
  assignPoliciesToEmployee,
  assignPoliciesToAllEmployees,
};
