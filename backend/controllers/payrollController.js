const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Settings = require('../models/Settings');
const SalaryAdvance = require('../models/SalaryAdvance');
const CashierRecovery = require('../models/CashierRecovery');
const { computeMonthlyAttendanceSummary } = require('../utils/attendanceSalaryCalc');
const { computeTargetProgress } = require('../utils/targetAchievementCalc');

// Live-computed target bonus for an employee/month — sums bonusEarned across
// all of that employee's targets for the period, tracking which target ids
// actually earned a bonus (for marking bonusPaid on process, and traceability).
const computeMonthlyTargetBonus = async (employeeId, month, year) => {
  const EmployeeTarget = require('../models/EmployeeTarget');
  const targets = await EmployeeTarget.find({ employeeId, month, year, bonusPaid: false });
  let targetBonus = 0;
  const earnedTargetIds = [];
  const allTargetIds = targets.map((t) => t._id);
  for (const target of targets) {
    const progress = await computeTargetProgress(target);
    if (progress.bonusEarned > 0) {
      targetBonus += progress.bonusEarned;
      earnedTargetIds.push(target._id);
    }
  }
  return { targetBonus, earnedTargetIds, allTargetIds };
};

// Live-computed cashier shortage recovery deduction for an employee/month.
const computeMonthlyCashierRecovery = async (employeeId, month, year) => {
  const recoveries = await CashierRecovery.find({
    cashierId: employeeId,
    'payrollPeriod.month': month,
    'payrollPeriod.year': year,
  });
  return {
    cashierRecoveryDeduction: recoveries.reduce((sum, r) => sum + r.amount, 0),
    recoveryIds: recoveries.map((r) => r._id),
  };
};

// Live-computed, not-yet-deducted salary advances for an employee/month.
const computeMonthlyAdvanceDeduction = async (employeeId, month, year) => {
  const advances = await SalaryAdvance.find({
    employeeId,
    month,
    year,
    status: 'approved',
    deductedInPayroll: null,
  });
  return {
    advanceDeduction: advances.reduce((sum, a) => sum + a.amount, 0),
    advanceIds: advances.map((a) => a._id),
  };
};
const { sendNotification } = require('../utils/notificationService');
const { salaryPaidEmail, sendEmail } = require('../utils/emailService');
const { getSriLankaDateBoundaries } = require('../utils/timezone');

// Lazy-loaded: only required when export functions are actually called
let PDFDocument, XLSX;
const loadPdfkit = () => { if (!PDFDocument) PDFDocument = require('pdfkit'); return PDFDocument; };
const loadXlsx = () => { if (!XLSX) XLSX = require('sheetjs-style'); return XLSX; };

// Sri Lankan statutory rates
const EPF_EMPLOYEE_RATE = 0.08; // 8% employee contribution
const EPF_EMPLOYER_RATE = 0.12; // 12% employer contribution
const ETF_RATE = 0.03;          // 3% employer contribution

