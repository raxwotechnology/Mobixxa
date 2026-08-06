import { useState, useEffect, useMemo } from 'react';
import { Calendar, Check, X, Clock, FileText, FileSpreadsheet, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import {
  getEmployees, getLeavePolicies, createLeavePolicy, updateLeavePolicy, deleteLeavePolicy,
  assignPoliciesToEmployee, assignPoliciesToAllEmployees, adminCreateLeave, approveLeave, rejectLeave, getStoreLeaves, requestLeave
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

const AdminLeaves = () => {
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
    annualLeaves: 14,
    sickLeaves: 7,
    casualLeaves: 7,
    deductionPerExcessLeave: 1500,
    isDefault: false
  });

  // Assign Policy Form/Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignConfirm, setShowBulkAssignConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    employeeName: '',
    leavePolicyId: ''
  });

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

  const handleApprove = async (id) => {
    try {
      await approveLeave(id);
      toast.success('Leave approved');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await rejectLeave(id, { reason });
      toast.success('Leave rejected');
      fetchData();
    } catch (err) {
      toast.error('Failed to reject');
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
      annualLeaves: policy.annualLeaves,
      sickLeaves: policy.sickLeaves,
      casualLeaves: policy.casualLeaves,
      deductionPerExcessLeave: policy.deductionPerExcessLeave,
      isDefault: !!policy.isDefault
    });
    setShowLeaveModal(true);
  };

  const openCreateLeave = () => {
    setEditingLeavePolicyId(null);
    setLeavePolicyForm({
      name: '',
      annualLeaves: 14,
      sickLeaves: 7,
      casualLeaves: 7,
      deductionPerExcessLeave: 0,
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
    if (employee) {
      setAssignForm({
        employeeId: employee._id,
        employeeName: employee.name,
        leavePolicyId: employee.employeeInfo?.leavePolicyId?._id || employee.employeeInfo?.leavePolicyId || ''
      });
    } else {
      setAssignForm({
        employeeId: 'all',
        employeeName: 'All Employees',
        leavePolicyId: ''
      });
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e) => {
    if (e) e.preventDefault();
    if (assignForm.employeeId === 'all' && !showBulkAssignConfirm) {
      setShowBulkAssignConfirm(true);
      return;
    }
    try {
      if (assignForm.employeeId === 'all') {

        await assignPoliciesToAllEmployees({
          leavePolicyId: assignForm.leavePolicyId || null
        });
        toast.success('Leave policy assigned to all employees successfully');
        setShowBulkAssignConfirm(false);

      } else {
        await assignPoliciesToEmployee({
          employeeId: assignForm.employeeId,
          leavePolicyId: assignForm.leavePolicyId || null
        });
        toast.success('Leave policy assigned successfully');
      }
      setShowAssignModal(false);
      // Refresh employees list
      const empRes = await getEmployees();
      setEmployees(empRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign policies');
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
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Leaves">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                USER & EMPLOYEE MANAGEMENT
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 m-0">Leave Management</h1>
            <p className="text-slate-400 text-xs font-bold mt-1 m-0">Configure leave policies and track employee leave requests</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
            {activeTab === 'requests' && (
              <>
                <button onClick={() => setShowAddLeaveModal(true)} className="flex items-center gap-2 bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-brand-indigo/20">
                  <Calendar size={14} /> Add Leave
                </button>
                <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm">
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={exportPDF} className="flex items-center gap-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm">
                  <FileText size={14} /> PDF
                </button>
              </>
            )}
            {activeTab === 'leave-policies' && (
              <button onClick={openCreateLeave} className="bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-brand-indigo/20 flex items-center gap-2">
                <Plus size={14} /> Create Policy
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'requests' ? 'border-brand-indigo text-brand-indigo' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            📋 Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('leave-policies')}
            className={`pb-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'leave-policies' ? 'border-brand-indigo text-brand-indigo' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            🌴 Leave Policies
          </button>
          <button
            onClick={() => setActiveTab('assign-policies')}
            className={`pb-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'assign-policies' ? 'border-brand-indigo text-brand-indigo' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            👤 Assign Policies
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
            {/* Request My Leave form */}
            {/* Request My Leave form */}
            <form onSubmit={handleCreateLeaveRequest} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-indigo"></div>
              <h2 className="text-lg font-black text-slate-900 mb-4">Request My Leave</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Leave Type</label>
                  <select
                    value={requestForm.leaveType}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
                  >
                    {['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={requestForm.startDate}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">End Date</label>
                  <input
                    type="date"
                    value={requestForm.endDate}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={requesting}
                    className="w-full h-[42px] rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all disabled:opacity-60 flex items-center justify-center"
                  >
                    {requesting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Reason</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  placeholder="Provide a reason for your leave..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all resize-none"
                />
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-amber-500 mb-1">{leaves.filter(l => l.status === 'pending').length}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pending</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-emerald-500 mb-1">{leaves.filter(l => l.status === 'approved').length}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Approved</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-rose-500 mb-1">{leaves.filter(l => l.status === 'rejected').length}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Rejected</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-slate-900 mb-1">{leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</p>
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Days Used</p>
              </div>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                      filter === s ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20' : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? leaves.length : leaves.filter(l => l.status === s).length})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
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
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Calendar size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">No Leave Requests</h3>
                <p className="text-sm font-bold text-slate-400">There are no leave requests matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((leave) => (
                  <div key={leave._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      leave.status === 'pending' ? 'bg-amber-400' :
                      leave.status === 'approved' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-indigo/20">
                          {leave.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-base">{leave.employeeId?.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">{leave.employeeId?.role}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-600">{leave.leaveType} leave</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border ${
                          leave.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {leave.status}
                        </span>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(leave._id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 hover:border-emerald-500 transition-all shadow-sm">
                              <Check size={16} strokeWidth={3} />
                            </button>
                            <button onClick={() => handleReject(leave._id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 transition-all shadow-sm">
                              <X size={16} strokeWidth={3} />
                            </button>
                          </div>
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
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Reason</p>
                        <p className="text-sm font-semibold text-slate-700">{leave.reason}</p>
                      </div>
                    )}
                    {leave.rejectionReason && (
                      <div className="mt-4 bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <p className="text-[10px] uppercase font-black tracking-wider text-rose-400 mb-1">Rejection Reason</p>
                        <p className="text-sm font-semibold text-rose-700">{leave.rejectionReason}</p>
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
                      <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 border-b border-l border-emerald-100 text-[9px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm">
                        System Default
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-slate-800 text-lg mb-5 pr-16">{p.name}</h3>
                      <div className="space-y-3 text-sm text-slate-600 mb-6">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">🌴 Annual Leaves</span>
                          <span className="font-black text-slate-800">{p.annualLeaves} days</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">🤒 Sick Leaves</span>
                          <span className="font-black text-slate-800">{p.sickLeaves} days</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">🏖️ Casual Leaves</span>
                          <span className="font-black text-slate-800">{p.casualLeaves} days</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">💸 Excess Penalty</span>
                          <span className="font-black text-rose-500">Rs. {p.deductionPerExcessLeave.toLocaleString()} / day</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 pt-5 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditLeave(p)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black flex items-center justify-center gap-1.5 transition-all border border-slate-200"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handlePolicyDeleteClick(p)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black flex items-center justify-center gap-1.5 transition-all border border-rose-200"><Trash2 size={12} /> Delete</button>
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
                <h3 className="font-black text-slate-800 text-lg">Bulk Policy Assignment</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Assign leave policies to all employees at once</p>
              </div>
              <button
                onClick={() => openAssignModal(null)}
                className="bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-sm shadow-brand-indigo/20"
              >
                Bulk Assign to All
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
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
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">{emp.role}</td>
                            <td className="px-6 py-4">
                              {lp ? (
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border border-emerald-100">
                                  {lp.name}
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                  System Default
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => openAssignModal(emp)}
                                className="text-[10px] font-black uppercase tracking-wider bg-brand-indigo hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-indigo/20"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAddLeaveModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3 border border-amber-100 shadow-sm">
                <Calendar size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-xl">Create Leave</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Add a manual leave record for an employee</p>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Employee *</label>
                <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({...leaveForm, employeeId: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Leave Type</label>
                  <select value={leaveForm.type} onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="annual">Annual</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Status</label>
                  <select value={leaveForm.status} onChange={(e) => setLeaveForm({...leaveForm, status: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Reason</label>
                <input value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="Reason for leave" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddLeaveModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleAddLeave} className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all">
                  Create Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative sticky top-0 z-10">
              <button onClick={() => setShowLeaveModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-100 shadow-sm text-xl">
                🌴
              </div>
              <h3 className="font-black text-slate-900 text-xl">{editingLeavePolicyId ? 'Edit Leave Policy' : 'Create Leave Policy'}</h3>
            </div>
            
            <form onSubmit={handleSaveLeavePolicy} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Policy Name *</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Policy Cycle / Period *</label>
                  <select
                    value={leavePolicyForm.periodType}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, periodType: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 cursor-pointer"
                  >
                    <option value="daily">Daily Basis</option>
                    <option value="monthly">Monthly Basis (Standard)</option>
                    <option value="half_yearly">6-Months Basis</option>
                    <option value="annual">Annual / Yearly Basis</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Allowed Paid Leaves</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-emerald-700 block mb-1">Unused Leave Bonus / Day (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.unusedLeaveBonusPerDay}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, unusedLeaveBonusPerDay: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1000"
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Bonus paid per unused leave day if employee works</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-rose-600 block mb-1">Excess Leave Fine / Day (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.deductionPerExcessLeave}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, deductionPerExcessLeave: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1500"
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Fine deducted for extra leaves beyond allowed limit</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Annual</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.annualLeaves}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, annualLeaves: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Sick</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.sickLeaves}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, sickLeaves: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Casual</label>
                  <input
                    type="number"
                    min="0"
                    value={leavePolicyForm.casualLeaves}
                    onChange={(e) => setLeavePolicyForm({ ...leavePolicyForm, casualLeaves: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
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
                <label htmlFor="leaveDefault" className="text-xs font-black text-slate-700 cursor-pointer select-none">
                  Set as system default leave policy
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all">
                  {editingLeavePolicyId ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Policies Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAssignModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 border border-blue-100 shadow-sm text-xl">
                👤
              </div>
              <h3 className="font-black text-slate-900 text-xl">Assign Policy</h3>
            </div>
            
            <form onSubmit={handleSaveAssignment} className="p-6 bg-slate-50/50 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Employee</label>
                <p className="font-black text-slate-900 text-lg">{assignForm.employeeName}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Select Leave Policy</label>
                <select
                  value={assignForm.leavePolicyId}
                  onChange={(e) => setAssignForm({ ...assignForm, leavePolicyId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                >
                  <option value="">System Default</option>
                  {leavePolicies.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Annual: {p.annualLeaves}d, Sick: {p.sickLeaves}d, Casual: {p.casualLeaves}d)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Bulk Policy Assignment</h3>
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

    </DashboardLayout>
  );
};

export default AdminLeaves;
