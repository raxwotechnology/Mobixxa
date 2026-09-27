'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, FileText, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { toast } from 'react-toastify';
import { managerNavGroups } from './managerNavItems';
import { getEmployees, adminCreateLeave } from '../../services/api';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const ManagerLeaves = ({ navItems = managerNavGroups, title = 'Manager Dashboard' }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'approved' });
  const [requesting, setRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const [leavesRes, empRes] = await Promise.all([
        API.get('/hr/leaves/store'),
        getEmployees(),
      ]);
      setLeaves(leavesRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) return toast.error('Fill all fields');
    try {
      await adminCreateLeave(leaveForm);
      toast.success('Leave created');
      setShowLeaveModal(false);
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/hr/leaves/${id}/approve`);
      toast.success('Leave approved');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await API.put(`/hr/leaves/${id}/reject`, { reason });
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const filtered = leaves.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (roleFilter !== 'all' && l.employeeId?.role !== roleFilter) return false;
    if (deptFilter !== 'all' && (l.employeeId?.employeeInfo?.department || 'Unassigned') !== deptFilter) return false;
    return true;
  });

  const exportExcel = () => {
    const rows = filtered.map(l => ({
      Employee: l.employeeId?.name || 'Unknown',
      Role: l.employeeId?.role || 'N/A',
      Department: l.employeeId?.employeeInfo?.department || 'Unassigned',
      Type: l.leaveType,
      'Start Date': new Date(l.startDate).toLocaleDateString(),
      'End Date': new Date(l.endDate).toLocaleDateString(),
      Days: l.totalDays,
      Status: l.status,
      Reason: l.reason || ''
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Leaves');
    XLSX.writeFile(workbook, 'leaves_report.xlsx');
    toast.success('Excel exported');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Leave Requests Report', 14, 15);
    autoTable(doc, {
      head: [['Employee', 'Role', 'Department', 'Type', 'Dates', 'Days', 'Status']],
      body: filtered.map(l => [
        l.employeeId?.name || 'Unknown',
        l.employeeId?.role || 'N/A',
        l.employeeId?.employeeInfo?.department || 'Unassigned',
        l.leaveType,
        `${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}`,
        l.totalDays,
        l.status
      ]),
      startY: 20
    });
    doc.save('leaves_report.pdf');
    toast.success('PDF exported');
  };

  const handleCreateLeaveRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.startDate || !requestForm.endDate || !requestForm.reason.trim()) {
      toast.error('Please fill all leave request fields');
      return;
    }
    try {
      setRequesting(true);
      await API.post('/hr/leaves', {
        leaveType: requestForm.leaveType,
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: requestForm.reason.trim(),
      });
      toast.success('Leave request sent to admin');
      setRequestForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title={title}>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title={title}>
      <div className="ds-page">
        <div className="ds-page-header">
          <div>
            <h1 className="ds-page-title">Store Leave Management</h1>
            <p className="ds-page-subtitle">{leaves.filter((l) => l.status === 'pending').length} pending requests awaiting review</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={() => setShowLeaveModal(true)} className="ds-btn ds-btn-primary text-xs uppercase py-2">
              <Calendar size={14} /> Add Leave
            </button>
            <button onClick={exportExcel} className="ds-btn ds-btn-secondary text-xs uppercase py-2">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={exportPDF} className="ds-btn ds-btn-secondary text-xs uppercase py-2">
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Request Leave Form */}
        <form onSubmit={handleCreateLeaveRequest} className="ds-card mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 m-0">Request My Leave (to Admin)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={requestForm.leaveType}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, leaveType: e.target.value }))}
              className="ds-input text-xs cursor-pointer capitalize"
            >
              {['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'].map((t) => (
                <option key={t} value={t}>{t} Leave</option>
              ))}
            </select>
            <input
              type="date"
              value={requestForm.startDate}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="ds-input text-xs"
            />
            <input
              type="date"
              value={requestForm.endDate}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="ds-input text-xs"
            />
            <button
              type="submit"
              disabled={requesting}
              className="ds-btn ds-btn-primary text-xs uppercase justify-center disabled:opacity-60 cursor-pointer"
            >
              {requesting ? 'Submitting...' : 'Submit Leave'}
            </button>
          </div>
          <textarea
            value={requestForm.reason}
            onChange={(e) => setRequestForm((prev) => ({ ...prev, reason: e.target.value }))}
            rows={2}
            placeholder="Reason for leave..."
            className="ds-input text-xs mt-3 w-full"
          />
        </form>

        {/* Stats */}
        <div className="ds-stats grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="ds-stat">
            <div className="ds-stat-label">Pending Requests</div>
            <div className="ds-stat-value text-amber-600">{leaves.filter(l => l.status === 'pending').length}</div>
            <div className="ds-stat-sub">Awaiting approval</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Approved</div>
            <div className="ds-stat-value text-emerald-600">{leaves.filter(l => l.status === 'approved').length}</div>
            <div className="ds-stat-sub">Authorized absences</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Rejected</div>
            <div className="ds-stat-value text-rose-600">{leaves.filter(l => l.status === 'rejected').length}</div>
            <div className="ds-stat-sub">Declined requests</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Total Days Used</div>
            <div className="ds-stat-value">{leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</div>
            <div className="ds-stat-sub">Calendar days consumed</div>
          </div>
        </div>

        {/* Filter Tabs & Selects */}
        <div className="ds-card p-3.5 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="ds-tab-bar">
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`ds-tab-btn ${filter === s ? 'active' : ''}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? leaves.length : leaves.filter(l => l.status === s).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="ds-input text-xs w-auto cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="cashier">Cashier</option>
              <option value="deliveryGuy">Delivery</option>
              <option value="stockEmployee">Stock</option>
              <option value="manager">Manager</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="ds-input text-xs w-auto cursor-pointer"
            >
              <option value="all">All Departments</option>
              {Array.from(new Set(leaves.map(l => l.employeeId?.employeeInfo?.department || 'Unassigned'))).filter(Boolean).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="ds-card p-12 text-center text-slate-400 font-medium text-xs">
            <Calendar size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="m-0">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((leave) => (
              <div key={leave._id} className="ds-card p-4 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-bold text-xs">
                      {leave.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm m-0">{leave.employeeId?.name}</h3>
                      <p className="text-xs text-slate-400 capitalize m-0 mt-0.5">{leave.employeeId?.role} • {leave.leaveType} leave</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={
                      leave.status === 'approved' ? 'ds-badge-green' :
                      leave.status === 'rejected' ? 'ds-badge-red' :
                      'ds-badge-amber'
                    }>
                      {leave.status}
                    </span>
                    {leave.status === 'pending' && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button onClick={() => handleApprove(leave._id)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer" title="Approve">
                          <Check size={14} />
                        </button>
                        <button onClick={() => handleReject(leave._id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer" title="Reject">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Calendar size={13} className="text-blue-600" /> {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={13} className="text-amber-600" /> {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                  {leave.reason && <span className="text-slate-400 truncate max-w-md">Reason: {leave.reason}</span>}
                </div>
                {leave.reason && <p className="text-xs text-muted-text mt-2 bg-gray-50 rounded-lg p-2">{leave.reason}</p>}
                {leave.rejectionReason && <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg p-2">Rejected: {leave.rejectionReason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-card-border">
              <h2 className="text-lg font-bold text-dark-navy flex items-center gap-2"><Calendar size={20} className="text-amber-500" /> Create Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted-text block mb-1">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={leaveForm.employeeId ? [leaveForm.employeeId] : []}
                  onChange={([id]) => setLeaveForm({ ...leaveForm, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-text block mb-1">Leave Type</label>
                  <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                    className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="annual">Annual</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-text block mb-1">Status</label>
                  <select value={leaveForm.status} onChange={(e) => setLeaveForm({ ...leaveForm, status: e.target.value })}
                    className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm bg-white">
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-text block mb-1">Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-text block mb-1">End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-text block mb-1">Reason</label>
                <input value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border border-card-border rounded-lg px-3 py-2.5 text-sm" placeholder="Reason for leave" />
              </div>
              <button onClick={handleAddLeave} className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-semibold">
                Create Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManagerLeaves;
