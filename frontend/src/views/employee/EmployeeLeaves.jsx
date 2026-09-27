'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileDown, Calendar, AlertCircle, Plus, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API, { getAttendanceSummary } from '../../services/api';
import { toast } from 'react-toastify';
import EmployeePageHeader, { EmployeeStatCard, EmployeeLoading } from './EmployeePageHeader';

const statusColors = {
  pending: 'ds-badge ds-badge-amber',
  approved: 'ds-badge ds-badge-green',
  rejected: 'ds-badge ds-badge-red',
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
  const [summary, setSummary] = useState(null);

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

  const fetchSummary = async () => {
    try {
      const now = new Date();
      const { data } = await getAttendanceSummary('me', { month: now.getMonth() + 1, year: now.getFullYear() });
      setSummary(data);
    } catch (err) {
      // Non-fatal — the request form and history still work without the balance card.
    }
  };

  useEffect(() => { fetchLeaves(); fetchSummary(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/hr/leaves', form);
      toast.success('Leave request submitted!');
      setShowForm(false);
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = leaves.filter(l => l.status === 'pending');
  const allowedLeaves = summary?.allowedLeaves ?? 0;
  const usedDays = summary?.leaveDaysTaken ?? 0;
  const remainingDays = Math.max(0, allowedLeaves - usedDays);

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <EmployeeLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Calendar size={11} /> LEAVE MANAGEMENT
            </span>
            <h1>Leave Requests</h1>
            <p>Apply for time off and track request statuses</p>
          </div>
          <div className="ds-page-header-right">
            <button
              onClick={() => setShowForm(!showForm)}
              className="ds-btn ds-btn-primary"
            >
              <Plus size={14} /> Request Leave
            </button>
          </div>
        </div>

        <div className="ds-stats grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <EmployeeStatCard label="Allowance (This Period)" value={`${allowedLeaves} Days`} icon={Calendar} />
          <EmployeeStatCard label="Remaining" value={`${remainingDays} Days`} color="text-emerald-600" icon={CheckCircle} iconBg="bg-emerald-50 border-emerald-100/60" iconColor="text-emerald-600" />
          <EmployeeStatCard label="Used" value={`${usedDays} Days`} color="text-brand-indigo" icon={Calendar} />
          <EmployeeStatCard label="Pending" value={pending.length} color="text-amber-600" icon={AlertCircle} iconBg="bg-amber-50 border-amber-100/60" iconColor="text-amber-600" />
        </div>

        {/* Leave Request Form */}
        {showForm && (
          <div className="ds-card mb-6">
            <div className="ds-card-header">
              <h3 className="ds-card-title">New Leave Request</h3>
            </div>
            <div className="ds-card-body">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="ds-form-group">
                  <label className="ds-label">Leave Type</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="ds-select w-full">
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div />
                <div className="ds-form-group">
                  <label className="ds-label">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} className="ds-input" />
                </div>
                <div className="ds-form-group sm:col-span-2">
                  <label className="ds-label">Reason</label>
                  <textarea rows={3} value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="ds-input resize-none" placeholder="Explain your reason..." />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)} className="ds-btn ds-btn-ghost">Cancel</button>
                  <button type="submit" disabled={submitting} className="ds-btn ds-btn-primary">
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title">Leave History</h3>
          </div>
          <div className="ds-table-wrap">
            <table className="ds-table w-full">
              <thead>
                <tr>
                  <th>Type & Status</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="ds-empty">No leave requests yet</td>
                  </tr>
                ) : (
                  leaves.map((leave) => {
                    const Icon = statusIcons[leave.status] || AlertCircle;
                    return (
                      <tr key={leave._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 capitalize">{leave.leaveType || leave.type} Leave</span>
                            <span className={statusColors[leave.status] || 'ds-badge ds-badge-slate'}>
                              {leave.status}
                            </span>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs font-bold text-slate-500 m-0">
                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400 m-0">({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})</p>
                        </td>
                        <td>
                          <p className="text-xs text-slate-600 font-semibold m-0">{leave.reason}</p>
                          {leave.rejectionReason && (
                            <p className="text-xs text-rose-500 font-bold m-0 mt-1">
                              Rejection: {leave.rejectionReason}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeLeaves;
