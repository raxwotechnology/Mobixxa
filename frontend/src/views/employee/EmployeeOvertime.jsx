'use client';

import { useState, useEffect } from 'react';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getEmployeeNavGroups } from './employeeNav';
import { getMyOvertime } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
import { EmployeeStatCard, EmployeeLoading } from './EmployeePageHeader';

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
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Clock size={11} /> Overtime
            </span>
            <h1>Overtime Records</h1>
            <p>Track overtime hours and payout approvals</p>
          </div>
        </div>

        <div className="ds-stats grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <EmployeeStatCard label="Total OT Hours" value={`${summary.totalHours.toFixed(1)}h`} icon={Clock} />
          <EmployeeStatCard label="Total OT Pay" value={`Rs. ${summary.totalAmount.toLocaleString()}`} icon={DollarSign} />
          <EmployeeStatCard label="Paid Amount" value={`Rs. ${summary.paidAmount.toLocaleString()}`} color="text-emerald-600" icon={CheckCircle} iconBg="bg-emerald-50 border-emerald-100/60" iconColor="text-emerald-600" />
          <EmployeeStatCard label="Pending Amount" value={`Rs. ${summary.pendingAmount.toLocaleString()}`} color="text-amber-600" icon={DollarSign} iconBg="bg-amber-50 border-amber-100/60" iconColor="text-amber-600" />
        </div>

        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title">OT Records ({summary.recordCount})</h3>
            <p className="text-xs text-slate-400 m-0">Breakdown of overtime hours worked per date</p>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Hours</th>
                  <th className="text-right">Rate/Hr</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-right font-bold text-slate-700">{r.hours}h</td>
                    <td className="text-right font-bold text-slate-700">Rs. {r.ratePerHour}</td>
                    <td className="text-right font-bold text-slate-900">Rs. {r.totalAmount.toLocaleString()}</td>
                    <td className="text-center">
                      <span className={`ds-badge ${r.status === 'paid' ? 'ds-badge-green' : r.status === 'rejected' ? 'ds-badge-red' : 'ds-badge-amber'}`}>
                        {r.status === 'paid' ? 'Paid' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 font-medium">{r.description || '—'}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="ds-empty">
                      No overtime records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeOvertime;
