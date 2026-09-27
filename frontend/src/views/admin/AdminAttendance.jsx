'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, Filter, Store as StoreIcon, Clock, CheckCircle, X, Plus, Edit2, Trash2, ShieldAlert, AlertCircle } from 'lucide-react';

import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import {
  getAttendanceReport, getEmployees, getStores, adminMarkAttendance,
  getLeavePolicies, createLeavePolicy, updateLeavePolicy, deleteLeavePolicy,
  getAttendancePolicies, createAttendancePolicy, updateAttendancePolicy, deleteAttendancePolicy,
  assignPoliciesToEmployee, assignPoliciesToAllEmployees,
  checkIn, checkOut, startBreak, endBreak, getMyAttendance, getActiveBreak, getAttendanceSummary
} from '../../services/api';
import useAuthStore from '../../store/authStore';
import AttendanceDashboardView from '../../components/AttendanceDashboardView';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { adminNavGroups as defaultNavItems } from './adminNavItems';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const now = new Date();

const AdminAttendance = ({ navItems: propNavItems }) => {
  const navItems = propNavItems || defaultNavItems;
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('All');
  
  const [showAttModal, setShowAttModal] = useState(false);
  const [attForm, setAttForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], checkInTime: '09:00', checkOutTime: '17:00', status: 'present', notes: '' });

  // Policy Management States
  const [activeTab, setActiveTab] = useState('my-attendance'); // 'my-attendance' | 'records' | 'attendance-policies' | 'assign-policies'
  const [attendancePolicies, setAttendancePolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Attendance Policy Modal State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendancePolicyId, setEditingAttendancePolicyId] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    name: '',
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    graceTimeMinutes: 15,
    lateArrivalPenalty: 0,
    lateBlockMinutes: 30,
    earlyCheckoutPenalty: 0,
    otRatePerBlock: 100,
    otBlockMinutes: 30,
    halfDayThresholdHours: 4,
    absentDayDeduction: 0,
    isDefault: false
  });

  // Leave & Salary Summary tab state
  const [salaryEmployeeId, setSalaryEmployeeId] = useState('');
  const [salarySummary, setSalarySummary] = useState(null);
  const [salarySummaryLoading, setSalarySummaryLoading] = useState(false);

  const fetchSalarySummary = async (employeeId = salaryEmployeeId) => {
    if (!employeeId) { setSalarySummary(null); return; }
    setSalarySummaryLoading(true);
    try {
      const { data } = await getAttendanceSummary(employeeId, { month, year });
      setSalarySummary(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load summary');
      setSalarySummary(null);
    } finally {
      setSalarySummaryLoading(false);
    }
  };

  // Assign Policy Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignConfirm, setShowBulkAssignConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    employeeIds: [],
    attendancePolicyId: ''
  });
  const [policySearchQuery, setPolicySearchQuery] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null); // { id, name }

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (selectedStore !== 'All') params.storeId = selectedStore;
      
      const [attRes, empRes, storeRes, myAttRes, activeBrkRes] = await Promise.all([
        getAttendanceReport(params),
        getEmployees(),
        getStores(),
        getMyAttendance({ month, year }),
        getActiveBreak().catch(() => ({ data: null })),
      ]);
      setRecords(attRes.data || []);
      setEmployees(empRes.data || []);
      setStores(storeRes.data || []);
      setMyRecords(myAttRes.data || []);
      setActiveBreak(activeBrkRes?.data || null);
    } catch (err) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const handleCheckInAction = async () => {
    try {
      await checkIn();
      toast.success('Successfully Clocked In!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock In');
    }
  };

  const handleCheckOutAction = async () => {
    try {
      await checkOut();
      toast.success('Successfully Clocked Out!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock Out');
    }
  };

  const handleStartBreakAction = async () => {
    try {
      const res = await startBreak();
      setActiveBreak(res.data || true);
      toast.info('Break Started');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreakAction = async () => {
    try {
      await endBreak();
      setActiveBreak(null);
      toast.success('Break Ended');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end break');
    }
  };

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const attRes = await getAttendancePolicies();
      setAttendancePolicies(attRes.data || []);
    } catch (err) {
      toast.error('Failed to load HR policies');
    } finally {
      setPoliciesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year, selectedStore]);

  useEffect(() => {
    if (activeTab !== 'records') {
      fetchPolicies();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'salary-summary' && salaryEmployeeId) {
      fetchSalarySummary(salaryEmployeeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, salaryEmployeeId, month, year]);

  const handleMarkAtt = async () => {
    if (!attForm.employeeId) return toast.error('Select employee');
    try {
      const dateStr = attForm.date;
      await adminMarkAttendance({
        employeeId: attForm.employeeId,
        date: dateStr,
        checkInTime: `${dateStr}T${attForm.checkInTime}:00`,
        checkOutTime: `${dateStr}T${attForm.checkOutTime}:00`,
        status: attForm.status,
        notes: attForm.notes,
      });
      toast.success('Attendance marked');
      setShowAttModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Attendance Policy Operations
  const handleSaveAttendancePolicy = async (e) => {
    e.preventDefault();
    if (!attendanceForm.name) return toast.error('Policy name is required');
    try {
      if (editingAttendancePolicyId) {
        await updateAttendancePolicy(editingAttendancePolicyId, attendanceForm);
        toast.success('Attendance policy updated');
      } else {
        await createAttendancePolicy(attendanceForm);
        toast.success('Attendance policy created');
      }
      setShowAttendanceModal(false);
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance policy');
    }
  };

  const openEditAttendance = (policy) => {
    setEditingAttendancePolicyId(policy._id);
    setAttendanceForm({
      name: policy.name,
      shiftStartTime: policy.shiftStartTime,
      shiftEndTime: policy.shiftEndTime,
      graceTimeMinutes: policy.graceTimeMinutes,
      lateArrivalPenalty: policy.lateArrivalPenalty,
      lateBlockMinutes: policy.lateBlockMinutes || 30,
      earlyCheckoutPenalty: policy.earlyCheckoutPenalty,
      otRatePerBlock: policy.otRatePerBlock || 0,
      otBlockMinutes: policy.otBlockMinutes || 30,
      halfDayThresholdHours: policy.halfDayThresholdHours,
      absentDayDeduction: policy.absentDayDeduction || 0,
      isDefault: !!policy.isDefault
    });
    setShowAttendanceModal(true);
  };

  const openCreateAttendance = () => {
    setEditingAttendancePolicyId(null);
    setAttendanceForm({
      name: '',
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      graceTimeMinutes: 15,
      lateArrivalPenalty: 0,
      lateBlockMinutes: 30,
      earlyCheckoutPenalty: 0,
      otRatePerBlock: 100,
      otBlockMinutes: 30,
      halfDayThresholdHours: 4,
      absentDayDeduction: 0,
      isDefault: false
    });
    setShowAttendanceModal(true);
  };

  // Deletion logic
  const handlePolicyDeleteClick = (policy) => {
    setPolicyToDelete({ id: policy._id, name: policy.name });
    setDeleteModalOpen(true);
  };

  const handlePolicyDeleteConfirm = async () => {
    if (!policyToDelete) return;
    try {
      await deleteAttendancePolicy(policyToDelete.id);
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
        attendancePolicyId: employee.employeeInfo?.attendancePolicyId?._id || employee.employeeInfo?.attendancePolicyId || ''
      });
    } else {
      setAssignForm({ employeeIds: [], attendancePolicyId: '' });
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e) => {
    if (e) e.preventDefault();
    if (assignForm.employeeIds.length === 0 || !assignForm.attendancePolicyId) return;
    const isEffectivelyAll = employees.length > 0 && assignForm.employeeIds.length === employees.length;
    if (isEffectivelyAll && !showBulkAssignConfirm) {
      setShowBulkAssignConfirm(true);
      return;
    }
    try {
      await assignPoliciesToEmployee({
        employeeIds: assignForm.employeeIds,
        attendancePolicyId: assignForm.attendancePolicyId || null
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

  const departments = useMemo(() => {
    const deps = new Set(employees.map(e => e.employeeInfo?.department).filter(Boolean));
    return ['All', ...Array.from(deps)];
  }, [employees]);

  const roles = useMemo(() => {
    const rs = new Set(employees.map(e => e.role).filter(Boolean));
    return ['All', ...Array.from(rs)];
  }, [employees]);

  // Group by employee
  const summaryData = useMemo(() => {
    const byEmployee = {};
    
    employees.forEach(e => {
      byEmployee[e._id] = {
        name: e.name,
        role: e.role || '',
        department: e.employeeInfo?.department || '',
        present: 0, absent: 0, leave: 0, late: 0, totalHours: 0, overtime: 0
      };
    });

    records.forEach(r => {
      const id = r.employeeId?._id || r.employeeId;
      if (!byEmployee[id]) {
        byEmployee[id] = { name: r.employeeId?.name || 'Unknown', role: r.employeeId?.role || '', department: '', present: 0, absent: 0, leave: 0, late: 0, totalHours: 0, overtime: 0 };
      }
      if (r.status === 'present' || r.status === 'late') {
        byEmployee[id].totalHours += r.hoursWorked || 0;
        byEmployee[id].overtime += r.overtime || 0;
      }
      if (r.status === 'present') byEmployee[id].present++;
      else if (r.status === 'late') byEmployee[id].late++;
      else if (r.status === 'leave') byEmployee[id].leave++;
      else if (r.status === 'absent') byEmployee[id].absent++;
    });

    return Object.entries(byEmployee)
      .map(([id, d]) => ({ ...d, id }))
      .filter(e => (selectedRole === 'All' || e.role === selectedRole) && (selectedDepartment === 'All' || e.department === selectedDepartment))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, employees, selectedRole, selectedDepartment]);

  // Chart data
  const chartData = summaryData.map(e => ({ name: e.name.split(' ')[0], present: e.present, leave: e.leave, absent: e.absent }));

  const exportExcel = () => {
    const rows = summaryData.map(e => ({
      Employee: e.name,
      Role: e.role,
      Department: e.department,
      Present: e.present,
      Leave: e.leave,
      Absent: e.absent,
      Late: e.late,
      'Total Hours': e.totalHours.toFixed(1),
      Overtime: e.overtime.toFixed(1)
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance Report');
    XLSX.writeFile(workbook, `attendance_${month}_${year}.xlsx`);
    toast.success('Excel downloaded');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance Report - ${month}/${year}`, 14, 15);
    const head = [['Employee', 'Role', 'Department', 'Present', 'Leave', 'Absent', 'Late', 'Hours', 'Overtime']];
    const body = summaryData.map(e => [e.name, e.role, e.department, e.present, e.leave, e.absent, e.late, e.totalHours.toFixed(1), e.overtime.toFixed(1)]);
    
    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save(`attendance_${month}_${year}.pdf`);
    toast.success('PDF downloaded');
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Admin Dashboard">
        <div className="ds-loading"><div className="ds-spinner" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="ds-page">
        {/* Page Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Clock size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">HR &amp; Attendance</h1>
              <p className="ds-page-subtitle">Configure shift policies, grace time, leave deductions, and track employee hours</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            {activeTab === 'records' && (
              <>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowAttModal(true)} className="ds-btn ds-btn-primary">
                    <Clock size={14} /> Mark Attendance
                  </button>
                )}
                <button onClick={exportExcel} className="ds-btn ds-btn-secondary ds-btn-sm">
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={exportPDF} className="ds-btn ds-btn-secondary ds-btn-sm">
                  <FileText size={14} /> PDF
                </button>
              </>
            )}
            {activeTab === 'attendance-policies' && (
              <button onClick={openCreateAttendance} className="ds-btn ds-btn-primary">
                <Plus size={14} /> Create Policy
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="ds-card" style={{ padding: '0.375rem', width: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('my-attendance')}
              className={`ds-btn ds-btn-sm ${activeTab === 'my-attendance' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              My Attendance
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`ds-btn ds-btn-sm ${activeTab === 'records' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Team Records
            </button>
            <button
              onClick={() => setActiveTab('attendance-policies')}
              className={`ds-btn ds-btn-sm ${activeTab === 'attendance-policies' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Policies
            </button>
            <button
              onClick={() => setActiveTab('assign-policies')}
              className={`ds-btn ds-btn-sm ${activeTab === 'assign-policies' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Assign
            </button>
            <button
              onClick={() => setActiveTab('salary-summary')}
              className={`ds-btn ds-btn-sm ${activeTab === 'salary-summary' ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
            >
              Leave &amp; Salary Summary
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'my-attendance' && (
          <AttendanceDashboardView
            user={user}
            records={myRecords}
            activeBreak={activeBreak}
            loading={loading}
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
            onCheckIn={handleCheckInAction}
            onCheckOut={handleCheckOutAction}
            onStartBreak={handleStartBreakAction}
            onEndBreak={handleEndBreakAction}
            onMarkAttendanceModal={() => setShowAttModal(true)}
            onExportExcel={exportExcel}
            onExportPDF={exportPDF}
          />
        )}
        {activeTab === 'records' && (
          <>
            {/* KPI Summary Cards */}
            <div className="ds-stats" style={{ marginBottom: '1.25rem' }}>
              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <StoreIcon size={18} />
                  </div>
                  <span className="ds-stat-change blue">Staff</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Staff</p>
                  <p className="ds-stat-value">{summaryData.length}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <CheckCircle size={18} />
                  </div>
                  <span className="ds-stat-change up">Present</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Present</p>
                  <p className="ds-stat-value text-emerald-600">{summaryData.reduce((s, c) => s + (c.present || 0), 0)}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                    <Clock size={18} />
                  </div>
                  <span className="ds-stat-change amber">Leave</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Leaves</p>
                  <p className="ds-stat-value text-amber-600">{summaryData.reduce((s, c) => s + (c.leave || 0), 0)}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
                    <AlertCircle size={18} />
                  </div>
                  <span className="ds-stat-change down">Absent</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Absent</p>
                  <p className="ds-stat-value text-rose-600">{summaryData.reduce((s, c) => s + (c.absent || 0), 0)}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#f8fafc', color: '#334155' }}>
                    <Clock size={18} />
                  </div>
                  <span className="ds-stat-change neu">Recorded</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Hours</p>
                  <p className="ds-stat-value">{summaryData.reduce((s, c) => s + (c.totalHours || 0), 0).toFixed(1)}h</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="ds-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div className="ds-filter-bar" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="ds-label">Month</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))} className="ds-input ds-select">
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '90px' }}>
                  <label className="ds-label">Year</label>
                  <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="ds-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="ds-label">Department</label>
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="ds-input ds-select">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="ds-label">Store</label>
                  <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="ds-input ds-select">
                    <option value="All">All Stores</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="ds-label">Role</label>
                  <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="ds-input ds-select">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Chart */}
            {chartData.length > 0 && (
              <div className="ds-card" style={{ marginBottom: '1rem' }}>
                <div className="ds-card-header">
                  <h3 className="ds-card-title">Attendance Overview ({month}/{year})</h3>
                </div>
                <div className="ds-card-body">
                  <div style={{ minWidth: `${Math.max(chartData.length * 60, 600)}px`, height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }} interval={0} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }} iconType="circle" />
                        <Bar dataKey="present" fill="#10b981" name="Present" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        <Bar dataKey="leave" fill="#f59e0b" name="Leave" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Table */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h3 className="ds-card-title">Staff Attendance Summary</h3>
                <span className="ds-badge ds-badge-slate">{summaryData.length} records</span>
              </div>
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th style={{ textAlign: 'center' }}>Role / Dept</th>
                      <th style={{ textAlign: 'center' }}>Present</th>
                      <th style={{ textAlign: 'center' }}>Leave</th>
                      <th style={{ textAlign: 'center' }}>Absent</th>
                      <th style={{ textAlign: 'center' }}>Late</th>
                      <th style={{ textAlign: 'center' }}>Hours</th>
                      <th style={{ textAlign: 'right' }}>Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ds-text-muted)' }}>No attendance records found</td></tr>
                    ) : summaryData.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="ds-badge ds-badge-slate">{e.role}</span>
                          {e.department && <span className="ds-badge ds-badge-blue" style={{ marginLeft: '0.25rem' }}>{e.department}</span>}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#15803d' }}>{e.present}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#b45309' }}>{e.leave}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#be123c' }}>{e.absent}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>{e.late}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{e.totalHours.toFixed(1)}h</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>{e.overtime.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}


        {activeTab === 'attendance-policies' && (

          <div className="space-y-6">
            {policiesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-10 h-10 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin" />
              </div>
            ) : attendancePolicies.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-12 text-center text-xs uppercase tracking-wider font-bold text-slate-500 shadow-sm">
                No attendance policies found. Click "Create Policy" to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendancePolicies.map(p => (
                  <div key={p._id} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group">
                    {p.isDefault && (
                      <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 border-b border-l border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
                        System Default
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-5 pr-16">{p.name}</h3>
                      <div className="space-y-3 text-sm text-slate-600 mb-6">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Shift Schedule</span>
                          <span className="font-bold text-slate-800">{p.shiftStartTime} - {p.shiftEndTime}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Late Grace</span>
                          <span className="font-bold text-slate-800">{p.graceTimeMinutes} mins</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Late Fine</span>
                          <span className="font-bold text-rose-500">Rs. {p.lateArrivalPenalty.toLocaleString()} / {p.lateBlockMinutes || 30}m</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Checkout Fine</span>
                          <span className="font-bold text-rose-500">Rs. {p.earlyCheckoutPenalty.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500">OT Rate</span>
                          <span className="font-bold text-emerald-600">Rs. {(p.otRatePerBlock || 0).toLocaleString()} / {p.otBlockMinutes || 30}m</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Half-Day</span>
                          <span className="font-bold text-slate-800">&lt; {p.halfDayThresholdHours} hrs</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-500"> Absent Day Deduction</span>
                          <span className="font-bold text-rose-500">Rs. {(p.absentDayDeduction || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 pt-5 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAttendance(p)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handlePolicyDeleteClick(p, 'attendance')} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-200"><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'assign-policies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Bulk Policy Assignment</h3>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mt-1">Assign policies to all employees at once</p>
              </div>
              <button
                onClick={() => openAssignModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-wider font-bold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                Bulk Assign to All
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-slate-500 text-left">Employee</th>
                    <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-slate-500 text-left">Role</th>
                    <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-slate-500 text-left">Attendance Policy</th>
                    <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-slate-500 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.filter(e => e.role !== 'customer').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 font-bold text-slate-400 text-sm">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.filter(e => e.role !== 'customer').map(emp => {
                      const ap = attendancePolicies.find(p => p._id === (emp.employeeInfo?.attendancePolicyId?._id || emp.employeeInfo?.attendancePolicyId));
                      
                      return (
                        <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{emp.name}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{emp.role}</td>
                          <td className="px-6 py-4">
                            {ap ? (
                              <span className="bg-brand-indigo/10 text-brand-indigo px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold border border-brand-indigo/20">
                                {ap.name}
                              </span>
                            ) : (
                              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                System Default
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openAssignModal(emp)}
                              className="text-xs uppercase tracking-wider font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all"
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

        {activeTab === 'salary-summary' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Leave & Salary Summary</h3>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mt-1">Recomputed live from attendance/leave records — locked once payroll is processed for the month</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-56">
                  <EmployeeSelector
                    multiple={false}
                    employees={employees.filter(e => e.role !== 'customer')}
                    value={salaryEmployeeId ? [salaryEmployeeId] : []}
                    onChange={([id]) => setSalaryEmployeeId(id || '')}
                    placeholder="Select employee..."
                  />
                </div>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                  {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {!salaryEmployeeId ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">Select an employee to see their monthly attendance &amp; leave breakdown.</p>
              </div>
            ) : salarySummaryLoading ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">Loading...</p>
              </div>
            ) : salarySummary ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                {salarySummary.locked && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs uppercase font-bold tracking-wider px-4 py-2.5 rounded-xl">
                     Payroll already processed for this month — figures are the locked snapshot, not a live recalculation
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Off-Days Allowed</p>
                    <p className="text-2xl font-bold text-slate-900">{salarySummary.allowedLeaves ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Leave Days Taken</p>
                    <p className="text-2xl font-bold text-slate-900">{salarySummary.leaveDaysTaken ?? 0}</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-1">Extra Off-Days</p>
                    <p className="text-2xl font-bold text-rose-600">{salarySummary.extraOffDaysThisMonth ?? 0}</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-1">Unapproved Absences</p>
                    <p className="text-2xl font-bold text-rose-600">{salarySummary.unapprovedAbsences ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                  <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-1">Late Deduction</p>
                    <p className="text-xl font-bold text-rose-600">− Rs. {(salarySummary.lateDeductionTotal || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-1">Overtime Earned</p>
                    <p className="text-xl font-bold text-emerald-600">+ Rs. {(salarySummary.otEarnedTotal || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                    <p className="text-xs uppercase font-bold tracking-wider text-rose-500 mb-1">Total Deduction</p>
                    <p className="text-xl font-bold text-rose-600">Rs. {(salarySummary.attendanceDeductions || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Net Adjustment</p>
                    <p className="text-xl font-bold text-white">Rs. {((salarySummary.attendanceAllowance || 0) - (salarySummary.attendanceDeductions || 0)).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 m-0">Late deduction and OT are computed automatically from check-in/check-out and flow into Payroll on their own — see Financial Management &gt; Late Deductions / Overtime Pay for the day-by-day breakdown.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">No data for this employee/period.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAttModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Mark Attendance</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Record manual attendance for an employee</p>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">Search & Select Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees.filter(e => e.role !== 'customer')}
                  value={attForm.employeeId ? [attForm.employeeId] : []}
                  onChange={([id]) => setAttForm({ ...attForm, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Date</label>
                  <input type="date" value={attForm.date} onChange={(e) => setAttForm({...attForm, date: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Status</label>
                  <select value={attForm.status} onChange={(e) => setAttForm({...attForm, status: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Check In</label>
                  <input type="time" value={attForm.checkInTime} onChange={(e) => setAttForm({...attForm, checkInTime: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Check Out</label>
                  <input type="time" value={attForm.checkOutTime} onChange={(e) => setAttForm({...attForm, checkOutTime: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Notes</label>
                <input value={attForm.notes} onChange={(e) => setAttForm({...attForm, notes: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="Optional notes" />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAttModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleMarkAtt} className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Policy Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative sticky top-0 z-10">
              <button onClick={() => setShowAttendanceModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm text-xl">
                
              </div>
              <h3 className="font-bold text-slate-900 text-xl">{editingAttendancePolicyId ? 'Edit Policy' : 'Create Policy'}</h3>
            </div>
            
            <form onSubmit={handleSaveAttendancePolicy} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Policy Name *</label>
                <input
                  type="text"
                  required
                  value={attendanceForm.name}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, name: e.target.value })}
                  placeholder="e.g., Day Shift (Colombo)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Shift Start (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={attendanceForm.shiftStartTime}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, shiftStartTime: e.target.value })}
                    placeholder="09:00"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Shift End (HH:MM)</label>
                  <input
                    type="text"
                    required
                    value={attendanceForm.shiftEndTime}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, shiftEndTime: e.target.value })}
                    placeholder="17:00"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Late Grace (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.graceTimeMinutes}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, graceTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Half-Day Limit (Hrs)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.halfDayThresholdHours}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, halfDayThresholdHours: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Late Fine (Rs. per block)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.lateArrivalPenalty}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, lateArrivalPenalty: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Late Block Size (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={attendanceForm.lateBlockMinutes}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, lateBlockMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">OT Rate (Rs. per block)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.otRatePerBlock}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, otRatePerBlock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">OT Block Size (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={attendanceForm.otBlockMinutes}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, otBlockMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Early Out Fine (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.earlyCheckoutPenalty}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, earlyCheckoutPenalty: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-rose-600 block mb-2">Absent Day Deduction (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={attendanceForm.absentDayDeduction}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, absentDayDeduction: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 1500"
                  className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-sm font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all shadow-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Fixed amount deducted for each unapproved absent day (also used for extra off-days if no separate leave-policy fine is set)</p>
              </div>
              <div className="flex items-center gap-3 pt-2 bg-slate-100 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="attendanceDefault"
                  checked={attendanceForm.isDefault}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-indigo focus:ring-brand-indigo accent-brand-indigo cursor-pointer"
                />
                <label htmlFor="attendanceDefault" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Set as system default policy
                </label>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-slate-900/20 transition-all">
                  {editingAttendancePolicyId ? 'Update Policy' : 'Create Policy'}
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
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative flex-shrink-0">
              <button onClick={() => setShowAssignModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm text-xl">
                
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
                <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Select Attendance Policy *</label>
                {attendancePolicies.length > 6 && (
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
                  value={assignForm.attendancePolicyId}
                  onChange={(e) => setAssignForm({ ...assignForm, attendancePolicyId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                >
                  <option value="">Select a policy...</option>
                  {attendancePolicies
                    .filter((p) => p.name.toLowerCase().includes(policySearchQuery.toLowerCase()))
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.shiftStartTime} - {p.shiftEndTime}, grace: {p.graceTimeMinutes}m)
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignForm.employeeIds.length === 0 || !assignForm.attendancePolicyId}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-slate-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
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

    </DashboardLayout>
  );
};

export default AdminAttendance;
