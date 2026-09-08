const express = require('express');
const router = express.Router();
const {
  getOvertimeRecords,
  getOvertimeSummary,
  createOvertimeRecord,
  markOvertimePaid,
  deleteOvertimeRecord,
  getEmployeeOTReport,
  getMyOvertime,
  rejectOvertimeRecord,
} = require('../controllers/overtimeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Employee self-service route (must be before admin-only middleware)
router.get('/my', protect, getMyOvertime);

// Admin & Manager routes
router.get('/', protect, authorize('admin', 'manager'), getOvertimeRecords);
router.post('/', protect, authorize('admin', 'manager'), createOvertimeRecord);
router.get('/summary', protect, authorize('admin', 'manager'), getOvertimeSummary);
router.get('/employee/:employeeId', protect, authorize('admin', 'manager'), getEmployeeOTReport);
router.put('/:id/pay', protect, authorize('admin', 'manager'), markOvertimePaid);
router.put('/:id/reject', protect, authorize('admin', 'manager'), rejectOvertimeRecord);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteOvertimeRecord);

module.exports = router;
