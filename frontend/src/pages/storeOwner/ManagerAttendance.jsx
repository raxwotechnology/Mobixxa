import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, Filter, Clock, CheckCircle, X, Users, UserCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
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
      toast.success('Successfully Clocked In! ⚡');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock In');
    }
  };

  const handleCheckOutAction = async () => {
    try {
      await checkOut();
      toast.success('Successfully Clocked Out! 🚪');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock Out');
    }
  };

  const handleStartBreakAction = async () => {
    try {
      const res = await startBreak();
      setActiveBreak(res.data || true);
      toast.info('Break Started ☕');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreakAction = async () => {
    try {
      await endBreak();
      setActiveBreak(null);
      toast.success('Break Ended ⚡');
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

  return (
    <DashboardLayout navItems={navItems} title="Manager Portal">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('my-attendance')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer border-x-0 border-t-0 bg-transparent ${
              activeTab === 'my-attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <UserCheck size={15} className="inline mr-2" /> My Attendance & Clocking
          </button>
          <button
            onClick={() => setActiveTab('team-report')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer border-x-0 border-t-0 bg-transparent ${
              activeTab === 'team-report'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Users size={15} className="inline mr-2" /> Team Attendance Summary ({employees.length})
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
            {/* Filters */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer">
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Year</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Department</label>
                <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer">
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider m-0">Employee Team Performance</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAttModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border-0 cursor-pointer"><Clock size={14} /> Mark Attendance</button>
                  <button onClick={exportExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer"><FileSpreadsheet size={14} /></button>
                  <button onClick={exportPDF} className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold px-3 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer"><FileText size={14} /></button>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="px-6 py-3.5 font-black uppercase text-slate-500">Employee</th>
                      <th className="px-6 py-3.5 font-black uppercase text-slate-500 text-center">Role / Dept</th>
                      <th className="px-6 py-3.5 font-black uppercase text-emerald-600 text-center">Present</th>
                      <th className="px-6 py-3.5 font-black uppercase text-purple-600 text-center">Leave</th>
                      <th className="px-6 py-3.5 font-black uppercase text-rose-500 text-center">Absent</th>
                      <th className="px-6 py-3.5 font-black uppercase text-orange-500 text-center">Late</th>
                      <th className="px-6 py-3.5 font-black uppercase text-blue-600 text-center">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 font-bold text-slate-400">No team attendance records found</td></tr>
                    ) : summaryData.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900">{e.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">{e.role}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-emerald-600">{e.present}</td>
                        <td className="px-6 py-4 text-center font-black text-purple-600">{e.leave}</td>
                        <td className="px-6 py-4 text-center font-black text-rose-500">{e.absent}</td>
                        <td className="px-6 py-4 text-center font-black text-orange-500">{e.late}</td>
                        <td className="px-6 py-4 text-center font-black text-blue-600">{e.totalHours.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-6 bg-slate-900 text-white relative">
              <button onClick={() => setShowAttModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors border-0 bg-transparent cursor-pointer">
                <X size={16} />
              </button>
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <h3 className="font-black text-lg m-0">Mark Attendance</h3>
              <p className="text-xs text-slate-300 mt-1 m-0">Record attendance for team members</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Employee *</label>
                <select value={attForm.employeeId} onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 bg-white cursor-pointer">
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Date</label>
                  <input type="date" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Status</label>
                  <select value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 bg-white cursor-pointer">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Check In</label>
                  <input type="time" value={attForm.checkInTime} onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Check Out</label>
                  <input type="time" value={attForm.checkOutTime} onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Notes</label>
                <input value={attForm.notes} onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800" placeholder="Optional notes" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAttModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs font-bold hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer">Cancel</button>
                <button onClick={handleMarkAtt} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"><CheckCircle size={15} /> Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManagerAttendance;
