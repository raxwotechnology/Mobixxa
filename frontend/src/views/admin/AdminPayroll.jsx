'use client';

import { useState, useEffect } from 'react';
import { Calculator, Send, FileText, Download, Landmark, Search, User, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { getAdminUsers, calculateSalary, processSalaryPayment, getPayrollReport, downloadPaysheet, getTargets, getCashierRecoveries, addPayrollAdjustment } from '../../services/api';
import { toast } from 'react-toastify';

const now = new Date();

const AdminPayroll = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState('process'); // 'process' | 'report'
  const [detailsOpen, setDetailsOpen] = useState(null); // 'targets' | 'recovery' | null
  const [targetDetails, setTargetDetails] = useState([]);
  const [recoveryDetails, setRecoveryDetails] = useState([]);
  const [adjustmentRow, setAdjustmentRow] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ label: '', amount: '', note: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminUsers({ limit: 100 });
      const allUsers = data?.users || data || [];
      setEmployees(allUsers.filter(u => u.role !== 'customer'));
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEmpId) return toast.error('Select an employee');
    try {
      const { data } = await calculateSalary({
        employeeId: selectedEmpId,
        month,
        year,
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        bonuses: Number(bonuses) || 0,
      });
      setPreview(data);
      setDetailsOpen(null);
      setTargetDetails([]);
      setRecoveryDetails([]);
      toast.success('Salary calculated & live preview updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    }
  };

  const toggleDetails = async (section) => {
    if (detailsOpen === section) {
      setDetailsOpen(null);
      return;
    }
    setDetailsOpen(section);
    try {
      if (section === 'targets' && targetDetails.length === 0) {
        const { data } = await getTargets({ employeeId: selectedEmpId, month, year });
        setTargetDetails(data);
      }
      if (section === 'recovery' && recoveryDetails.length === 0) {
        const { data } = await getCashierRecoveries({ cashierId: selectedEmpId });
        setRecoveryDetails(data.filter(r => r.payrollPeriod?.month === month && r.payrollPeriod?.year === year));
      }
    } catch {
      toast.error('Failed to load details');
    }
  };

  const openAdjustmentModal = (row) => {
    setAdjustmentRow(row);
    setAdjustmentForm({ label: '', amount: '', note: '' });
  };

  const submitAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.label || adjustmentForm.amount === '') return toast.error('Label and amount are required');
    try {
      await addPayrollAdjustment(adjustmentRow._id, {
        label: adjustmentForm.label,
        amount: Number(adjustmentForm.amount),
        note: adjustmentForm.note,
      });
      toast.success('Adjustment logged');
      setAdjustmentRow(null);
      handleFetchReport();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log adjustment');
    }
  };

  const handleProcess = async () => {
    if (!selectedEmpId) return toast.error('Select an employee');
    try {
      await processSalaryPayment({
        employeeId: selectedEmpId,
        month,
        year,
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        bonuses: Number(bonuses) || 0,
      });
      toast.success('Salary processed & notification sent to employee');
      setPreview(null);
      setSelectedEmpId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    }
  };

  const handleFetchReport = async () => {
    try {
      const { data } = await getPayrollReport({ month, year });
      setReport(data);
    } catch {
      toast.error('Failed to fetch report');
    }
  };

  const handleDownloadPaysheet = async (payrollId) => {
    try {
      const res = await downloadPaysheet(payrollId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paysheet-${payrollId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download paysheet PDF');
    }
  };

  const selectedEmployee = employees.find(e => e._id === selectedEmpId);

  return (
    <DashboardLayout title="Payroll Management">
      <div className="ds-page">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge"><Landmark size={12} /> Staff Payroll</span>
            <h1>Monthly Payroll Engine</h1>
            <p>Target bonuses, sales incentives &amp; attendance OTs are automatically calculated in real time</p>
          </div>
          <div className="ds-page-header-right">
            <div className="ds-card" style={{ padding: '0.25rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => setTab('process')}
                  className={`ds-btn ds-btn-sm ${tab === 'process' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
                >
                  Generate Payroll
                </button>
                <button
                  onClick={() => { setTab('report'); handleFetchReport(); }}
                  className={`ds-btn ds-btn-sm ${tab === 'report' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
                >
                  Monthly Summary Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {tab === 'process' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Selection Form */}
            <div className="lg:col-span-5 ds-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="ds-card-title">Select Employee &amp; Period</h3>
              
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Search & Choose Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={selectedEmpId ? [selectedEmpId] : []}
                  onChange={([id]) => setSelectedEmpId(id || '')}
                  placeholder="Search and select employee..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Month</label>
                  <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('en', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Year</label>
                  <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider m-0">Manual Adjustments (Optional)</p>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Custom Allowances (LKR)</label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Custom Bonuses (LKR)</label>
                  <input
                    type="number"
                    value={bonuses}
                    onChange={e => setBonuses(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Other Deductions (LKR)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={e => setDeductions(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full bg-brand-indigo hover:bg-brand-violet text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2"
              >
                <Calculator size={16} /> Live Calculate Salary
              </button>
            </div>

            {/* Right Live Preview Card */}
            <div className="lg:col-span-7 ds-card" style={{ padding: '1.5rem' }}>
              <h3 className="ds-card-title" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--ds-border-soft)', paddingBottom: '0.75rem' }}>
                <span>Live Payroll Preview</span>
                {preview && (
                  <span className="ds-badge ds-badge-green" style={{ fontSize: 'var(--ds-text-sm)' }}>
                    LKR {Number(preview.netSalary || 0).toLocaleString()} Net
                  </span>
                )}
              </h3>

              {!selectedEmpId ? (
                <div className="text-center py-16 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  Select an employee from the left panel to view live breakdown
                </div>
              ) : !preview ? (
                <div className="text-center py-16 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  Click "Live Calculate Salary" to fetch complete payroll breakdown for {selectedEmployee?.name}
                </div>
              ) : (
                <div className="space-y-4 mt-4 text-xs">
                  {/* Employee Banner */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 m-0">{selectedEmployee?.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold m-0 mt-0.5">
                        {selectedEmployee?.role?.toUpperCase()} • {selectedEmployee?.employeeInfo?.department || 'Sales'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase block">Period</span>
                      <span className="font-bold text-slate-800">{month}/{year}</span>
                    </div>
                  </div>

                  {/* Breakdown Details List */}
                  <div className="space-y-2 border-t border-b border-slate-100 py-3 font-semibold text-slate-700">
                    <div className="flex justify-between py-1">
                      <span>Basic Salary</span>
                      <span className="font-bold text-slate-900">LKR {Number(preview.basicSalary || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1 text-emerald-700">
                      <span>Overtime (Auto from Attendance)</span>
                      <span className="font-bold">+ LKR {Number(preview.overtimePay || 0).toLocaleString()}</span>
                    </div>

                    <div>
                      <div className="flex justify-between py-1 text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          Target Incentive (Auto from Sales)
                          <button type="button" onClick={() => toggleDetails('targets')} className="text-slate-400 hover:text-slate-700">
                            {detailsOpen === 'targets' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </span>
                        <span className="font-bold">+ LKR {Number(preview.targetBonus || 0).toLocaleString()}</span>
                      </div>
                      {detailsOpen === 'targets' && (
                        <div className="ml-2 pl-3 border-l-2 border-emerald-100 py-1 space-y-1 text-xs text-slate-500">
                          {targetDetails.length === 0 && <p>No targets assigned for this period.</p>}
                          {targetDetails.map(t => (
                            <div key={t._id} className="flex justify-between">
                              <span>{t.targetType} — {Number(t.achievedValue).toLocaleString()} / {Number(t.targetValue).toLocaleString()}</span>
                              <span className={t.status === 'completed' ? 'text-emerald-600 font-bold' : ''}>{t.status === 'completed' ? `+Rs.${t.bonusAmount}` : `${t.percent}%`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between py-1 text-emerald-700">
                      <span>Custom Bonuses (Manual)</span>
                      <span className="font-bold">+ LKR {Number(preview.bonuses || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1 text-emerald-700">
                      <span>Allowances</span>
                      <span className="font-bold">+ LKR {Number(preview.allowances || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1 text-rose-600">
                      <span>Salary Advances Deducted</span>
                      <span className="font-bold">- LKR {Number(preview.advanceDeduction || 0).toLocaleString()}</span>
                    </div>

                    <div>
                      <div className="flex justify-between py-1 text-rose-600">
                        <span className="flex items-center gap-1.5">
                          Cashier Shortage Recovery
                          <button type="button" onClick={() => toggleDetails('recovery')} className="text-slate-400 hover:text-slate-700">
                            {detailsOpen === 'recovery' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </span>
                        <span className="font-bold">- LKR {Number(preview.cashierRecoveryDeduction || 0).toLocaleString()}</span>
                      </div>
                      {detailsOpen === 'recovery' && (
                        <div className="ml-2 pl-3 border-l-2 border-rose-100 py-1 space-y-1 text-xs text-slate-500">
                          {recoveryDetails.length === 0 && <p>No recoveries logged for this period.</p>}
                          {recoveryDetails.map(r => (
                            <div key={r._id} className="flex justify-between">
                              <span>{new Date(r.date).toLocaleDateString()} — {r.note || 'Recovery'}</span>
                              <span>Rs.{Number(r.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between py-1 text-rose-600">
                      <span>Attendance / Leave Deductions</span>
                      <span className="font-bold">- LKR {Number(preview.attendanceDeductions || 0).toLocaleString()}</span>
                    </div>
                    {preview.attendanceBreakdown && (
                      <div className="ml-2 pl-3 border-l-2 border-rose-100 py-1 space-y-0.5 text-xs text-slate-500">
                        <div className="flex justify-between"><span>Unapproved absences</span><span>{preview.attendanceBreakdown.unapprovedAbsences || 0} day(s)</span></div>
                        <div className="flex justify-between"><span>Extra off-days this month</span><span>{preview.attendanceBreakdown.extraOffDaysThisMonth || 0} day(s)</span></div>
                        <div className="flex justify-between"><span>Unpaid leave days</span><span>{preview.attendanceBreakdown.unpaidLeaveDays || 0} day(s)</span></div>
                      </div>
                    )}

                    <div className="flex justify-between py-1 text-slate-500">
                      <span>EPF Contribution (Employee 8%)</span>
                      <span className="font-bold">- LKR {Number(preview.epfEmployee || 0).toLocaleString()}</span>
                    </div>

                    {Number(preview.otherDeductions || 0) > 0 && (
                      <div className="flex justify-between py-1 text-rose-600">
                        <span>Other Deductions (Manual)</span>
                        <span className="font-bold">- LKR {Number(preview.otherDeductions || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Net Payable */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">Total Net Payable Salary</span>
                      <h2 className="text-xl font-bold m-0 mt-0.5">LKR {Number(preview.netSalary || 0).toLocaleString()}</h2>
                    </div>
                    <button
                      onClick={handleProcess}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-sm flex items-center gap-2"
                    >
                      <Send size={15} /> Finalize & Process Payroll
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <div className="ds-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="ds-card-title">Monthly Payroll Summary Report ({month}/{year})</h3>
            {!report ? (
              <div className="ds-loading"><div className="ds-spinner" /></div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Basic Salary</th>
                      <th>OT &amp; Bonuses</th>
                      <th>Recovery</th>
                      <th>Advance</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Paysheet</th>
                      <th style={{ textAlign: 'center' }}>Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.payrolls || []).map(p => {
                      const adjustmentsTotal = (p.adjustments || []).reduce((s, a) => s + (a.amount || 0), 0);
                      return (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition-colors align-top">
                        <td className="px-5 py-4 font-bold text-slate-900">{p.employeeId?.name}</td>
                        <td className="px-5 py-4">LKR {Number(p.basicSalary || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-emerald-600 font-bold">LKR {Number((p.overtimePay || 0) + (p.targetBonus || 0) + (p.bonuses || 0)).toLocaleString()}</td>
                        <td className="px-5 py-4 text-rose-600">LKR {Number(p.cashierRecoveryDeduction || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-rose-600">LKR {Number(p.advanceDeduction || 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-rose-600">LKR {Number(p.totalDeductions || 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">LKR {Number(p.netSalary || 0).toLocaleString()}</div>
                          {adjustmentsTotal !== 0 && (
                            <div className="text-xs font-bold text-amber-600 mt-0.5">
                              + {adjustmentsTotal.toLocaleString()} adj = {(Number(p.netSalary || 0) + adjustmentsTotal).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${p.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDownloadPaysheet(p._id)}
                            className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
                            title="Download PDF Paysheet"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => openAdjustmentModal(p)}
                            className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
                            title="Log a post-finalization adjustment"
                          >
                            <Plus size={14} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {adjustmentRow && (
        <div className="ds-modal-overlay" onClick={() => setAdjustmentRow(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <div>
                <h3 className="ds-modal-title">Log Adjustment</h3>
                <p className="ds-card-subtitle">
                  {adjustmentRow.employeeId?.name} — {adjustmentRow.month}/{adjustmentRow.year}
                </p>
              </div>
            </div>
            <form onSubmit={submitAdjustment}>
              <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="ds-form-group">
                  <label className="ds-label">Label *</label>
                  <input required value={adjustmentForm.label} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, label: e.target.value })}
                    placeholder="e.g. Correction for missed OT" className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Amount (LKR, use negative for deduction) *</label>
                  <input required type="number" value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Note (optional)</label>
                  <textarea value={adjustmentForm.note} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                    rows="2" className="ds-input" style={{ resize: 'none' }} />
                </div>
              </div>
              <div className="ds-modal-footer">
                <button type="button" onClick={() => setAdjustmentRow(null)} className="ds-btn ds-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="ds-btn ds-btn-primary">
                  Log Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPayroll;
