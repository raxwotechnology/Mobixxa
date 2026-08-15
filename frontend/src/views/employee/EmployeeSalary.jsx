'use client';

import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, FileText, DollarSign, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API, { exportSalaryHistory } from '../../services/api';
import { toast } from 'react-toastify';
import EmployeePageHeader, { EmployeeLoading } from './EmployeePageHeader';

const EmployeeSalary = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const downloadSalaryReport = async (format) => {
    try {
      const { data } = await exportSalaryHistory('me', { format });
      const blob = new Blob([data], {
        type: format === 'pdf'
          ? 'application/pdf'
          : format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Salary report exported (${format.toUpperCase()})`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export salary report');
    }
  };

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const { data } = await API.get('/payroll/history/me');
        setHistory(data);
        if (data.length > 0) setSelectedRecord(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, []);

  const basicSalary = user?.employeeInfo?.salary || 0;
  const epfEmployee = Math.round(basicSalary * 0.08);
  const epfEmployer = Math.round(basicSalary * 0.12);
  const etfEmployer = Math.round(basicSalary * 0.03);

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="PAYROLL"
          title="Salary & EPF/ETF"
          subtitle="View pay logs, contributions, and payslips"
          icon={CreditCard}
          actions={
            <>
              <button
                onClick={() => downloadSalaryReport('pdf')}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <FileText size={14} /> PDF
              </button>
              <button
                onClick={() => downloadSalaryReport('xlsx')}
                className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
            </>
          }
        />

        {/* Salary Overview Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia rounded-[2rem] p-8 text-white shadow-lg border border-slate-200/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <p className="text-white/80 text-[10px] font-black uppercase tracking-wider m-0">Basic Monthly Salary</p>
              <p className="text-3xl md:text-4xl font-black m-0 mt-1">Rs. {basicSalary.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
              <DollarSign size={26} />
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-wider m-0">Net Take-Home</p>
              <p className="text-xl font-extrabold m-0 mt-1">Rs. {(basicSalary - epfEmployee).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-wider m-0">Total EPF (You + Employer)</p>
              <p className="text-xl font-extrabold m-0 mt-1">Rs. {(epfEmployee + epfEmployer).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-wider m-0">ETF (Employer)</p>
              <p className="text-xl font-extrabold m-0 mt-1">Rs. {etfEmployer.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* EPF/ETF Breakdown */}
        <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 m-0 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText size={16} /> Monthly EPF/ETF Breakdown
          </h3>
          <div className="space-y-3 font-semibold text-slate-700 text-xs">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <span className="text-slate-500">Basic Salary</span>
              <span className="font-extrabold text-slate-900 text-sm">Rs. {basicSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <div>
                <span className="text-rose-500">EPF - Employee Contribution (8%)</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 m-0">Deducted from your salary</p>
              </div>
              <span className="font-extrabold text-rose-500">- Rs. {epfEmployee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-emerald-50/20 -mx-4 px-4 rounded-xl border border-emerald-100/50">
              <div>
                <span className="text-emerald-700">EPF - Employer Contribution (12%)</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 m-0">Paid by employer to your EPF account</p>
              </div>
              <span className="font-extrabold text-emerald-600">+ Rs. {epfEmployer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-brand-indigo/5 -mx-4 px-4 rounded-xl border border-brand-indigo/10">
              <div>
                <span className="text-brand-indigo">ETF - Employer Contribution (3%)</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 m-0">Paid by employer to your ETF account</p>
              </div>
              <span className="font-extrabold text-brand-indigo">+ Rs. {etfEmployer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-t border-slate-200 mt-4">
              <span className="font-black text-slate-900 uppercase tracking-wide text-xs">Net Salary (Take-Home)</span>
              <span className="text-2xl font-black text-brand-indigo">Rs. {(basicSalary - epfEmployee).toLocaleString()}</span>
            </div>
          </div>

          {/* EPF/ETF Numbers */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">EPF Number</p>
              <p className="font-extrabold text-slate-800 m-0">{user?.employeeInfo?.epfNo || 'Not assigned'}</p>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">ETF Number</p>
              <p className="font-extrabold text-slate-800 m-0">{user?.employeeInfo?.etfNo || 'Not assigned'}</p>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 m-0 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
            <TrendingUp size={16} /> Payment History
          </h3>
          {history.length === 0 ? (
            <p className="text-center text-slate-400 text-xs font-semibold py-12">No salary records yet</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1 overscroll-x-contain [scrollbar-width:thin]">
              <div className="min-w-[720px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Basic</th>
                    <th className="py-3 px-4 text-right">EPF (You)</th>
                    <th className="py-3 px-4 text-right">EPF (Employer)</th>
                    <th className="py-3 px-4 text-right">ETF</th>
                    <th className="py-3 px-4 text-right">Net Salary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {history.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedRecord(record)}>
                      <td className="py-3.5 px-4 text-slate-900 font-extrabold">
                        {new Date(0, record.month - 1).toLocaleString('en', { month: 'short' })} {record.year}
                      </td>
                      <td className="py-3.5 px-4 text-right">Rs. {record.basicSalary?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-rose-500">-{record.epfEmployee?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-600">+{record.epfEmployer?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-brand-indigo">+{record.etfEmployer?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">Rs. {record.netSalary?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {record.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Record Detail */}
        {selectedRecord && (
          <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 m-0 mb-4 pb-2 border-b border-slate-100">
              Payslip: {new Date(0, selectedRecord.month - 1).toLocaleString('en', { month: 'long' })} {selectedRecord.year}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Basic</p>
                <p className="font-extrabold text-slate-800 m-0">Rs. {selectedRecord.basicSalary?.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Allowances</p>
                <p className="font-extrabold text-slate-800 m-0">Rs. {(selectedRecord.allowances || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Bonuses</p>
                <p className="font-extrabold text-slate-800 m-0">Rs. {(selectedRecord.bonuses || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">Gross</p>
                <p className="font-extrabold text-slate-800 m-0">Rs. {selectedRecord.grossSalary?.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 m-0 mb-1">EPF Deduction (8%)</p>
                <p className="font-extrabold text-rose-600 m-0">- Rs. {selectedRecord.epfEmployee?.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 m-0 mb-1">EPF Employer (12%)</p>
                <p className="font-extrabold text-emerald-600 m-0">+ Rs. {selectedRecord.epfEmployer?.toLocaleString()}</p>
              </div>
              <div className="bg-brand-indigo/5 border border-brand-indigo/10 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-indigo m-0 mb-1">ETF Employer (3%)</p>
                <p className="font-extrabold text-brand-indigo m-0">+ Rs. {selectedRecord.etfEmployer?.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-100 border border-emerald-200 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 m-0 mb-1">Net Salary</p>
                <p className="font-black text-lg text-emerald-800 m-0">Rs. {selectedRecord.netSalary?.toLocaleString()}</p>
              </div>
            </div>
            {selectedRecord.paidAt && (
              <p className="text-[10px] font-bold text-slate-400 mt-4 m-0 uppercase tracking-wide">Paid on: {new Date(selectedRecord.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeSalary;
