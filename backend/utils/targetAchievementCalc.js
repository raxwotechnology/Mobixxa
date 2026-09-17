/**
 * Shared target-achievement -> payroll calculation.
 *
 * Single source of truth for sales-target progress, mirroring the pattern in
 * attendanceSalaryCalc.js: everything here is recomputed from Order/CustomerReturn
 * rows every call — nothing is trusted from a stored running total, so the number
 * shown on the Targets page and the number used by payroll can never drift apart.
 */
const Order = require('../models/Order');
const CustomerReturn = require('../models/CustomerReturn');
const { monthRange } = require('./attendanceSalaryCalc');

/**
 * Live-computed net sales for one employee/month, attributed by cashierId on
 * the sale date (credit/hire-purchase sales count immediately, not on
 * collection — matches how achievement is defined for target purposes here).
 */
const computeMonthlySalesAchievement = async (employeeId, month, year) => {
  const { start, end } = monthRange(year, month);

  const orders = await Order.find({
    isPosOrder: true,
    cashierId: employeeId,
    createdAt: { $gte: start, $lte: end },
    paymentStatus: { $ne: 'failed' },
  }).select('_id totalAmount');

  const grossSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const orderIds = orders.map((o) => o._id);

  const returns = orderIds.length
    ? await CustomerReturn.find({
        orderId: { $in: orderIds },
        status: { $in: ['approved', 'resolved'] },
      }).select('_id items')
    : [];

  const returnsValue = returns.reduce(
    (sum, r) => sum + r.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    0
  );

  return {
    grossSales,
    returnsValue,
    achievedValue: Math.max(0, grossSales - returnsValue),
    orderIds,
    returnIds: returns.map((r) => r._id),
  };
};

/**
 * Live progress for a single EmployeeTarget doc. For 'sales' targets, achievedValue
 * is recomputed from real POS data; other target types still use the stored
 * (manually-updated) achievedValue.
 */
const computeTargetProgress = async (target) => {
  let achievedValue = target.achievedValue || 0;
  let sourceOrderIds = [];
  let sourceReturnIds = [];

  if (target.targetType === 'sales') {
    const result = await computeMonthlySalesAchievement(target.employeeId, target.month, target.year);
    achievedValue = result.achievedValue;
    sourceOrderIds = result.orderIds;
    sourceReturnIds = result.returnIds;
  }

  const targetValue = target.targetValue || 0;
  const completed = targetValue > 0 && achievedValue >= targetValue;
  const percent = targetValue > 0 ? Math.min(100, Math.round((achievedValue / targetValue) * 100)) : 0;

  return {
    achievedValue,
    targetValue,
    percent,
    remaining: Math.max(0, targetValue - achievedValue),
    completed,
    status: completed ? 'completed' : target.status === 'missed' ? 'missed' : 'active',
    bonusEarned: completed ? target.bonusAmount || 0 : 0,
    sourceOrderIds,
    sourceReturnIds,
  };
};

module.exports = { computeMonthlySalesAchievement, computeTargetProgress };
