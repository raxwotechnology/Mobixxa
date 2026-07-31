import { useState, useEffect } from 'react';
import { Calculator, Send, FileText, CreditCard, Download, Landmark } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Chart data from report
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
      ['Employee', 'Basic', 'Allowances', 'Bonuses', 'Gross', 'EPF Employee (8%)', 'EPF Employer (12%)', 'ETF Employer (3%)', 'Deductions', 'Net Salary', 'Status'].join(','),
      ...report.payrolls.map(p => [p.employeeId?.name, p.basicSalary, p.allowances, p.bonuses, p.grossSalary, p.epfEmployee, p.epfEmployer, p.etfEmployer, p.otherDeductions, p.netSalary, p.status].join(','))
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

  if (loading) return <DashboardLayout navItems={navItems} title={title}><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <span className="text-lg">💰</span>
              </div>
              Payroll Management
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Process salaries with Sri Lankan EPF/ETF compliance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-max">
          <button onClick={() => setTab('process')} className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${tab === 'process' ? 'bg-white text-brand-indigo shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transparent border border-transparent'}`}><Calculator size={14} strokeWidth={2.5} /> Process Salary</button>
          <button onClick={() => { setTab('report'); handleFetchReport(); }} className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${tab === 'report' ? 'bg-white text-brand-indigo shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transparent border border-transparent'}`}><FileText size={14} strokeWidth={2.5} /> Monthly Report</button>
          <button onClick={() => { setTab('epf'); handleFetchReport(); }} className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${tab === 'epf' ? 'bg-white text-brand-indigo shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transparent border border-transparent'}`}><CreditCard size={14} strokeWidth={2.5} /> EPF/ETF Summary</button>
        </div>

        {tab === 'process' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Salary Form */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <Calculator size={18} className="text-brand-indigo" strokeWidth={2.5} /> Calculate Salary
              </h2>
              <div className="space-y-5">
                <div className="relative text-left">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Employee</label>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo flex items-center justify-between cursor-pointer shadow-sm hover:border-brand-indigo/50 transition-colors"
                  >
                    {(() => {
                      const selectedEmp = employees.find(e => e._id === selected);
                      return (
                        <span className={selectedEmp ? "text-slate-800" : "text-slate-400"}>
                          {selectedEmp
                            ? `${selectedEmp.name} (${selectedEmp.role}) — Rs. ${(selectedEmp.employeeInfo?.salary || 0).toLocaleString()}`
                            : "Select employee"}
                        </span>
                      );
                    })()}
                    <span className="text-slate-400 text-xs">▼</span>
                  </div>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute left-0 right-0 mt-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                        <input
                          type="text"
                          placeholder="Search by name or role..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 mb-2 font-medium"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                          {(() => {
                            const filteredEmployees = employees.filter(e =>
                              (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (e.role || '').toLowerCase().includes(searchTerm.toLowerCase())
                            );
                            if (filteredEmployees.length === 0) {
                              return <div className="text-center py-4 text-xs font-bold text-slate-400">No employees found</div>;
                            }
                            return filteredEmployees.map((e) => (
                              <div
                                key={e._id}
                                onClick={() => {
                                  setSelected(e._id);
                                  setIsDropdownOpen(false);
                                  setSearchTerm('');
                                }}
                                className={`p-3 rounded-xl cursor-pointer transition-all text-left ${
                                  selected === e._id
                                    ? 'bg-brand-indigo text-white font-semibold shadow-md'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="text-sm font-bold">{e.name}</div>
                                <div className={`text-[10px] font-black uppercase tracking-wider mt-1 ${selected === e._id ? 'text-indigo-200' : 'text-slate-500'}`}>
                                  {e.role} • Rs. {(e.employeeInfo?.salary || 0).toLocaleString()}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Month</label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm cursor-pointer">
                      {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en', {month: 'long'})}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Year</label>
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Allowances</label>
                    <input type="number" value={allowances} onChange={(e) => setAllowances(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Bonuses</label>
                    <input type="number" value={bonuses} onChange={(e) => setBonuses(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Deductions</label>
                    <input type="number" value={deductions} onChange={(e) => setDeductions(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm" />
                  </div>
                </div>
                <button onClick={handleCalculate} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] uppercase tracking-wider font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group mt-2">
                  <Calculator size={14} className="group-hover:rotate-12 transition-transform" /> Calculate Preview
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-5 relative z-10 flex items-center gap-2">
                 Salary Preview
              </h2>
              {!preview ? (
                <div className="text-center py-16 text-slate-400 relative z-10">
                  <CreditCard size={48} strokeWidth={1} className="mx-auto mb-4 text-slate-200" />
                  <p className="text-sm font-bold">Select an employee and calculate to see preview</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">Employee</p>
                    <p className="font-black text-slate-900 text-xl">{preview.employeeName}</p>
                    <p className="text-[10px] font-bold text-emerald-700 font-mono tracking-widest">{month}/{year}</p>
                  </div>
                  <div className="space-y-3 text-sm bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Basic Salary</span><span className="font-black text-slate-900 text-base">Rs. {preview.basicSalary.toLocaleString()}</span></div>
                    {preview.allowances > 0 && <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Allowances</span><span className="font-black text-emerald-600">+ Rs. {preview.allowances.toLocaleString()}</span></div>}
                    {preview.bonuses > 0 && <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Bonuses</span><span className="font-black text-emerald-600">+ Rs. {preview.bonuses.toLocaleString()}</span></div>}
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Gross Salary</span><span className="font-black text-slate-900 text-base">Rs. {preview.grossSalary.toLocaleString()}</span></div>
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">EPF Employee (8%)</span><span className="font-black text-rose-500">- Rs. {preview.epfEmployee.toLocaleString()}</span></div>
                    {preview.otherDeductions > 0 && <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Other Deductions</span><span className="font-black text-rose-500">- Rs. {preview.otherDeductions.toLocaleString()}</span></div>}
                    {preview.attendanceDeductions > 0 && <div className="flex justify-between items-center"><span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Attendance Deductions</span><span className="font-black text-rose-500">- Rs. {preview.attendanceDeductions.toLocaleString()}</span></div>}
                    <div className="h-px bg-slate-200 w-full my-2"></div>
                    <div className="flex justify-between items-end mt-4"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Salary</span><span className="text-3xl font-black tracking-tight text-emerald-600">Rs. {preview.netSalary.toLocaleString()}</span></div>
                    
                    {/* EPF/ETF Breakdown */}
                    <div className="bg-amber-50/50 rounded-xl p-4 mt-6 border border-amber-100/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-1.5"><Landmark size={12} /> Statutory Contributions (Employer)</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">EPF Employer (12%)</span><span className="font-black text-amber-800">Rs. {preview.epfEmployer.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">ETF Employer (3%)</span><span className="font-black text-amber-800">Rs. {preview.etfEmployer.toLocaleString()}</span></div>
                      </div>
                      <div className="h-px bg-amber-200/50 w-full my-3"></div>
                      <div className="flex justify-between items-center"><span className="text-[11px] font-black tracking-wider text-amber-800 uppercase">Total Employer Cost</span><span className="font-black text-amber-900 text-base">Rs. {(preview.grossSalary + preview.epfEmployer + preview.etfEmployer).toLocaleString()}</span></div>
                    </div>
                  </div>
                  <button onClick={handleProcess} className="w-full bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black py-4 rounded-xl transition-all shadow-lg shadow-brand-indigo/20 flex items-center justify-center gap-2 mt-4 hover:shadow-xl hover:-translate-y-0.5"><Send size={14} /> Process & Send Notification</button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'report' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Payroll Report — {month}/{year}</h2>
                {report && <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block">{report.count} records generated</span>}
              </div>
              {report?.payrolls?.length > 0 && <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"><Download size={14} strokeWidth={2.5} /> Export CSV</button>}
            </div>
            {!report || report.payrolls.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <FileText size={48} strokeWidth={1} className="mx-auto mb-4 text-slate-200" />
                <p className="text-sm font-bold">No payroll records for this month</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-5">Employee</th>
                        <th className="px-4 py-5 text-right">Basic</th>
                        <th className="px-4 py-5 text-right">Gross</th>
                        <th className="px-4 py-5 text-right text-rose-500">EPF 8%</th>
                        <th className="px-4 py-5 text-right text-amber-600">EPF 12%</th>
                        <th className="px-4 py-5 text-right text-amber-600">ETF 3%</th>
                        <th className="px-4 py-5 text-right text-brand-indigo">Net</th>
                        <th className="px-4 py-5 text-center">Status</th>
                        <th className="px-6 py-5 text-right">Paysheet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.payrolls.map(p => (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800">{p.employeeId?.name}</td>
                          <td className="px-4 py-4 text-right font-bold text-slate-600">Rs. {p.basicSalary?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-black text-slate-900">Rs. {p.grossSalary?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-bold text-rose-500">Rs. {p.epfEmployee?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-bold text-amber-600">Rs. {p.epfEmployer?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-bold text-amber-600">Rs. {p.etfEmployer?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-black text-emerald-600 tracking-tight text-base">Rs. {p.netSalary?.toLocaleString()}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDownloadPaysheet(p)} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black transition-colors border border-slate-200/50">
                              <Download size={12} strokeWidth={2.5} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Totals */}
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Gross</p><p className="font-black text-slate-900 text-lg tracking-tight">Rs. {report.totals.totalGross.toLocaleString()}</p></div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Net</p><p className="font-black text-emerald-600 text-lg tracking-tight">Rs. {report.totals.totalNet.toLocaleString()}</p></div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-1">EPF Employee</p><p className="font-black text-rose-600 text-lg tracking-tight">Rs. {report.totals.totalEPFEmployee.toLocaleString()}</p></div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">EPF Employer</p><p className="font-black text-amber-600 text-lg tracking-tight">Rs. {report.totals.totalEPFEmployer.toLocaleString()}</p></div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">ETF Employer</p><p className="font-black text-amber-600 text-lg tracking-tight">Rs. {report.totals.totalETF.toLocaleString()}</p></div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'epf' && (
          <div className="space-y-6">
            {/* EPF/ETF Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">EPF Employee (8%)</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">Rs. {(report?.totals?.totalEPFEmployee || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-rose-500 mt-3 uppercase tracking-wider bg-rose-50 w-max px-2 py-1 rounded-md">Deducted from employee salary</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">EPF Employer (12%)</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">Rs. {(report?.totals?.totalEPFEmployer || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-amber-600 mt-3 uppercase tracking-wider bg-amber-50 w-max px-2 py-1 rounded-md">Contributed by employer</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform"></div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">ETF Employer (3%)</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">Rs. {(report?.totals?.totalETF || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-emerald-600 mt-3 uppercase tracking-wider bg-emerald-50 w-max px-2 py-1 rounded-md">Employment Trust Fund</p>
              </div>
            </div>

            {/* Total Employer Liability */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                 📊 Total Employer Liability
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Total Gross</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">Rs. {(report?.totals?.totalGross || 0).toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">EPF (8%+12%)</p>
                  <p className="text-xl font-black text-amber-900 tracking-tight">Rs. {((report?.totals?.totalEPFEmployee || 0) + (report?.totals?.totalEPFEmployer || 0)).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-1">ETF (3%)</p>
                  <p className="text-xl font-black text-emerald-900 tracking-tight">Rs. {(report?.totals?.totalETF || 0).toLocaleString()}</p>
                </div>
                <div className="bg-brand-indigo/5 rounded-2xl p-5 border border-brand-indigo/10">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-indigo mb-1">Total Cost to Company</p>
                  <p className="text-xl font-black text-indigo-900 tracking-tight">Rs. {((report?.totals?.totalGross || 0) + (report?.totals?.totalEPFEmployer || 0) + (report?.totals?.totalETF || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                  📈 Salary & Contributions Breakdown
                </h2>
                <div className="h-[350px] w-full mt-4">
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

            {/* Sri Lankan Compliance Info */}
            <div className="bg-brand-indigo/5 rounded-3xl p-6 border border-brand-indigo/10 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Landmark size={150} />
              </div>
              <h3 className="text-sm font-black text-brand-indigo mb-4 uppercase tracking-wider flex items-center gap-2">🇱🇰 Sri Lankan Statutory Compliance</h3>
              <div className="grid sm:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white">
                  <p className="font-black text-slate-800 mb-2">EPF (Employees' Provident Fund)</p>
                  <p className="text-xs font-bold text-slate-600 mb-1">Employee: <span className="text-rose-500">8%</span> of gross salary</p>
                  <p className="text-xs font-bold text-slate-600 mb-2">Employer: <span className="text-amber-600">12%</span> of gross salary</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-2 text-brand-indigo bg-brand-indigo/10 px-2 py-1 rounded w-max">Total: 20% goes to EPF</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white">
                  <p className="font-black text-slate-800 mb-2">ETF (Employees' Trust Fund)</p>
                  <p className="text-xs font-bold text-slate-600 mb-2">Employer: <span className="text-emerald-600">3%</span> of gross salary</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded w-max">Entirely employer-borne</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white">
                  <p className="font-black text-slate-800 mb-2">Payment Deadlines</p>
                  <p className="text-xs font-bold text-slate-600 mb-1">EPF: Before 15th of next month</p>
                  <p className="text-xs font-bold text-slate-600 mb-2">ETF: Before 15th of next month</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-2 text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded w-max">Penalties for late payments apply</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerPayroll;
