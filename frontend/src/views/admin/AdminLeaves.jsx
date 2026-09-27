'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Check, X, Clock, FileText, FileSpreadsheet, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { adminNavGroups as defaultNavItems } from './adminNavItems';
import EmployeeSelector from '../../components/EmployeeSelector';
import {
  getEmployees, getLeavePolicies, createLeavePolicy, updateLeavePolicy, deleteLeavePolicy,
  assignPoliciesToEmployee, assignPoliciesToAllEmployees, adminCreateLeave, approveLeave, rejectLeave,
  cancelLeaveDecision, getAttendanceSummary, getStoreLeaves, requestLeave
} from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const AdminLeaves = ({ navItems: propNavItems }) => {
  const navItems = propNavItems || defaultNavItems;
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Policy Management Tab States
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'leave-policies' | 'assign-policies'
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Create/Add Leave Modal State
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'approved' });

  // Self Request Form State
  const [requesting, setRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });

  // Leave Policy Form/Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeavePolicyId, setEditingLeavePolicyId] = useState(null);
  const [leavePolicyForm, setLeavePolicyForm] = useState({
    name: '',
    periodType: 'monthly',
    allowedLeaves: 4,
    unusedLeaveBonusPerDay: 1000,
    deductionPerExcessLeave: 1500,
    isDefault: false
  });

  // Assign Policy Form/Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignConfirm, setShowBulkAssignConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    employeeIds: [],
    leavePolicyId: ''
  });
  const [policySearchQuery, setPolicySearchQuery] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null); // { id, name }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'requests') {
      fetchPolicies();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        getStoreLeaves(),
        getEmployees(),
      ]);
      setLeaves(leavesRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const leaveRes = await getLeavePolicies();
      setLeavePolicies(leaveRes.data || []);
    } catch (err) {
      toast.error('Failed to load leave policies');
    } finally {
      setPoliciesLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) return toast.error('Fill all fields');
    try {
      await adminCreateLeave(leaveForm);
      toast.success('Leave created');
      setShowAddLeaveModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // When approving would exceed the employee's pooled allowance, we don't
  // block — we show a warning modal (instead of a native confirm()) and let
  // the admin decide; excess days still get treated as excess/deducted.
  const [approveWarning, setApproveWarning] = useState(null); // { leave, remaining }
  const [approving, setApproving] = useState(false);

  const doApprove = async (leave) => {
    setApproving(true);
    try {
      await approveLeave(leave._id);
      toast.success('Leave approved');
      setApproveWarning(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleApprove = async (leave) => {
    try {
      // Look up the employee's pooled allowance for the period this leave falls in.
      const start = new Date(leave.startDate);
      const { data: balance } = await getAttendanceSummary(leave.employeeId?._id || leave.employeeId, {
        month: start.getMonth() + 1,
        year: start.getFullYear(),
      });
      const remaining = Math.max(0, (balance.allowedLeaves || 0) - (balance.leaveDaysTaken || 0));
      if (leave.leaveType !== 'unpaid' && (leave.totalDays || 0) > remaining) {
        setApproveWarning({ leave, remaining });
        return;
      }
    } catch (err) {
      // Balance lookup failing shouldn't block approval — fall through.
    }
    doApprove(leave);
  };

  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleReject = (id) => {
    setRejectReason('');
    setRejectModal({ id });
  };

  const doReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await rejectLeave(rejectModal.id, { reason: rejectReason.trim() });
      toast.success('Leave rejected');
      setRejectModal(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const handleCancelDecision = async (id) => {
    const reason = prompt('Reason for cancelling this decision:');
    if (!reason || !reason.trim()) return;
    try {
      await cancelLeaveDecision(id, { reason: reason.trim() });
      toast.success('Decision cancelled — request is pending again');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel decision');
    }
  };

  const handleCreateLeaveRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.startDate || !requestForm.endDate || !requestForm.reason.trim()) {
      toast.error('Please fill all leave request fields');
      return;
    }
    try {
      setRequesting(true);
      await requestLeave({
        type: requestForm.leaveType,
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: requestForm.reason.trim(),
      });
      toast.success('Leave request sent');
      setRequestForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setRequesting(false);
    }
  };

  // Leave Policy Operations
  const handleSaveLeavePolicy = async (e) => {
    e.preventDefault();
    if (!leavePolicyForm.name) return toast.error('Policy name is required');
    try {
      if (editingLeavePolicyId) {
        await updateLeavePolicy(editingLeavePolicyId, leavePolicyForm);
        toast.success('Leave policy updated');
      } else {
        await createLeavePolicy(leavePolicyForm);
        toast.success('Leave policy created');
      }
      setShowLeaveModal(false);
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save leave policy');
    }
  };

  const openEditLeave = (policy) => {
    setEditingLeavePolicyId(policy._id);
    setLeavePolicyForm({
      name: policy.name,
      periodType: policy.periodType || 'monthly',
      allowedLeaves: policy.allowedLeaves,
      unusedLeaveBonusPerDay: policy.unusedLeaveBonusPerDay,
      deductionPerExcessLeave: policy.deductionPerExcessLeave,
      isDefault: !!policy.isDefault
    });
    setShowLeaveModal(true);
  };

  const openCreateLeave = () => {
    setEditingLeavePolicyId(null);
    setLeavePolicyForm({
      name: '',
      periodType: 'monthly',
      allowedLeaves: 4,
      unusedLeaveBonusPerDay: 1000,
      deductionPerExcessLeave: 1500,
      isDefault: false
    });
    setShowLeaveModal(true);
  };

  const handlePolicyDeleteClick = (policy) => {
    setPolicyToDelete({ id: policy._id, name: policy.name });
    setDeleteModalOpen(true);
  };

  const handlePolicyDeleteConfirm = async () => {
    if (!policyToDelete) return;
    try {
      await deleteLeavePolicy(policyToDelete.id);
      toast.success('Policy removed');
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  };

  // Policy Assignment logic
  const openAssignModal = (employee = null) => {
    setPolicySearchQuery('');
    if (employee) {
      setAssignForm({
        employeeIds: [employee._id],
        leavePolicyId: employee.employeeInfo?.leavePolicyId?._id || employee.employeeInfo?.leavePolicyId || ''
      });
    } else {
      setAssignForm({ employeeIds: [], leavePolicyId: '' });
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e) => {
    if (e) e.preventDefault();
    if (assignForm.employeeIds.length === 0 || !assignForm.leavePolicyId) return;
    // Extra confirmation only when the selection is effectively everyone —
    // the same safety net the old "assign to all" sentinel used to provide.
    const isEffectivelyAll = employees.length > 0 && assignForm.employeeIds.length === employees.length;
    if (isEffectivelyAll && !showBulkAssignConfirm) {
      setShowBulkAssignConfirm(true);
      return;
    }
    try {
      await assignPoliciesToEmployee({
        employeeIds: assignForm.employeeIds,
        leavePolicyId: assignForm.leavePolicyId || null
      });
      toast.success(`Policy assigned to ${assignForm.employeeIds.length} employee${assignForm.employeeIds.length === 1 ? '' : 's'}`);
      setShowBulkAssignConfirm(false);
      setShowAssignModal(false);
      // Refresh employees list
      const empRes = await getEmployees();
      setEmployees(empRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign policy');
    }
  };

  const filtered = useMemo(() => {
    return leaves.filter((l) => {
      if (filter !== 'all' && l.status !== filter) return false;
      if (roleFilter !== 'all' && l.employeeId?.role !== roleFilter) return false;
      if (deptFilter !== 'all' && (l.employeeId?.employeeInfo?.department || 'Unassigned') !== deptFilter) return false;
      return true;
    });
  }, [leaves, filter, roleFilter, deptFilter]);

  const departments = useMemo(() => {
    const deps = new Set(leaves.map(l => l.employeeId?.employeeInfo?.department || 'Unassigned').filter(Boolean));
    return ['all', ...Array.from(deps)];
  }, [leaves]);

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

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Leaves">
        <div className="ds-loading"><div className="ds-spinner" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Leaves">
      <div className="ds-page">
        {/* Page Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Calendar size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Leave Management</h1>
              <p className="ds-page-subtitle">Configure leave policies and track employee leave requests across stores</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            {activeTab === 'requests' && (
              <>
                <button onClick={() => setShowAddLeaveModal(true)} className="ds-btn ds-btn-primary">
                  <Calendar size={14} /> Add Leave
                </button>
                <button onClick={exportExcel} className="ds-btn ds-btn-secondary ds-btn-sm">
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={exportPDF} className="ds-btn ds-btn-secondary ds-btn-sm">
                  <FileText size={14} /> PDF
                </button>
              </>
            )}
            {activeTab === 'leave-policies' && (
              <button onClick={openCreateLeave} className="ds-btn ds-btn-primary">
                <Plus size={14} /> Create Policy
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="ds-card" style={{ padding: '0.375rem', width: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('requests')}
              className={`ds-btn ds-btn-sm ${activeTab === 'requests' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Leave Requests
            </button>
            <button
              onClick={() => setActiveTab('leave-policies')}
              className={`ds-btn ds-btn-sm ${activeTab === 'leave-policies' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Leave Policies
            </button>
            <button
              onClick={() => setActiveTab('assign-policies')}
              className={`ds-btn ds-btn-sm ${activeTab === 'assign-policies' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Assign Policies
            </button>
          </div>
        </div>

        {activeTab === 'requests' && (
          <>
            {/* Stats - Unified Metrics Scale */}
            <div className="ds-stats">
              <div className="ds-stat">
                <p className="ds-stat-label">Pending Requests</p>
                <p className="ds-stat-value" style={{ color: '#d97706' }}>{leaves.filter(l => l.status === 'pending').length}</p>
                <p className="ds-stat-sub">Awaiting decision</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat-label">Approved Leaves</p>
                <p className="ds-stat-value" style={{ color: '#15803d' }}>{leaves.filter(l => l.status === 'approved').length}</p>
                <p className="ds-stat-sub">Active &amp; scheduled</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat-label">Rejected Requests</p>
                <p className="ds-stat-value" style={{ color: '#dc2626' }}>{leaves.filter(l => l.status === 'rejected').length}</p>
                <p className="ds-stat-sub">Declined applications</p>
              </div>
              <div className="ds-stat">
                <p className="ds-stat-label">Total Days Used</p>
                <p className="ds-stat-value" style={{ color: 'var(--ds-primary)' }}>
                  {leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0)}
                </p>
                <p className="ds-stat-sub">Across all staff</p>
              </div>
            </div>

            {/* Request My Leave form */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h3 className="ds-card-title"><Calendar size={16} /> Request My Leave</h3>
                <span className="ds-badge ds-badge-slate">Quick Application</span>
              </div>
              <form onSubmit={handleCreateLeaveRequest} className="ds-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Leave Type</label>
                    <select
                      value={requestForm.leaveType}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                      className="ds-input ds-select"
                    >
                      {['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Start Date</label>
                    <input
                      type="date"
                      value={requestForm.startDate}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="ds-input"
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">End Date</label>
                    <input
                      type="date"
                      value={requestForm.endDate}
                      onChange={(e) => setRequestForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="ds-input"
                    />
                  </div>
                  <div className="ds-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" disabled={requesting} className="ds-btn ds-btn-primary" style={{ width: '100%', height: '42px' }}>
                      {requesting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </div>
                <div className="ds-form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="ds-label">Reason</label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={2}
                    placeholder="Provide a reason for your leave..."
                    className="ds-input"
                    style={{ resize: 'none' }}
                  />
                </div>
              </form>
            </div>

            {/* Filters */}
            <div className="ds-card" style={{ padding: '0.75rem 1rem' }}>
              <div className="ds-filter-bar" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {['all', 'pending', 'approved', 'rejected'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`ds-btn ds-btn-sm ${filter === s ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? leaves.length : leaves.filter(l => l.status === s).length})
                    </button>
                  ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="ds-input ds-select"
                    style={{ minWidth: '130px' }}
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
                    className="ds-input ds-select"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="ds-empty">
                <Calendar size={36} className="ds-empty-icon" />
                <p className="ds-empty-title">No Leave Requests</p>
                <p className="ds-empty-desc">There are no leave requests matching your current filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.875rem' }}>
                {filtered.map((leave) => (
                  <div key={leave._id} className="ds-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                          width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-md)',
                          background: 'linear-gradient(135deg, var(--ds-primary) 0%, #7c3aed 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 'var(--ds-text-md)', flexShrink: 0
                        }}>
                          {leave.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 600, color: 'var(--ds-text-head)', margin: 0 }}>
                            {leave.employeeId?.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.2rem' }}>
                            <span className="ds-badge ds-badge-slate">{leave.employeeId?.role}</span>
                            <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{leave.leaveType} leave</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`ds-badge ${
                          leave.status === 'pending' ? 'ds-badge-amber' :
                          leave.status === 'approved' ? 'ds-badge-green' : 'ds-badge-red'
                        }`}>
                          {leave.status}
                        </span>
                        {leave.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button onClick={() => handleApprove(leave)} className="ds-btn ds-btn-sm" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.25rem 0.5rem' }} title="Approve">
                              <Check size={14} strokeWidth={2.5} />
                            </button>
                            <button onClick={() => handleReject(leave._id)} className="ds-btn ds-btn-danger ds-btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Reject">
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                        {isAdmin && (leave.status === 'approved' || leave.status === 'rejected') && (
                          <button onClick={() => handleCancelDecision(leave._id)} className="ds-btn ds-btn-ghost ds-btn-sm">
                            Cancel Decision
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Calendar size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Clock size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {leave.reason && (
                      <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Reason</p>
                        <p className="text-sm font-semibold text-slate-700">{leave.reason}</p>
                      </div>
                    )}
                    {leave.rejectionReason && (
                      <div className="mt-4 bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <p className="text-xs uppercase font-bold tracking-wider text-rose-400 mb-1">Rejection Reason</p>
                        <p className="text-sm font-semibold text-rose-700">{leave.rejectionReason}</p>
                      </div>
                    )}
                    {leave.decisions?.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Decision History</p>
                        <div className="space-y-1.5">
                          {leave.decisions.map((d, i) => (
                            <p key={i} className="text-xs font-semibold text-slate-500 m-0">
                              <span className={`uppercase font-bold ${d.action === 'approved' ? 'text-emerald-600' : d.action === 'rejected' ? 'text-rose-600' : 'text-slate-600'}`}>{d.action}</span>
                              {' '}by {d.by?.name || 'unknown'} on {new Date(d.at).toLocaleString()}
                              {d.note ? ` — ${d.note}` : ''}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'leave-policies' && (
          <div className="space-y-6">
            {policiesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-primary-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : leavePolicies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-card-border p-12 text-center text-muted-text">
                No leave policies found. Click "Create Leave Policy" to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leavePolicies.map(p => (
                  <div key={p._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group">
                    {p.isDefault && (
                      <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 border-b border-l border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm">
                        System Default
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-5 pr-16">{p.name}</h3>
                      <div className="space-y-3 text-sm text-slate-600 mb-6">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Cycle</span>
                          <span className="font-bold text-slate-800 capitalize">{(p.periodType || 'monthly').replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Allowed Leaves</span>
                          <span className="font-bold text-slate-800">{p.allowedLeaves} days</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-emerald-600"> Full-Attendance Bonus</span>
                          <span className="font-bold text-emerald-600">Rs. {(p.unusedLeaveBonusPerDay || 0).toLocaleString()} / day</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Excess Penalty</span>
                          <span className="font-bold text-rose-500">Rs. {p.deductionPerExcessLeave.toLocaleString()} / day</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 pt-5 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditLeave(p)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handlePolicyDeleteClick(p)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-200"><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assign-policies' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Bulk Policy Assignment</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Assign leave policies to all employees at once</p>
              </div>
              <button
                onClick={() => openAssignModal(null)}
                className="bg-brand-indigo hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-sm shadow-brand-indigo/20"
              >
                Bulk Assign to All
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Leave Policy</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.filter(e => e.role !== 'customer').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-400 font-bold">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.filter(e => e.role !== 'customer').map(emp => {
                        const lp = leavePolicies.find(p => p._id === (emp.employeeInfo?.leavePolicyId?._id || emp.employeeInfo?.leavePolicyId));
                        
                        return (
                          <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{emp.role}</td>
                            <td className="px-6 py-4">
                              {lp ? (
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs uppercase font-bold tracking-wider border border-emerald-100">
                                  {lp.name}
                                </span>
                              ) : (
                                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                  System Default
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => openAssignModal(emp)}
                                className="text-xs font-bold uppercase tracking-wider bg-brand-indigo hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-indigo/20"
                              >
                                Assign Policy
                              </button>
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
        )}
      </div>

      {/* Add Leave Record Modal */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAddLeaveModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3 border border-amber-100 shadow-sm">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Create Leave</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Add a manual leave record for an employee</p>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={leaveForm.employeeId ? [leaveForm.employeeId] : []}
                  onChange={([id]) => setLeaveForm({ ...leaveForm, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Leave Type</label>
                  <select value={leaveForm.type} onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="annual">Annual</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Status</label>
                  <select value={leaveForm.status} onChange={(e) => setLeaveForm({...leaveForm, status: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Reason</label>
                <input value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="Reason for leave" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddLeaveModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleAddLeave} className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-brand-indigo/20 transition-all">
                  Create Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative sticky top-0 z-10">
              <button onClick={() => setShowLeaveModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-100 shadow-sm text-xl">
                
              </div>
              <h3 className="font-bold text-slate-900 text-xl">{editingLeavePolicyId ? 'Edit Leave Policy' : 'Create Leave Policy'}</h3>
            </div>
            
            <form onSubmit={handleSaveLeavePolicy} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Policy Name *</label>
                <input
                  type="text"
                  required
                  value={leavePolicyForm.name}
                  onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, name: e.target.value })}
                  placeholder="e.g., Executive Leave Policy"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">Policy Cycle / Period *</label>
                  <select
                    value={leavePolicyForm.periodType}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, periodType: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 cursor-pointer"
                  >
                    <option value="daily">Daily Basis</option>
                    <option value="monthly">Monthly Basis (Standard)</option>
                    <option value="quarterly">3-Months Basis</option>
                    <option value="half_yearly">6-Months Basis</option>
                    <option value="annual">Annual / Yearly Basis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">Allowed Paid Leaves</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.allowedLeaves}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, allowedLeaves: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 4 days/month"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-emerald-700 block mb-1">Unused Leave Bonus / Day (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.unusedLeaveBonusPerDay}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, unusedLeaveBonusPerDay: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1000"
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Bonus paid per unused leave day if employee works</p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-rose-600 block mb-1">Excess Leave Fine / Day (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.deductionPerExcessLeave}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, deductionPerExcessLeave: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1500"
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">Fine deducted for extra leaves beyond allowed limit</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 bg-slate-100 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="leaveDefault"
                  checked={leavePolicyForm.isDefault}
                  onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-indigo focus:ring-brand-indigo accent-brand-indigo cursor-pointer"
                />
                <label htmlFor="leaveDefault" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Set as system default leave policy
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-brand-indigo/20 transition-all">
                  {editingLeavePolicyId ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Policies Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative flex-shrink-0">
              <button onClick={() => setShowAssignModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 border border-blue-100 shadow-sm text-xl">
                
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Assign Policy</h3>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 bg-slate-50/50 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Employees</label>
                <EmployeeSelector
                  alwaysOpen
                  multiple
                  employees={employees}
                  value={assignForm.employeeIds}
                  onChange={(ids) => setAssignForm({ ...assignForm, employeeIds: ids })}
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Select Leave Policy *</label>
                {leavePolicies.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-amber-700 mb-3">No leave policies exist yet — create one first.</p>
                    <button
                      type="button"
                      onClick={() => { setShowAssignModal(false); openCreateLeave(); }}
                      className="text-xs uppercase tracking-wider font-bold bg-brand-indigo hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-sm transition-all"
                    >
                      + Create Leave Policy
                    </button>
                  </div>
                ) : (
                  <>
                    {leavePolicies.length > 6 && (
                      <input
                        type="text"
                        value={policySearchQuery}
                        onChange={(e) => setPolicySearchQuery(e.target.value)}
                        placeholder="Search policies..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 mb-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                      />
                    )}
                    <select
                      required
                      value={assignForm.leavePolicyId}
                      onChange={(e) => setAssignForm({ ...assignForm, leavePolicyId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                    >
                      <option value="">Select a policy...</option>
                      {leavePolicies
                        .filter((p) => p.name.toLowerCase().includes(policySearchQuery.toLowerCase()))
                        .map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.allowedLeaves}d / {(p.periodType || 'monthly').replace('_', ' ')})
                          </option>
                        ))}
                    </select>
                  </>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignForm.employeeIds.length === 0 || !assignForm.leavePolicyId}
                  className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-brand-indigo/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-indigo"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setPolicyToDelete(null); }}
        onConfirm={handlePolicyDeleteConfirm}
        itemName={policyToDelete?.name}
      />

      {/* Bulk Assign Confirmation Modal */}
      {showBulkAssignConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Bulk Policy Assignment</h3>
                <p className="text-xs text-slate-500 font-medium">Please confirm this action</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 font-medium mb-6">
              Are you sure you want to assign this policy to <span className="font-bold text-slate-800">ALL employees</span>? This will overwrite their current individual policies.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowBulkAssignConfirm(false)} 
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleSaveAssignment()} 
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition-all text-sm"
              >
                Yes, Overwrite & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve-with-excess Warning Modal */}
      {approveWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Exceeds Leave Allowance</h3>
                <p className="text-xs text-slate-500 font-medium">Please confirm this action</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 font-medium mb-6">
              <span className="font-bold text-slate-800">{approveWarning.leave.employeeId?.name || 'This employee'}</span> only has{' '}
              <span className="font-bold text-slate-800">{approveWarning.remaining} day{approveWarning.remaining === 1 ? '' : 's'}</span> left in their leave allowance,
              but this request is for <span className="font-bold text-slate-800">{approveWarning.leave.totalDays} day{approveWarning.leave.totalDays > 1 ? 's' : ''}</span>.
              Approving will treat the extra day(s) as excess and deduct them from salary.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApproveWarning(null)}
                disabled={approving}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => doApprove(approveWarning.leave)}
                disabled={approving}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition-all text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {approving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Approve Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="bg-rose-50 px-6 py-5 flex items-center gap-3 border-b border-rose-100">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <X size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base">Reject Leave Request</h3>
                <p className="text-xs text-rose-700 font-medium mt-0.5">A reason is required and will be shown to the employee</p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-rose-100/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); doReject(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rejection Reason</label>
                <textarea
                  autoFocus
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none placeholder:text-slate-400 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  disabled={rejecting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting || !rejectReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-rose-100 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Reject Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminLeaves;
