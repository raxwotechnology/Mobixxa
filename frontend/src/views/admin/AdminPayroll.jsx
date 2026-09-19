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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2 m-0">
              <Landmark size={24} className="text-brand-indigo" /> Monthly Payroll Engine
            </h1>
            <p className="text-xs font-normal text-slate-500 mt-1 m-0">
              Generate for Employee • Target bonuses & attendance OTs are auto-included in live payroll calculation
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setTab('process')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${
                tab === 'process' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Generate Payroll
            </button>
            <button
              onClick={() => { setTab('report'); handleFetchReport(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-0 cursor-pointer ${
                tab === 'report' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Summary Report
            </button>
          </div>
        </div>

        {tab === 'process' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Selection Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900 m-0">Select Employee & Period</h3>
              
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
                <p className="text-xs font-black uppercase text-slate-400 tracking-wider m-0">Manual Adjustments (Optional)</p>
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
                className="w-full bg-brand-indigo hover:bg-brand-violet text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2"
              >
                <Calculator size={16} /> Live Calculate Salary
              </button>
            </div>

            {/* Right Raxwo Style Live Preview Card */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
              <h3 className="text-base font-black text-slate-900 m-0 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Live Payroll Preview</span>
                {preview && (
                  <span className="text-emerald-600 font-black text-sm">
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
                      <h4 className="text-sm font-black text-slate-900 m-0">{selectedEmployee?.name}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold m-0 mt-0.5">
                        {selectedEmployee?.role?.toUpperCase()} • {selectedEmployee?.employeeInfo?.department || 'Sales'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Period</span>
                      <span className="font-extrabold text-slate-800">{month}/{year}</span>
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
                        <div className="ml-2 pl-3 border-l-2 border-emerald-100 py-1 space-y-1 text-[11px] text-slate-500">
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
                        <div className="ml-2 pl-3 border-l-2 border-rose-100 py-1 space-y-1 text-[11px] text-slate-500">
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
                      <div className="ml-2 pl-3 border-l-2 border-rose-100 py-1 space-y-0.5 text-[11px] text-slate-500">
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">Total Net Payable Salary</span>
                      <h2 className="text-xl font-black m-0 mt-0.5">LKR {Number(preview.netSalary || 0).toLocaleString()}</h2>
                    </div>
                    <button
                      onClick={handleProcess}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-sm flex items-center gap-2"
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
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 m-0">Monthly Payroll Summary Report ({month}/{year})</h3>
            {!report ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                Loading payroll summary report...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider">
                      <th className="px-5 py-4">Employee</th>
                      <th className="px-5 py-4">Basic Salary</th>
                      <th className="px-5 py-4">OT & Bonuses</th>
                      <th className="px-5 py-4">Recovery</th>
                      <th className="px-5 py-4">Advance</th>
                      <th className="px-5 py-4">Deductions</th>
                      <th className="px-5 py-4">Net Salary</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-center">Paysheet</th>
                      <th className="px-5 py-4 text-center">Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
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
                          <div className="font-black text-slate-900">LKR {Number(p.netSalary || 0).toLocaleString()}</div>
                          {adjustmentsTotal !== 0 && (
                            <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                              + {adjustmentsTotal.toLocaleString()} adj = {(Number(p.netSalary || 0) + adjustmentsTotal).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${p.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDownloadPaysheet(p._id)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border-0"
                            title="Download PDF Paysheet"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => openAdjustmentModal(p)}
                            className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all cursor-pointer border-0"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-100 flex items-center justify-center p-4" onClick={() => setAdjustmentRow(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg m-0">Log Adjustment</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 m-0">
                {adjustmentRow.employeeId?.name} — {adjustmentRow.month}/{adjustmentRow.year}. This is layered on top of the finalized net salary, never edits it.
              </p>
            </div>
            <form onSubmit={submitAdjustment} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Label *</label>
                <input required value={adjustmentForm.label} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, label: e.target.value })}
                  placeholder="e.g. Correction for missed OT" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Amount (LKR, use negative for a deduction) *</label>
                <input required type="number" value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Note (optional)</label>
                <textarea value={adjustmentForm.note} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                  rows="2" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAdjustmentRow(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20">
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
