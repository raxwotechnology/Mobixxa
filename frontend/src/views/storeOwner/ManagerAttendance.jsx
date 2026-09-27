'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, Filter, Clock, CheckCircle, X, Users, UserCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { getAttendanceReport, getEmployees, adminMarkAttendance, checkIn, checkOut, startBreak, endBreak, getMyAttendance, getActiveBreak } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { managerNavGroups as navItems } from './managerNavItems';
import useAuthStore from '../../store/authStore';
import AttendanceDashboardView from '../../components/AttendanceDashboardView';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const now = new Date();

const ManagerAttendance = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('my-attendance'); // 'my-attendance' | 'team-report'
  const [records, setRecords] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const [showAttModal, setShowAttModal] = useState(false);
  const [attForm, setAttForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], checkInTime: '09:00', checkOutTime: '17:00', status: 'present', notes: '' });

  useEffect(() => { fetchData(); }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes, myAttRes, activeBrkRes] = await Promise.all([
        getAttendanceReport({ month, year }),
        getEmployees(),
        getMyAttendance({ month, year }),
        getActiveBreak().catch(() => ({ data: null })),
      ]);
      setRecords(attRes.data || []);
      setEmployees(empRes.data || []);
      setMyRecords(myAttRes.data || []);
      setActiveBreak(activeBrkRes?.data || null);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
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

  const exportExcel = () => {
    const rows = summaryData.map((e) => ({
      Employee: e.name,
      Role: e.role,
      Department: e.department,
      Present: e.present,
      Leave: e.leave,
      Absent: e.absent,
      Late: e.late,
      'Hours Worked': e.totalHours.toFixed(1),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Team Attendance');
    XLSX.writeFile(workbook, `manager_team_attendance_${month}_${year}.xlsx`);
    toast.success('Excel downloaded');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Manager Team Attendance - ${month}/${year}`, 14, 15);
    autoTable(doc, {
      head: [['Employee', 'Role', 'Dept', 'Present', 'Leave', 'Absent', 'Late', 'Hours']],
      body: summaryData.map((e) => [
        e.name, e.role, e.department || '—', e.present, e.leave, e.absent, e.late, `${e.totalHours.toFixed(1)}h`
      ]),
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`manager_team_attendance_${month}_${year}.pdf`);
    toast.success('PDF downloaded');
  };

  const totalPresent = summaryData.reduce((sum, curr) => sum + curr.present, 0);
  const totalAbsent = summaryData.reduce((sum, curr) => sum + curr.absent, 0);
  const totalLate = summaryData.reduce((sum, curr) => sum + curr.late, 0);

  return (
    <DashboardLayout navItems={navItems} title="Manager Portal">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Clock size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Team Attendance</h1>
              <p className="ds-page-subtitle">Manage and view team attendance records</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-200 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('my-attendance')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer border-x-0 border-t-0 bg-transparent ${
              activeTab === 'my-attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <UserCheck size={15} className="inline mr-2" /> My Attendance
          </button>
          <button
            onClick={() => setActiveTab('team-report')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer border-x-0 border-t-0 bg-transparent ${
              activeTab === 'team-report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Users size={15} className="inline mr-2" /> Team Summary ({employees.length})
          </button>
        </div>

        {activeTab === 'my-attendance' ? (
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
        ) : (
          <div className="space-y-6">
            <div className="ds-stats">
              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                    <Users size={18} />
                  </div>
                  <span className="ds-stat-change blue">Team</span>
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
                  <p className="ds-stat-value text-emerald-600">{totalPresent}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
                    <X size={18} />
                  </div>
                  <span className="ds-stat-change down">Absent</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Absent</p>
                  <p className="ds-stat-value text-rose-600">{totalAbsent}</p>
                </div>
              </div>

              <div className="ds-stat">
                <div className="ds-stat-top">
                  <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                    <Clock size={18} />
                  </div>
                  <span className="ds-stat-change amber">Late</span>
                </div>
                <div className="ds-stat-bottom">
                  <p className="ds-stat-label">Total Late</p>
                  <p className="ds-stat-value text-amber-600">{totalLate}</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="ds-card">
              <div className="ds-filter-bar">
                <div className="ds-form-group">
                  <label className="ds-label">Month</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))} className="ds-select">
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                  </select>
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Year</label>
                  <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="ds-input w-24" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Department</label>
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="ds-select">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Role</label>
                  <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="ds-select">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h3 className="ds-card-title">Employee Team Performance</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAttModal(true)} className="ds-btn ds-btn-primary ds-btn-sm"><Clock size={14} /> Mark Attendance</button>
                  <button onClick={exportExcel} className="ds-btn ds-btn-secondary ds-btn-sm ds-btn-icon"><FileSpreadsheet size={14} /></button>
                  <button onClick={exportPDF} className="ds-btn ds-btn-secondary ds-btn-sm ds-btn-icon"><FileText size={14} /></button>
                </div>
              </div>
              <div className="ds-card-body p-0">
                <div className="ds-table-wrap">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Role / Dept</th>
                        <th className="text-center">Present</th>
                        <th className="text-center">Leave</th>
                        <th className="text-center">Absent</th>
                        <th className="text-center">Late</th>
                        <th className="text-center">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.length === 0 ? (
                        <tr><td colSpan={7} className="ds-empty">No team attendance records found</td></tr>
                      ) : summaryData.map(e => (
                        <tr key={e.id}>
                          <td className="font-bold">{e.name}</td>
                          <td><span className="ds-badge ds-badge-slate">{e.role}</span></td>
                          <td className="text-center"><span className="ds-badge ds-badge-green">{e.present}</span></td>
                          <td className="text-center"><span className="ds-badge ds-badge-blue">{e.leave}</span></td>
                          <td className="text-center"><span className="ds-badge ds-badge-red">{e.absent}</span></td>
                          <td className="text-center"><span className="ds-badge ds-badge-amber">{e.late}</span></td>
                          <td className="text-center font-bold text-blue-600">{e.totalHours.toFixed(1)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <div className="ds-modal-header">
              <div>
                <h3 className="ds-modal-title">Mark Attendance</h3>
                <p className="text-xs text-slate-500 mt-1">Record attendance for team members</p>
              </div>
              <button onClick={() => setShowAttModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon">
                <X size={16} />
              </button>
            </div>

            <div className="ds-modal-body space-y-4">
              <div className="ds-form-group">
                <label className="ds-label">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={attForm.employeeId ? [attForm.employeeId] : []}
                  onChange={([id]) => setAttForm({ ...attForm, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="ds-form-group">
                  <label className="ds-label">Date</label>
                  <input type="date" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Status</label>
                  <select value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })} className="ds-select">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="ds-form-group">
                  <label className="ds-label">Check In</label>
                  <input type="time" value={attForm.checkInTime} onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })} className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Check Out</label>
                  <input type="time" value={attForm.checkOutTime} onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })} className="ds-input" />
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Notes</label>
                <input value={attForm.notes} onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })} className="ds-input" placeholder="Optional notes" />
              </div>
            </div>
            <div className="ds-modal-footer">
              <button type="button" onClick={() => setShowAttModal(false)} className="ds-btn ds-btn-secondary">Cancel</button>
              <button onClick={handleMarkAtt} className="ds-btn ds-btn-primary"><CheckCircle size={15} /> Submit</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManagerAttendance;