// @desc Calculate salary for an employee
// @route POST /api/payroll/calculate
// @access Private/Manager/Admin
const calculateSalary = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances = 0, deductions = 0, bonuses = 0 } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) { res.status(404); return next(new Error('Employee not found')); }

    const OvertimePay = require('../models/OvertimePay');
    const pendingOTs = await OvertimePay.find({ employeeId, status: 'pending' });
    const totalOTAmount = pendingOTs.reduce((sum, ot) => sum + ot.totalAmount, 0);

    const { targetBonus, allTargetIds } = await computeMonthlyTargetBonus(employeeId, month, year);
    const { cashierRecoveryDeduction, recoveryIds } = await computeMonthlyCashierRecovery(employeeId, month, year);
    const { advanceDeduction, advanceIds } = await computeMonthlyAdvanceDeduction(employeeId, month, year);

    const payType = employee.employeeInfo?.payType || 'monthly';
    const basePayAmount = employee.employeeInfo?.salary || 0;

    if (!basePayAmount) {
      res.status(400);
      return next(new Error('Employee salary not set'));
    }

    const summary = await computeMonthlyAttendanceSummary(employeeId, month, year);

    let basicSalary = 0;
    if (payType === 'daily') {
      basicSalary = basePayAmount * summary.totalWorkingDaysCount;
    } else if (payType === 'weekly') {
      basicSalary = basePayAmount * 4;
    } else {
      basicSalary = basePayAmount;
    }
    const attendanceDeductions = payType === 'monthly' ? summary.attendanceDeductions : 0;
    const attendanceAllowance = payType === 'monthly' ? summary.attendanceAllowance : 0;

    const manualBonuses = Number(bonuses);
    const grossSalary = basicSalary + Number(allowances) + manualBonuses + totalOTAmount + targetBonus + attendanceAllowance;
    const epfEmployee = parseFloat((basicSalary * EPF_EMPLOYEE_RATE).toFixed(2));
    const epfEmployer = parseFloat((basicSalary * EPF_EMPLOYER_RATE).toFixed(2));
    const etfEmployer = parseFloat((basicSalary * ETF_RATE).toFixed(2));

    const totalDeductions = epfEmployee + Number(deductions) + attendanceDeductions + cashierRecoveryDeduction + advanceDeduction;
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    res.json({
      employeeId,
      employeeName: employee.name,
      month,
      year,
      basicSalary,
      allowances: Number(allowances),
      bonuses: manualBonuses,
      overtimePay: totalOTAmount,
      otIncluded: totalOTAmount,
      targetBonus,
      targetBonusIncluded: targetBonus,
      grossSalary,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      otherDeductions: Number(deductions),
      attendanceDeductions,
      unapprovedAbsenceDeduction: summary.unapprovedAbsenceDeduction,
      excessOffDayDeduction: summary.excessOffDayDeduction,
      lateDeductionTotal: summary.lateDeductionTotal,
      otEarnedTotal: summary.otEarnedTotal,
      attendanceAllowance,
      attendanceBreakdown: summary,
      cashierRecoveryDeduction,
      advanceDeduction,
      totalDeductions,
      netSalary,
      sourceRefs: { targetIds: allTargetIds, cashierRecoveryIds: recoveryIds, advanceIds },
    });
  } catch (error) { next(error); }
};

