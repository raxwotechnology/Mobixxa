import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, Filter, Store as StoreIcon, Clock, CheckCircle, X, Plus, Edit2, Trash2, ShieldAlert, AlertCircle } from 'lucide-react';

import DashboardLayout from '../../components/DashboardLayout';
import {
  getAttendanceReport, getEmployees, getStores, adminMarkAttendance,
  getLeavePolicies, createLeavePolicy, updateLeavePolicy, deleteLeavePolicy,
  getAttendancePolicies, createAttendancePolicy, updateAttendancePolicy, deleteAttendancePolicy,
  assignPoliciesToEmployee, assignPoliciesToAllEmployees
} from '../../services/api';
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
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('All');
  
  const [showAttModal, setShowAttModal] = useState(false);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [attForm, setAttForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], checkInTime: '09:00', checkOutTime: '17:00', status: 'present', notes: '' });

  // Policy Management States
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'attendance-policies' | 'assign-policies'
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
    earlyCheckoutPenalty: 0,
    halfDayThresholdHours: 4,
    isDefault: false
  });

  // Assign Policy Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignConfirm, setShowBulkAssignConfirm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    employeeName: '',
    attendancePolicyId: ''
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null); // { id, name }

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (selectedStore !== 'All') params.storeId = selectedStore;
      
      const [attRes, empRes, storeRes] = await Promise.all([
        getAttendanceReport(params),
        getEmployees(),
        getStores(),
      ]);
      setRecords(attRes.data);
      setEmployees(empRes.data);
      setStores(storeRes.data || []);
    } catch (err) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
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
      earlyCheckoutPenalty: policy.earlyCheckoutPenalty,
      halfDayThresholdHours: policy.halfDayThresholdHours,
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
      earlyCheckoutPenalty: 0,
      halfDayThresholdHours: 4,
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
    if (employee) {
      setAssignForm({
        employeeId: employee._id,
        employeeName: employee.name,
        attendancePolicyId: employee.employeeInfo?.attendancePolicyId?._id || employee.employeeInfo?.attendancePolicyId || ''
      });
    } else {
      setAssignForm({
        employeeId: 'all',
        employeeName: 'All Employees',
        attendancePolicyId: ''
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
          attendancePolicyId: assignForm.attendancePolicyId || null
        });
        toast.success('Attendance policy assigned to all employees successfully');
        setShowBulkAssignConfirm(false);

      } else {
        await assignPoliciesToEmployee({
          employeeId: assignForm.employeeId,
          attendancePolicyId: assignForm.attendancePolicyId || null
        });
        toast.success('Attendance policy assigned successfully');
      }
      setShowAssignModal(false);
      // Refresh employees list
      const empRes = await getEmployees();
      setEmployees(empRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign policies');
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
      if (r.status === 'present') { byEmployee[id].present++; byEmployee[id].totalHours += r.hoursWorked || 0; byEmployee[id].overtime += r.overtime || 0; }
      else if (r.status === 'leave') byEmployee[id].leave++;
      else if (r.status === 'absent') byEmployee[id].absent++;
      if (r.checkIn) { const h = new Date(r.checkIn).getHours(); if (h >= 9) byEmployee[id].late++; }
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

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Dashboard"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                USER & EMPLOYEE MANAGEMENT
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 m-0">HR & Attendance</h1>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">Configure shift times, leaves, and track employee hours</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {activeTab === 'records' && (
              <>
                <button onClick={() => setShowAttModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"><Clock size={14} /> Mark Attendance</button>
                <button onClick={exportExcel} className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"><FileSpreadsheet size={14} /> Excel</button>
                <button onClick={exportPDF} className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"><FileText size={14} /> PDF</button>
              </>
            )}
            {activeTab === 'attendance-policies' && (
              <button onClick={openCreateAttendance} className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"><Plus size={14} /> Create Policy</button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 flex-wrap mb-6 bg-white/40 backdrop-blur-sm p-2 rounded-2xl border border-white/40 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2.5 text-[10px] uppercase font-black tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'records' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
            }`}
          >
            📋 Records
          </button>
          <button
            onClick={() => setActiveTab('attendance-policies')}
            className={`px-4 py-2.5 text-[10px] uppercase font-black tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'attendance-policies' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
            }`}
          >
            ⏱️ Policies
          </button>
          <button
            onClick={() => setActiveTab('assign-policies')}
            className={`px-4 py-2.5 text-[10px] uppercase font-black tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'assign-policies' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
            }`}
          >
            👤 Assign
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'records' && (
          <>
            {/* Filters */}
            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-5 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Year</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Department</label>
                <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="w-40 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Store</label>
                <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="w-40 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
                  <option value="All">All Stores</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="w-40 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Attendance Chart */}
            {chartData.length > 0 && (
              <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm mb-6">
                <h2 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2"><span className="text-xl">📊</span> Attendance Overview</h2>
                <div className="overflow-x-auto overflow-y-hidden w-full custom-scrollbar">
                  <div style={{ minWidth: `${Math.max(chartData.length * 60, 600)}px`, height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }} interval={0} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#64748b' }} iconType="circle" />
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Employee</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Role/Dept</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-emerald-600 text-center">Present</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-amber-600 text-center">Leave</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-rose-500 text-center">Absent</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-orange-500 text-center">Late</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-brand-indigo text-center">Hours</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-purple-600 text-center">Overtime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 font-black text-slate-400 text-[11px] uppercase tracking-wider">No attendance records found</td></tr>
                    ) : summaryData.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900">{e.name}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">{e.role}</span>
                            {e.department && <span className="text-[9px] uppercase tracking-wider font-black bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded-md">{e.department}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-emerald-600">{e.present}</td>
                        <td className="px-6 py-4 text-center font-black text-amber-600">{e.leave}</td>
                        <td className="px-6 py-4 text-center font-black text-rose-500">{e.absent}</td>
                        <td className="px-6 py-4 text-center font-black text-orange-500">{e.late}</td>
                        <td className="px-6 py-4 text-center font-black text-brand-indigo">{e.totalHours.toFixed(1)}h</td>
                        <td className="px-6 py-4 text-center font-black text-purple-600">{e.overtime.toFixed(1)}h</td>
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
              <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-12 text-center text-[11px] uppercase tracking-wider font-black text-slate-500 shadow-sm">
                No attendance policies found. Click "Create Policy" to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendancePolicies.map(p => (
                  <div key={p._id} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group">
                    {p.isDefault && (
                      <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 border-b border-l border-emerald-100 text-[9px] font-black px-3 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
                        System Default
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-slate-800 text-lg mb-5 pr-16">{p.name}</h3>
                      <div className="space-y-3 text-sm text-slate-600 mb-6">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">⏰ Shift Schedule</span>
                          <span className="font-black text-slate-800">{p.shiftStartTime} - {p.shiftEndTime}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">⏱️ Late Grace</span>
                          <span className="font-black text-slate-800">{p.graceTimeMinutes} mins</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">⚠️ Check-in Fine</span>
                          <span className="font-black text-rose-500">Rs. {p.lateArrivalPenalty.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">🚶 Checkout Fine</span>
                          <span className="font-black text-rose-500">Rs. {p.earlyCheckoutPenalty.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">⚖️ Half-Day</span>
                          <span className="font-black text-slate-800">&lt; {p.halfDayThresholdHours} hrs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 pt-5 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditAttendance(p)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black flex items-center justify-center gap-1.5 transition-all"><Edit2 size={12} /> Edit</button>
                      <button onClick={() => handlePolicyDeleteClick(p, 'attendance')} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black flex items-center justify-center gap-1.5 transition-all border border-rose-200"><Trash2 size={12} /> Delete</button>
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
                <h3 className="font-black text-slate-900 text-lg">Bulk Policy Assignment</h3>
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-500 mt-1">Assign policies to all employees at once</p>
              </div>
              <button
                onClick={() => openAssignModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black px-6 py-3 rounded-xl transition-all shadow-md"
              >
                Bulk Assign to All
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Employee</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Role</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Attendance Policy</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Action</th>
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
                          <td className="px-6 py-4 font-black text-slate-900">{emp.name}</td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">{emp.role}</td>
                          <td className="px-6 py-4">
                            {ap ? (
                              <span className="bg-brand-indigo/10 text-brand-indigo px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black border border-brand-indigo/20">
                                {ap.name}
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-black bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                System Default
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openAssignModal(emp)}
                              className="text-[10px] uppercase tracking-wider font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all"
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

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAttModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                <Clock size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-xl">Mark Attendance</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">Record manual attendance for an employee</p>
            </div>
            
            <div className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Search & Select Employee *</label>
                <input
                  type="text"
                  placeholder="🔍 Type name or role to search..."
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs mb-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
                />
                <select
                  value={attForm.employeeId}
                  onChange={(e) => setAttForm({...attForm, employeeId: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                >
                  <option value="">Select employee ({employees.filter(e => e.role !== 'customer').length} available)</option>
                  {employees
                    .filter(e => e.role !== 'customer')
                    .filter(e => e.name?.toLowerCase().includes(empSearchQuery.toLowerCase()) || e.role?.toLowerCase().includes(empSearchQuery.toLowerCase()))
                    .map(e => (
                      <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Date</label>
                  <input type="date" value={attForm.date} onChange={(e) => setAttForm({...attForm, date: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Status</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Check In</label>
                  <input type="time" value={attForm.checkInTime} onChange={(e) => setAttForm({...attForm, checkInTime: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Check Out</label>
                  <input type="time" value={attForm.checkOutTime} onChange={(e) => setAttForm({...attForm, checkOutTime: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Notes</label>
                <input value={attForm.notes} onChange={(e) => setAttForm({...attForm, notes: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="Optional notes" />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAttModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button onClick={handleMarkAtt} className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Policy Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative sticky top-0 z-10">
              <button onClick={() => setShowAttendanceModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm text-xl">
                ⏱️
              </div>
              <h3 className="font-black text-slate-900 text-xl">{editingAttendancePolicyId ? 'Edit Policy' : 'Create Policy'}</h3>
            </div>
            
            <form onSubmit={handleSaveAttendancePolicy} className="p-6 bg-slate-50/50 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Policy Name *</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Shift Start (HH:MM)</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Shift End (HH:MM)</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Late Grace (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.graceTimeMinutes}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, graceTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Half-Day Limit (Hrs)</label>
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
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Check-in Fine (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.lateArrivalPenalty}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, lateArrivalPenalty: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Early Out Fine (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={attendanceForm.earlyCheckoutPenalty}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, earlyCheckoutPenalty: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 bg-slate-100 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="attendanceDefault"
                  checked={attendanceForm.isDefault}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-indigo focus:ring-brand-indigo accent-brand-indigo cursor-pointer"
                />
                <label htmlFor="attendanceDefault" className="text-xs font-black text-slate-700 cursor-pointer select-none">
                  Set as system default policy
                </label>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-slate-900/20 transition-all">
                  {editingAttendancePolicyId ? 'Update Policy' : 'Create Policy'}
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
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
              <button onClick={() => setShowAssignModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm text-xl">
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
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Select Attendance Policy</label>
                <select
                  value={assignForm.attendancePolicyId}
                  onChange={(e) => setAssignForm({ ...assignForm, attendancePolicyId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                >
                  <option value="">System Default</option>
                  {attendancePolicies.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.shiftStartTime} - {p.shiftEndTime}, grace: {p.graceTimeMinutes}m)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-slate-900/20 transition-all">
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

export default AdminAttendance;
