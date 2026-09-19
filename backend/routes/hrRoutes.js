const express = require('express');
const router = express.Router();
const {
  checkIn, checkOut, getMyAttendance, getAttendanceReport, getLateDeductions,
  requestLeave, getMyLeaves, getStoreLeaves, approveLeave, rejectLeave, cancelDecision,
  getEmployees, addEmployee, updateEmployee, deleteEmployee,
  startBreak, endBreak, getBreakHistory, getActiveBreak,
  createTarget, getTargets, getMyTargets, updateTargetProgress, payTargetBonus,
  getEmployeePerformance,
  adminMarkAttendance, adminCreateLeave, deleteTarget, getAttendanceSummary
} = require('../controllers/hrController');
const { protect, authorize, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

// Attendance
router.post('/attendance/check-in', authorize('admin', 'cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkIn);
router.post('/attendance/check-out', authorize('admin', 'cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkOut);
router.get('/attendance', getMyAttendance);
router.get('/attendance/report', requirePermission('employees'), getAttendanceReport);
router.get('/attendance/late-deductions', requirePermission('employees'), getLateDeductions);
// Admin/manager can mark any employee; cashier/delivery/stock can mark themselves only
router.post('/attendance/mark', (req, res, next) => {
  if (['cashier', 'deliveryGuy', 'stockEmployee'].includes(req.user?.role)) {
    return next();
  }
  return requirePermission('employees')(req, res, next);
}, adminMarkAttendance);

// Leaves
router.post('/leaves', requestLeave);
router.get('/leaves', getMyLeaves);
router.get('/leaves/store', requirePermission('employees'), getStoreLeaves);
router.put('/leaves/:id/approve', requirePermission('employees'), approveLeave);
router.put('/leaves/:id/reject', requirePermission('employees'), rejectLeave);
router.put('/leaves/:id/cancel', authorize('admin'), cancelDecision);
router.post('/leaves/create-for-employee', requirePermission('employees'), adminCreateLeave);
router.get('/attendance-summary/:employeeId', getAttendanceSummary);

// Employees
router.get('/employees', requirePermission('employees'), getEmployees);
router.post('/employees', requirePermission('employees'), addEmployee);
router.put('/employees/:id', requirePermission('employees'), updateEmployee);
router.delete('/employees/:id', requirePermission('employees'), deleteEmployee);

// Breaks
router.post('/breaks/start', authorize('admin', 'cashier', 'deliveryGuy', 'stockEmployee', 'manager'), startBreak);
router.post('/breaks/end', authorize('admin', 'cashier', 'deliveryGuy', 'stockEmployee', 'manager'), endBreak);
router.get('/breaks/active', getActiveBreak);
router.get('/breaks', getBreakHistory);

// Targets
router.post('/targets', requirePermission('employees'), createTarget);
router.get('/targets/me', getMyTargets);
router.get('/targets', requirePermission('employees'), getTargets);
router.put('/targets/:id/progress', requirePermission('employees'), updateTargetProgress);
router.put('/targets/:id/pay-bonus', requirePermission('employees'), payTargetBonus);
router.delete('/targets/:id', requirePermission('employees'), deleteTarget);

// Performance
router.get('/performance/:employeeId', requirePermission('employees'), getEmployeePerformance);

// Policy Controller Imports
const {
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
} = require('../controllers/policyController');

// Policies — GET stays open to anyone managing leave (requirePermission), but
// editing the money-affecting policy itself is Admin only.
router.get('/policies/leave', requirePermission('employees'), getLeavePolicies);
router.post('/policies/leave', authorize('admin'), createLeavePolicy);
router.put('/policies/leave/:id', authorize('admin'), updateLeavePolicy);
router.delete('/policies/leave/:id', authorize('admin'), deleteLeavePolicy);

router.get('/policies/attendance', requirePermission('employees'), getAttendancePolicies);
router.post('/policies/attendance', authorize('admin'), createAttendancePolicy);
router.put('/policies/attendance/:id', authorize('admin'), updateAttendancePolicy);
router.delete('/policies/attendance/:id', authorize('admin'), deleteAttendancePolicy);

router.post('/policies/assign', requirePermission('employees'), assignPoliciesToEmployee);
router.post('/policies/assign-all', requirePermission('employees'), assignPoliciesToAllEmployees);

module.exports = router;