// @desc Process salary payment  
// @route POST /api/payroll/pay
// @access Private/Manager/Admin
const processSalaryPayment = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances = 0, deductions = 0, bonuses = 0 } = req.body;

    // Check for duplicate
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      res.status(400);
      return next(new Error(`Salary already processed for ${month}/${year}`));
    }

    const employee = await User.findById(employeeId);
    if (!employee) { res.status(404); return next(new Error('Employee not found')); }

    const OvertimePay = require('../models/OvertimePay');
    const pendingOTs = await OvertimePay.find({ employeeId, status: 'pending' });
    const totalOTAmount = pendingOTs.reduce((sum, ot) => sum + ot.totalAmount, 0);

    const EmployeeTarget = require('../models/EmployeeTarget');
    const { targetBonus, earnedTargetIds } = await computeMonthlyTargetBonus(employeeId, month, year);
    const { cashierRecoveryDeduction, recoveryIds } = await computeMonthlyCashierRecovery(employeeId, month, year);
    const { advanceDeduction, advanceIds } = await computeMonthlyAdvanceDeduction(employeeId, month, year);

    const payType = employee.employeeInfo?.payType || 'monthly';
    const basePayAmount = employee.employeeInfo?.salary || 0;

    const summary = await computeMonthlyAttendanceSummary(employeeId, month, year);

    let basicSalary = 0;
    if (payType === 'daily') {
      basicSalary = basePayAmount * summary.totalWorkingDaysCount;
    } else if (payType === 'weekly') {
      basicSalary = basePayAmount * 4;
    } else {
      basicSalary = basePayAmount;
    }
    const attendanceDeductions = payType === 'monthly' ? summary.attendanceDeductions : 0;
    const attendanceAllowance = payType === 'monthly' ? summary.attendanceAllowance : 0;
    const unapprovedAbsenceDeduction = payType === 'monthly' ? summary.unapprovedAbsenceDeduction : 0;
    const excessOffDayDeduction = payType === 'monthly' ? summary.excessOffDayDeduction : 0;

    const manualBonuses = Number(bonuses);
    const grossSalary = basicSalary + Number(allowances) + manualBonuses + totalOTAmount + targetBonus + attendanceAllowance;
    const epfEmployee = parseFloat((basicSalary * EPF_EMPLOYEE_RATE).toFixed(2));
    const epfEmployer = parseFloat((basicSalary * EPF_EMPLOYER_RATE).toFixed(2));
    const etfEmployer = parseFloat((basicSalary * ETF_RATE).toFixed(2));
    const totalDeductions = epfEmployee + Number(deductions) + attendanceDeductions + cashierRecoveryDeduction + advanceDeduction;
    const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

    const payroll = await Payroll.create({
      employeeId,
      storeId: employee.assignedStore || null,
      month,
      year,
      basicSalary,
      daysWorked: summary.totalWorkingDaysCount,
      overtimePay: totalOTAmount,
      allowances: Number(allowances),
      bonuses: manualBonuses,
      targetBonus,
      grossSalary,
      epfEmployee,
      epfEmployer,
      etfEmployer,
      otherDeductions: Number(deductions),
      attendanceDeductions,
      unapprovedAbsenceDeduction,
      excessOffDayDeduction,
      attendanceAllowance,
      attendanceBreakdown: payType === 'monthly' ? {
        periodType: summary.periodType,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
        allowedLeaves: summary.allowedLeaves,
        leaveDaysTaken: summary.leaveDaysTaken,
        extraOffDaysThisMonth: summary.extraOffDaysThisMonth,
        unapprovedAbsences: summary.unapprovedAbsences,
        unpaidLeaveDays: summary.unpaidLeaveDays,
        lateDeductionTotal: summary.lateDeductionTotal,
        allowanceReleased: summary.allowanceReleased,
        leaveIds: summary.leaveIds,
        attendanceIds: summary.attendanceIds,
      } : undefined,
      cashierRecoveryDeduction,
      advanceDeduction,
      totalDeductions,
      netSalary,
      status: 'paid',
      paidAt: new Date(),
      paidBy: req.user._id,
      finalizedAt: new Date(),
      finalizedBy: req.user._id,
    });


    for (const ot of pendingOTs) {
      ot.status = 'paid';
      ot.paidAt = new Date();
      await ot.save();
    }

    if (earnedTargetIds.length) {
      await EmployeeTarget.updateMany(
        { _id: { $in: earnedTargetIds } },
        { $set: { bonusPaid: true, status: 'completed' } }
      );
    }

    if (advanceIds.length) {
      await SalaryAdvance.updateMany(
        { _id: { $in: advanceIds } },
        { $set: { deductedInPayroll: payroll._id, status: 'deducted' } }
      );
    }

    // Send notification & email
    const emailContent = salaryPaidEmail(employee.name, payroll);
    await sendNotification({
      userId: employee._id,
      userEmail: employee.email,
      type: 'salary_credit',
      title: 'Salary Credited',
      message: `Your salary of Rs.${netSalary.toLocaleString()} for ${month}/${year} has been processed${totalOTAmount > 0 ? ` (Includes OT: Rs.${totalOTAmount.toLocaleString()})` : ''}.`,
      link: '/employee/salary',
      emailContent,
    });

    res.status(201).json(payroll);
  } catch (error) { next(error); }
};

// @desc Get salary history for employee
// @route GET /api/payroll/history/:employeeId
// @access Private
const getSalaryHistory = async (req, res, next) => {
  try {
    // Allow employees to see their own, managers/admins to see anyone's
    const employeeId = req.params.employeeId === 'me' ? req.user._id : req.params.employeeId;

    if (employeeId.toString() !== req.user._id.toString() && !['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const history = await Payroll.find({ employeeId })
      .sort({ year: -1, month: -1 })
      .limit(24);
    res.json(history);
  } catch (error) { next(error); }
};

// @desc Get payroll report for a month
// @route GET /api/payroll/report
// @access Private/Manager/Admin
const getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, role, employeeName, employeeIds } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (employeeIds) {
      const ids = String(employeeIds).split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length > 0) filter.employeeId = { $in: ids };
    }

    let payrolls = await Payroll.find(filter)
      .populate('employeeId', 'name email role employeeInfo')
      .sort({ createdAt: -1 });

    if (role && role !== 'all') {
      payrolls = payrolls.filter((p) => p.employeeId?.role === role);
    }
    // Legacy fuzzy name filter, kept for any other caller still using it —
    // superseded by the exact employeeIds filter above when both are present.
    if (!employeeIds && employeeName && String(employeeName).trim()) {
      const q = String(employeeName).trim().toLowerCase();
      payrolls = payrolls.filter((p) => String(p.employeeId?.name || '').toLowerCase().includes(q));
    }

    const totals = payrolls.reduce((acc, p) => ({
      totalGross: acc.totalGross + p.grossSalary,
      totalNet: acc.totalNet + p.netSalary,
      totalEPFEmployee: acc.totalEPFEmployee + p.epfEmployee,
      totalEPFEmployer: acc.totalEPFEmployer + p.epfEmployer,
      totalETF: acc.totalETF + p.etfEmployer,
    }), { totalGross: 0, totalNet: 0, totalEPFEmployee: 0, totalEPFEmployer: 0, totalETF: 0 });

    res.json({ payrolls, totals, count: payrolls.length });
  } catch (error) { next(error); }
};

