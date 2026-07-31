import { useState, useEffect } from 'react';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getEmployeeNavGroups } from './employeeNav';
import { getMyOvertime } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import EmployeePageHeader, { EmployeeStatCard, EmployeeLoading, EmployeeTableWrap } from './EmployeePageHeader';

const EmployeeOvertime = () => {
  const user = useAuthStore((s) => s.user);
  const navItems = getEmployeeNavGroups(user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getMyOvertime();
        setData(res.data);
      } catch {
        toast.error('Failed to load OT records');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Employee Portal">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  const records = data?.records || [];
  const summary = data?.summary || { totalHours: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, recordCount: 0 };

  return (
    <DashboardLayout navItems={navItems} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="PAYROLL & OT"
          title="My Overtime"
          subtitle="Track overtime hours and payout approvals"
          icon={Clock}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <EmployeeStatCard label="Total OT Hours" value={`${summary.totalHours.toFixed(1)}h`} icon={Clock} />
          <EmployeeStatCard label="Total OT Pay" value={`Rs. ${summary.totalAmount.toLocaleString()}`} icon={DollarSign} />
          <EmployeeStatCard label="Paid Amount" value={`Rs. ${summary.paidAmount.toLocaleString()}`} color="text-emerald-600" icon={CheckCircle} iconBg="bg-emerald-50 border-emerald-100/60" iconColor="text-emerald-600" />
          <EmployeeStatCard label="Pending Amount" value={`Rs. ${summary.pendingAmount.toLocaleString()}`} color="text-amber-600" icon={DollarSign} iconBg="bg-amber-50 border-amber-100/60" iconColor="text-amber-600" />
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-xs sm:text-sm m-0 uppercase tracking-wider">OT Records ({summary.recordCount})</h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 m-0">Breakdown of overtime hours worked per date</p>
          </div>
          <EmployeeTableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">Hours</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">Rate/Hr</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">Amount</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-black text-slate-900 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-slate-700">{r.hours}h</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-slate-700">Rs. {r.ratePerHour}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-black text-slate-900 whitespace-nowrap">Rs. {r.totalAmount.toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status === 'paid' ? 'Paid' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-slate-500 font-medium">{r.description || '—'}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-black text-slate-400 text-[11px] uppercase tracking-wider">
                      No overtime records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </EmployeeTableWrap>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeOvertime;
