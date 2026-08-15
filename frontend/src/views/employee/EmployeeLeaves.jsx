'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API from '../../services/api';
import { toast } from 'react-toastify';
import EmployeePageHeader, { EmployeeStatCard, EmployeeLoading } from './EmployeePageHeader';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusIcons = {
  pending: AlertCircle,
  approved: CheckCircle,
  rejected: XCircle,
};

const EmployeeLeaves = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = async () => {
    try {
      const { data } = await API.get('/hr/leaves');
      setLeaves(data);
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/hr/leaves', form);
      toast.success('Leave request submitted! 📋');
      setShowForm(false);
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const approved = leaves.filter(l => l.status === 'approved');
  const usedDays = approved.reduce((sum, l) => sum + (l.totalDays || 0), 0);
  const pending = leaves.filter(l => l.status === 'pending');

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
          badge="LEAVE MANAGEMENT"
          title="Leave Requests"
          subtitle="Apply for time off and track request statuses"
          icon={Calendar}
          actions={
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-md border-0 cursor-pointer"
            >
              <Plus size={14} /> Request Leave
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <EmployeeStatCard label="Total Allowance" value="14 Days" icon={Calendar} />
          <EmployeeStatCard label="Remaining" value={`${Math.max(0, 14 - usedDays)} Days`} color="text-emerald-600" icon={CheckCircle} iconBg="bg-emerald-50 border-emerald-100/60" iconColor="text-emerald-600" />
          <EmployeeStatCard label="Used" value={`${usedDays} Days`} color="text-brand-indigo" icon={Calendar} />
          <EmployeeStatCard label="Pending" value={pending.length} color="text-amber-600" icon={AlertCircle} iconBg="bg-amber-50 border-amber-100/60" iconColor="text-amber-600" />
        </div>

        {/* Leave Request Form */}
        {showForm && (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0 mb-4 pb-2 border-b border-slate-100">New Leave Request</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Leave Type</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35 cursor-pointer">
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div />
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})}
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})}
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reason</label>
                <textarea rows={3} value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})}
                  className="w-full border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/35 resize-none placeholder:text-slate-400" placeholder="Explain your reason..." />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 cursor-pointer border-0 bg-transparent">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-black text-[10px] uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 m-0">Leave History</h3>
          </div>
          <div className="p-6">
            {leaves.length === 0 ? (
              <p className="text-center text-slate-400 text-[11px] font-black uppercase tracking-wider py-12 m-0">No leave requests yet</p>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => {
                  const Icon = statusIcons[leave.status] || AlertCircle;
                  return (
                    <div key={leave._id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusColors[leave.status] || 'bg-gray-100 text-gray-700'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 capitalize">{leave.leaveType || leave.type} Leave</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColors[leave.status] || 'bg-gray-100 text-gray-700'}`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 mb-1 uppercase tracking-wide">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})
                        </p>
                        <p className="text-xs text-slate-600 font-semibold m-0">{leave.reason}</p>
                        {leave.rejectionReason && (
                          <p className="text-xs text-rose-500 font-bold m-0 mt-2">
                            Rejection: {leave.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeaves;