const adjustmentsTotal = (record) => (record.adjustments || []).reduce((sum, a) => sum + (a.amount || 0), 0);

const buildSalaryExportRows = (records = []) => records.map((record) => ({
  employeeName: record.employeeId?.name || 'Unknown',
  role: record.employeeId?.role || 'N/A',
  month: record.month,
  year: record.year,
  basicSalary: Number(record.basicSalary || 0),
  allowances: Number(record.allowances || 0),
  bonuses: Number(record.bonuses || 0),
  targetBonus: Number(record.targetBonus || 0),
  deductions: Number(record.otherDeductions || 0),
  cashierRecoveryDeduction: Number(record.cashierRecoveryDeduction || 0),
  advanceDeduction: Number(record.advanceDeduction || 0),
  adjustmentsTotal: adjustmentsTotal(record),
  netSalary: Number(record.netSalary || 0),
  adjustedNetSalary: Number(record.netSalary || 0) + adjustmentsTotal(record),
  paymentStatus: record.paymentStatus || record.status || 'pending',
}));

const exportEmployeeSalaryReport = async (req, res, next) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    const employeeId = req.params.employeeId === 'me' ? req.user._id : req.params.employeeId;
    if (String(employeeId) !== String(req.user._id) && !['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const filter = { employeeId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const records = await Payroll.find(filter)
      .populate('employeeId', 'name role')
      .sort({ year: -1, month: -1 });
    const rows = buildSalaryExportRows(records);

    if (format === 'xlsx') {
      const xl = loadXlsx();
      const sheet = xl.utils.json_to_sheet(rows);
      const workbook = xl.utils.book_new();
      xl.utils.book_append_sheet(workbook, sheet, 'Salary Report');
      const buffer = xl.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const PDF = loadPdfkit();
      const doc = new PDF({ margin: 40, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text('Employee Salary Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);
      rows.forEach((row, idx) => {
        doc.fontSize(11).text(`${idx + 1}. ${row.employeeName} (${row.role})`);
        doc.fontSize(10).text(`Period: ${row.month}/${row.year} | Basic: Rs.${row.basicSalary.toLocaleString()} | Bonus: Rs.${row.bonuses.toLocaleString()} | Deductions: Rs.${row.deductions.toLocaleString()} | Net: Rs.${row.netSalary.toLocaleString()} | Status: ${row.paymentStatus}`);
        doc.moveDown(0.6);
      });
      doc.end();
      return;
    }

    const headers = ['Employee Name', 'Role', 'Month', 'Year', 'Basic Salary', 'Allowances', 'Bonuses', 'Target Bonus', 'Deductions', 'Cashier Recovery', 'Advance Deduction', 'Adjustments', 'Net Salary', 'Adjusted Net Salary', 'Payment Status'];
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => [
        `"${row.employeeName}"`,
        `"${row.role}"`,
        row.month,
        row.year,
        row.basicSalary,
        row.allowances,
        row.bonuses,
        row.targetBonus,
        row.deductions,
        row.cashierRecoveryDeduction,
        row.advanceDeduction,
        row.adjustmentsTotal,
        row.netSalary,
        row.adjustedNetSalary,
        `"${row.paymentStatus}"`,
      ].join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="salary-report-${employeeId}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (error) { next(error); }
};

const downloadPaysheet = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'name email role employeeInfo')
      .populate('storeId', 'name address phone')
      .populate('paidBy', 'name');

    if (!payroll) {
      res.status(404);
      return next(new Error('Payroll record not found'));
    }

    if (String(payroll.employeeId?._id) !== String(req.user._id) && !['admin', 'manager'].includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized'));
    }

    const settings = await Settings.findOne().lean();
    const template = settings?.documentTemplates?.paysheet || {};
    const fields = template.fields || {};
    const PDF = loadPdfkit();
    const doc = new PDF({ margin: 42, size: template.layout === 'compact' ? 'A5' : 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="paysheet-${payroll.employeeId?.name || 'employee'}-${payroll.month}-${payroll.year}.pdf"`);
    doc.pipe(res);

    const accent = template.accentColor || '#2563eb';
    doc.rect(0, 0, doc.page.width, 72).fill(accent);
    doc.fillColor('#ffffff').fontSize(18).text(template.title || 'Paysheet', 42, 24);
    doc.fontSize(10).text(settings?.shopName || 'Mobixa', 42, 48);

    doc.fillColor('#111827').moveDown(3);
    doc.fontSize(12).text(`Period: ${payroll.month}/${payroll.year}`);
    doc.text(`Employee: ${payroll.employeeId?.name || 'Unknown'}`);
    if (fields.showEmployeeRole !== false) doc.text(`Role: ${payroll.employeeId?.role || 'N/A'}`);
    if (fields.showStore !== false) doc.text(`Store: ${payroll.storeId?.name || 'N/A'}`);
    if (fields.showProcessedBy !== false) doc.text(`Processed By: ${payroll.paidBy?.name || 'System'}`);
    doc.moveDown(1);

    const adjustmentsSum = (payroll.adjustments || []).reduce((sum, a) => sum + (a.amount || 0), 0);
    const rows = [
      ['Basic Salary', payroll.basicSalary],
      ['Allowances', payroll.allowances],
      ['Overtime Pay', payroll.overtimePay || 0],
      ['Target Incentive', payroll.targetBonus || 0],
      ['Bonuses (Manual)', payroll.bonuses],
      ['Gross Salary', payroll.grossSalary],
      ['EPF Employee', -payroll.epfEmployee],
      ['Other Deductions', -payroll.otherDeductions],
      ['Attendance Deductions', -payroll.attendanceDeductions],
      ['Attendance Allowance', payroll.attendanceAllowance || 0],
      ['Cashier Shortage Recovery', -(payroll.cashierRecoveryDeduction || 0)],
      ['Salary Advance Deducted', -(payroll.advanceDeduction || 0)],
      ['Net Salary', payroll.netSalary],
      ...(adjustmentsSum ? [['Adjustments (post-finalization)', adjustmentsSum], ['Adjusted Net Salary', payroll.netSalary + adjustmentsSum]] : []),
    ];

    rows.forEach(([label, value], index) => {
      const isTotal = label === 'Net Salary' || label === 'Adjusted Net Salary';
      if (isTotal) {
        doc.moveDown(0.3);
        doc.strokeColor(accent).lineWidth(1).moveTo(42, doc.y).lineTo(doc.page.width - 42, doc.y).stroke();
        doc.moveDown(0.5);
      }
      doc.fontSize(isTotal ? 13 : 10).fillColor(isTotal ? accent : '#111827');
      doc.text(label, 42, doc.y, { continued: true });
      doc.text(`Rs. ${Number(value || 0).toLocaleString()}`, { align: 'right' });
      if (index < rows.length - 1) doc.moveDown(0.45);
    });

    if (fields.showEmployerContributions !== false) {
      doc.moveDown(1);
      doc.fillColor('#4b5563').fontSize(10).text(`Employer EPF: Rs. ${Number(payroll.epfEmployer || 0).toLocaleString()}`);
      doc.text(`Employer ETF: Rs. ${Number(payroll.etfEmployer || 0).toLocaleString()}`);
    }

    if (template.footerText) {
      doc.moveDown(1.5);
      doc.fontSize(9).fillColor('#6b7280').text(template.footerText, { align: 'center' });
    }

    doc.end();
  } catch (error) { next(error); }
};

// @desc Record salary advance for an employee
// @route POST /api/payroll/advances
// @access Private/Manager/Admin
const recordSalaryAdvance = async (req, res, next) => {
  try {
    const { employeeId, amount, reason, date, paymentMethod, bankAccountId } = req.body;
    if (!employeeId || !amount) {
      res.status(400);
      return next(new Error('Employee and Amount are required'));
    }

    const normalizedMethod = ['cash', 'bank_transfer', 'cheque'].includes(paymentMethod) ? paymentMethod : 'cash';
    if (normalizedMethod === 'bank_transfer' && !bankAccountId) {
      res.status(400);
      return next(new Error('A bank account is required for a bank transfer advance'));
    }

    const advanceDate = date ? new Date(date) : new Date();
    let storeId;
    let ledgerTransactionId;

    // Bank-transfer advances move money out of a real account — route through
    // the shared ledger so Manage Accounts / Financials reflect it. Cash and
    // cheque advances keep prior behavior (no account picker exists for them
    // in the UI yet, so there's no accountId to post against).
    if (normalizedMethod === 'bank_transfer' && bankAccountId) {
      const Account = require('../models/Account');
      const account = await Account.findById(bankAccountId);
      if (!account) {
        res.status(400);
        return next(new Error('Selected bank account was not found'));
      }
      storeId = account.storeId;

      const { recordTransaction } = require('../services/ledgerService');
      const employee = await User.findById(employeeId).select('name');
      const transaction = await recordTransaction({
        storeId,
        accountId: bankAccountId,
        type: 'expense',
        category: 'Salary Advance',
        amount: Number(amount),
        paymentMethod: 'Bank Transfer',
        description: `Salary advance to ${employee?.name || 'employee'}${reason ? ' — ' + reason : ''}`,
        createdBy: req.user._id,
        date: advanceDate,
      });
      ledgerTransactionId = transaction._id;
    }

    const advance = await SalaryAdvance.create({
      employeeId,
      amount: Number(amount),
      reason: reason || 'Salary advance',
      requestDate: advanceDate,
      month: advanceDate.getMonth() + 1,
      year: advanceDate.getFullYear(),
      approvedBy: req.user._id,
      status: 'approved',
      paymentMethod: normalizedMethod,
      accountId: normalizedMethod === 'bank_transfer' ? bankAccountId : undefined,
      storeId,
      ledgerTransactionId,
    });
    const populated = await SalaryAdvance.findById(advance._id).populate('employeeId', 'name email role employeeInfo');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc Get salary advances
// @route GET /api/payroll/advances
// @access Private/Manager/Admin
const getSalaryAdvances = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query;
    const query = {};
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (employeeId) query.employeeId = employeeId;

    const advances = await SalaryAdvance.find(query)
      .populate('employeeId', 'name email role employeeInfo')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(advances);
  } catch (error) {
    next(error);
  }
};

// @desc Delete salary advance
// @route DELETE /api/payroll/advances/:id
// @access Private/Admin
const deleteSalaryAdvance = async (req, res, next) => {
  try {
    const advance = await SalaryAdvance.findById(req.params.id);
    if (!advance) {
      res.status(404);
      return next(new Error('Salary advance not found'));
    }

    // Money-affecting advances (bank transfer) must be reversed with a
    // logged counter-entry, never silently erased from the ledger.
    if (advance.ledgerTransactionId) {
      const { reverseTransaction } = require('../services/ledgerService');
      await reverseTransaction(advance.ledgerTransactionId, {
        reason: 'Salary advance deleted',
        createdBy: req.user._id,
      });
    }

    await advance.deleteOne();
    res.json({ message: 'Salary advance removed' });
  } catch (error) {
    next(error);
  }
};

// @desc Log a correction against an already-finalized payslip without
//          editing its original locked figures
// @route POST /api/payroll/:id/adjustments
// @access Private/Admin
const addAdjustment = async (req, res, next) => {
  try {
    const { label, amount, note } = req.body;
    if (!label || amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      res.status(400);
      return next(new Error('label and a numeric amount are required'));
    }

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      res.status(404);
      return next(new Error('Payroll record not found'));
    }

    payroll.adjustments.push({
      label: String(label).trim(),
      amount: Number(amount),
      note: note ? String(note).trim() : undefined,
      adjustedBy: req.user._id,
      adjustedAt: new Date(),
    });
    await payroll.save();

    const populated = await Payroll.findById(payroll._id)
      .populate('employeeId', 'name email role')
      .populate('adjustments.adjustedBy', 'name');
    res.status(201).json(populated);
  } catch (error) { next(error); }
};

module.exports = {
  calculateSalary,
  processSalaryPayment,
  getSalaryHistory,
  getPayrollReport,
  exportEmployeeSalaryReport,
  downloadPaysheet,
  recordSalaryAdvance,
  getSalaryAdvances,
  deleteSalaryAdvance,
  addAdjustment,
};
