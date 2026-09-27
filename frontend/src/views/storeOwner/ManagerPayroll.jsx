'use client';

import { useState, useEffect } from 'react';
import { Calculator, Send, FileText, CreditCard, Download, Landmark } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { getEmployees, calculateSalary, processSalaryPayment, getPayrollReport, downloadPaysheet } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { managerNavGroups } from './managerNavItems';

const now = new Date();

const ManagerPayroll = ({ navItems = managerNavGroups, title = 'Manager Dashboard' }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState('process');

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await getEmployees({ includeManagers: true });
      setEmployees(data);
    }
    catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  const handleCalculate = async () => {
    if (!selected) return toast.error('Select an employee');
    try {
      const { data } = await calculateSalary({ employeeId: selected, month, year, allowances, deductions, bonuses });
      setPreview(data);
    } catch (err) { toast.error(err.response?.data?.message || 'Calculation failed'); }
  };

  const handleProcess = async () => {
    if (!selected) return toast.error('Select an employee');
    try {
      await processSalaryPayment({ employeeId: selected, month, year, allowances, deductions, bonuses });
      toast.success('Salary processed & notification sent!');
      setPreview(null);
      setSelected('');
    } catch (err) { toast.error(err.response?.data?.message || 'Processing failed'); }
  };

  const handleFetchReport = async () => {
    try { const { data } = await getPayrollReport({ month, year }); setReport(data); }
    catch { toast.error('Failed to fetch report'); }
  };

  const chartData = report?.payrolls?.map(p => ({
    name: (p.employeeId?.name || 'Unknown').split(' ')[0],
    gross: p.grossSalary,
    epfEmp: p.epfEmployee,
    epfEmployer: p.epfEmployer,
    etf: p.etfEmployer,
    net: p.netSalary,
  })) || [];

  const exportCSV = () => {
    if (!report?.payrolls?.length) return toast.error('No data to export');
    const rows = [
      ['Employee', 'Basic', 'Allowances', 'Bonuses', 'Target Bonus', 'Gross', 'EPF Employee (8%)', 'EPF Employer (12%)', 'ETF Employer (3%)', 'Deductions', 'Cashier Recovery', 'Advance Deduction', 'Net Salary', 'Status'].join(','),
      ...report.payrolls.map(p => [p.employeeId?.name, p.basicSalary, p.allowances, p.bonuses, p.targetBonus || 0, p.grossSalary, p.epfEmployee, p.epfEmployer, p.etfEmployer, p.otherDeductions, p.cashierRecoveryDeduction || 0, p.advanceDeduction || 0, p.netSalary, p.status].join(','))
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `payroll_${month}_${year}.csv`; a.click();
    toast.success('Payroll report exported');
  };

  const handleDownloadPaysheet = async (payroll) => {
    try {
      const { data } = await downloadPaysheet(payroll._id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `paysheet_${payroll.employeeId?.name || 'employee'}_${payroll.month}_${payroll.year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download paysheet');
    }
  };

  if (loading) return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="ds-page">
        <div className="flex items-center justify-center h-64">
          <div className="ds-spinner"></div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Landmark size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Staff Payroll</h1>
              <p className="ds-page-subtitle">Process salaries with Sri Lankan EPF/ETF compliance</p>
            </div>
          </div>
          <div className="ds-page-header-right">
             <button onClick={exportCSV} className="ds-btn ds-btn-sm ds-btn-secondary">
               <Download size={14} /> Export CSV
             </button>
          </div>
        </div>

        {/* Global Filter Bar wrapped in ds-card as per rules */}
        <div className="ds-card mb-6">
          <div className="ds-filter-bar p-4 flex flex-col sm:flex-row gap-4 items-center">
             <div className="flex-1 w-full">
                {/* using EmployeeSelector as ds-search equivalent */}
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={selected ? [selected] : []}
                  onChange={([id]) => setSelected(id || '')}
                  placeholder="Search employee..."
                  className="ds-search"
                />
             </div>
             <div className="flex gap-4 w-full sm:w-auto">
               <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="ds-select flex-1">
                  {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en', {month: 'long'})}</option>)}
               </select>
               <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="ds-select w-24" />
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('process')} className={`ds-btn ds-btn-sm ${tab === 'process' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}><Calculator size={14} /> Process Salary</button>
          <button onClick={() => { setTab('report'); handleFetchReport(); }} className={`ds-btn ds-btn-sm ${tab === 'report' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}><FileText size={14} /> Monthly Report</button>
          <button onClick={() => { setTab('epf'); handleFetchReport(); }} className={`ds-btn ds-btn-sm ${tab === 'epf' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}><CreditCard size={14} /> EPF/ETF Summary</button>
        </div>

        {tab === 'process' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="ds-card">
              <div className="ds-card-header">
                <h2 className="ds-card-title"><Calculator size={18} /> Calculate Salary</h2>
              </div>
              <div className="ds-card-body space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="ds-form-group">
                    <label className="ds-label">Allowances</label>
                    <input type="number" value={allowances} onChange={(e) => setAllowances(Number(e.target.value))} className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Bonuses</label>
                    <input type="number" value={bonuses} onChange={(e) => setBonuses(Number(e.target.value))} className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Deductions</label>
                    <input type="number" value={deductions} onChange={(e) => setDeductions(Number(e.target.value))} className="ds-input" />
                  </div>
                </div>
                <button onClick={handleCalculate} className="ds-btn ds-btn-secondary w-full mt-2">
                  <Calculator size={14} /> Calculate Preview
                </button>
              </div>
            </div>

            <div className="ds-card">
              <div className="ds-card-header">
                <h2 className="ds-card-title">Salary Preview</h2>
              </div>
              <div className="ds-card-body">
                {!preview ? (
                  <div className="ds-empty">
                    <CreditCard size={48} className="mx-auto mb-4 text-slate-200" />
                    <p>Select an employee and calculate to see preview</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 mb-2">
                      <p className="text-sm font-bold text-slate-500 mb-1">Employee</p>
                      <p className="font-bold text-xl">{preview.employeeName}</p>
                      <p className="text-xs font-mono">{month}/{year}</p>
                    </div>
                    <div className="space-y-2 text-sm border-t pt-4">
                      <div className="flex justify-between"><span>Basic Salary</span><span className="font-bold">Rs. {preview.basicSalary.toLocaleString()}</span></div>
                      {preview.allowances > 0 && <div className="flex justify-between"><span>Allowances</span><span className="font-bold text-emerald-600">+ Rs. {preview.allowances.toLocaleString()}</span></div>}
                      {preview.overtimePay > 0 && <div className="flex justify-between"><span>Overtime</span><span className="font-bold text-emerald-600">+ Rs. {preview.overtimePay.toLocaleString()}</span></div>}
                      {preview.targetBonus > 0 && <div className="flex justify-between"><span>Target Incentive</span><span className="font-bold text-emerald-600">+ Rs. {preview.targetBonus.toLocaleString()}</span></div>}
                      {preview.bonuses > 0 && <div className="flex justify-between"><span>Custom Bonuses</span><span className="font-bold text-emerald-600">+ Rs. {preview.bonuses.toLocaleString()}</span></div>}
                      <div className="h-px bg-slate-200 w-full my-2"></div>
                      <div className="flex justify-between"><span>Gross Salary</span><span className="font-bold">Rs. {preview.grossSalary.toLocaleString()}</span></div>
                      <div className="h-px bg-slate-200 w-full my-2"></div>
                      <div className="flex justify-between"><span>EPF Employee (8%)</span><span className="font-bold text-rose-500">- Rs. {preview.epfEmployee.toLocaleString()}</span></div>
                      {preview.otherDeductions > 0 && <div className="flex justify-between"><span>Other Deductions</span><span className="font-bold text-rose-500">- Rs. {preview.otherDeductions.toLocaleString()}</span></div>}
                      {preview.attendanceDeductions > 0 && <div className="flex justify-between"><span>Attendance Deductions</span><span className="font-bold text-rose-500">- Rs. {preview.attendanceDeductions.toLocaleString()}</span></div>}
                      {preview.cashierRecoveryDeduction > 0 && <div className="flex justify-between"><span>Cashier Shortage Recovery</span><span className="font-bold text-rose-500">- Rs. {preview.cashierRecoveryDeduction.toLocaleString()}</span></div>}
                      {preview.advanceDeduction > 0 && <div className="flex justify-between"><span>Salary Advances</span><span className="font-bold text-rose-500">- Rs. {preview.advanceDeduction.toLocaleString()}</span></div>}
                      <div className="h-px bg-slate-200 w-full my-2"></div>
                      <div className="flex justify-between items-end mt-4"><span>Net Salary</span><span className="text-2xl font-bold text-emerald-600">Rs. {preview.netSalary.toLocaleString()}</span></div>
                      
                      {/* EPF/ETF Breakdown */}
                      <div className="bg-amber-50 rounded-lg p-4 mt-4">
                        <p className="text-xs font-bold text-amber-700 mb-2">Statutory Contributions (Employer)</p>
                        <div className="flex justify-between text-xs"><span>EPF Employer (12%)</span><span className="font-bold">Rs. {preview.epfEmployer.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs mt-1"><span>ETF Employer (3%)</span><span className="font-bold">Rs. {preview.etfEmployer.toLocaleString()}</span></div>
                      </div>
                    </div>
                    <button onClick={handleProcess} className="ds-btn ds-btn-primary w-full mt-4"><Send size={14} /> Process & Send Notification</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'report' && (
          <div className="ds-card">
            <div className="ds-card-header">
              <h2 className="ds-card-title">Payroll Report — {month}/{year}</h2>
              {report && <span className="text-xs text-slate-500 ml-4">{report.count} records generated</span>}
            </div>
            
            {!report || report.payrolls.length === 0 ? (
              <div className="ds-card-body">
                <div className="ds-empty">
                  <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                  <p>No payroll records for this month</p>
                </div>
              </div>
            ) : (
              <>
                <div className="ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th className="text-right">Basic</th>
                        <th className="text-right">Gross</th>
                        <th className="text-right">EPF 8%</th>
                        <th className="text-right">EPF 12%</th>
                        <th className="text-right">ETF 3%</th>
                        <th className="text-right">Net</th>
                        <th className="text-center">Status</th>
                        <th className="text-right">Paysheet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.payrolls.map(p => (
                        <tr key={p._id}>
                          <td className="font-bold">{p.employeeId?.name}</td>
                          <td className="text-right">Rs. {p.basicSalary?.toLocaleString()}</td>
                          <td className="text-right font-bold">Rs. {p.grossSalary?.toLocaleString()}</td>
                          <td className="text-right text-rose-500">Rs. {p.epfEmployee?.toLocaleString()}</td>
                          <td className="text-right text-amber-600">Rs. {p.epfEmployer?.toLocaleString()}</td>
                          <td className="text-right text-amber-600">Rs. {p.etfEmployer?.toLocaleString()}</td>
                          <td className="text-right font-bold text-emerald-600">Rs. {p.netSalary?.toLocaleString()}</td>
                          <td className="text-center">
                            <span className="ds-badge ds-badge-green">
                              {p.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <button onClick={() => handleDownloadPaysheet(p)} className="ds-btn ds-btn-sm ds-btn-ghost">
                              <Download size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="ds-card-body border-t bg-slate-50">
                  <div className="ds-stats grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="ds-stat">
                      <div className="ds-stat-label">Total Gross</div>
                      <div className="ds-stat-value">Rs. {report.totals.totalGross.toLocaleString()}</div>
                    </div>
                    <div className="ds-stat">
                      <div className="ds-stat-label">Total Net</div>
                      <div className="ds-stat-value text-emerald-600">Rs. {report.totals.totalNet.toLocaleString()}</div>
                    </div>
                    <div className="ds-stat">
                      <div className="ds-stat-label">EPF Employee</div>
                      <div className="ds-stat-value text-rose-500">Rs. {report.totals.totalEPFEmployee.toLocaleString()}</div>
                    </div>
                    <div className="ds-stat">
                      <div className="ds-stat-label">EPF Employer</div>
                      <div className="ds-stat-value text-amber-600">Rs. {report.totals.totalEPFEmployer.toLocaleString()}</div>
                    </div>
                    <div className="ds-stat">
                      <div className="ds-stat-label">ETF Employer</div>
                      <div className="ds-stat-value text-amber-600">Rs. {report.totals.totalETF.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'epf' && (
          <div className="space-y-6">
            <div className="ds-stats grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="ds-stat bg-white p-6 rounded-lg border shadow-sm">
                <div className="ds-stat-label text-slate-500">EPF Employee (8%)</div>
                <div className="ds-stat-value text-3xl font-bold">Rs. {(report?.totals?.totalEPFEmployee || 0).toLocaleString()}</div>
                <div className="ds-stat-sub text-rose-500 mt-2">Deducted from employee salary</div>
              </div>
              <div className="ds-stat bg-white p-6 rounded-lg border shadow-sm">
                <div className="ds-stat-label text-slate-500">EPF Employer (12%)</div>
                <div className="ds-stat-value text-3xl font-bold">Rs. {(report?.totals?.totalEPFEmployer || 0).toLocaleString()}</div>
                <div className="ds-stat-sub text-amber-600 mt-2">Contributed by employer</div>
              </div>
              <div className="ds-stat bg-white p-6 rounded-lg border shadow-sm">
                <div className="ds-stat-label text-slate-500">ETF Employer (3%)</div>
                <div className="ds-stat-value text-3xl font-bold">Rs. {(report?.totals?.totalETF || 0).toLocaleString()}</div>
                <div className="ds-stat-sub text-emerald-600 mt-2">Employment Trust Fund</div>
              </div>
            </div>

            <div className="ds-card">
              <div className="ds-card-header">
                <h2 className="ds-card-title">Total Employer Liability</h2>
              </div>
              <div className="ds-card-body">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-slate-500">Total Gross</p>
                    <p className="font-bold text-lg">Rs. {(report?.totals?.totalGross || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-amber-600">EPF (8%+12%)</p>
                    <p className="font-bold text-lg text-amber-900">Rs. {((report?.totals?.totalEPFEmployee || 0) + (report?.totals?.totalEPFEmployer || 0)).toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-emerald-600">ETF (3%)</p>
                    <p className="font-bold text-lg text-emerald-900">Rs. {(report?.totals?.totalETF || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-xs font-bold text-indigo-600">Total Cost to Company</p>
                    <p className="font-bold text-lg text-indigo-900">Rs. {((report?.totals?.totalGross || 0) + (report?.totals?.totalEPFEmployer || 0) + (report?.totals?.totalETF || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="ds-card">
                <div className="ds-card-header">
                  <h2 className="ds-card-title">Salary & Contributions Breakdown</h2>
                </div>
                <div className="ds-card-body h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(val) => `Rs.${val/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                        cursor={{fill: '#f8fafc'}}
                        formatter={(v) => `Rs. ${v.toLocaleString()}`} 
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }} />
                      <Bar dataKey="net" fill="#10b981" name="Net Salary" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="epfEmp" fill="#f43f5e" name="EPF 8%" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="epfEmployer" fill="#f59e0b" name="EPF 12%" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="etf" fill="#0ea5e9" name="ETF 3%" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerPayroll;
