import { useState, useEffect, useMemo } from 'react';
import EmployeePageHeader, { EmployeeTableWrap } from './EmployeePageHeader';
import {
  Clock, CheckCircle, X,
  FileSpreadsheet, FileText, Download,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import { adminMarkAttendance } from '../../services/api';
import API from '../../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-amber-100 text-amber-700',
  late: 'bg-orange-100 text-orange-700',
  'half-day': 'bg-blue-100 text-blue-700',
};

const now = new Date();

const EmployeeAttendance = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showAttModal, setShowAttModal] = useState(false);
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    status: 'present',
    notes: '',
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/hr/attendance', { params: { month, year } });
      setRecords(data);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const handleMarkAtt = async () => {
    if (!attForm.date) return toast.error('Select a date');
    try {
      const dateStr = attForm.date;
      await adminMarkAttendance({
        employeeId: user._id,
        date: dateStr,
        checkInTime: `${dateStr}T${attForm.checkInTime}:00`,
        checkOutTime: `${dateStr}T${attForm.checkOutTime}:00`,
        status: attForm.status,
        notes: attForm.notes,
      });
      toast.success('Attendance marked');
      setShowAttModal(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let totalHours = 0;
    let overtime = 0;

    records.forEach((r) => {
      if (r.status === 'present' || r.status === 'late' || r.status === 'half-day') present++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'absent') absent++;
      if (r.checkIn) {
        const h = new Date(r.checkIn).getHours();
        if (h >= 9) late++;
      }
      totalHours += r.hoursWorked || 0;
      overtime += r.overtime || 0;
    });

    return { present, absent, leave, late, totalHours, overtime };
  }, [records]);

  const chartData = useMemo(() => {
    const byDay = {};
    records.forEach((r) => {
      const day = new Date(r.date).getDate();
      const key = String(day);
      if (!byDay[key]) byDay[key] = { name: key, present: 0, leave: 0, absent: 0, hours: 0 };
      if (r.status === 'present' || r.status === 'late' || r.status === 'half-day') byDay[key].present = 1;
      else if (r.status === 'leave') byDay[key].leave = 1;
      else if (r.status === 'absent') byDay[key].absent = 1;
      byDay[key].hours = r.hoursWorked || 0;
    });
    return Object.values(byDay).sort((a, b) => Number(a.name) - Number(b.name));
  }, [records]);

  const exportExcel = () => {
    const rows = records.map((r) => ({
      Date: new Date(r.date).toLocaleDateString(),
      'Check In': r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      'Check Out': r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      Hours: r.hoursWorked?.toFixed(1) || '0',
      Overtime: r.overtime?.toFixed(1) || '0',
      Status: r.status,
    }));
    rows.push({});
    rows.push({
      Date: 'SUMMARY',
      'Check In': `Present: ${summary.present}`,
      'Check Out': `Leave: ${summary.leave}`,
      Hours: `Absent: ${summary.absent}`,
      Overtime: `Late: ${summary.late}`,
      Status: `Total: ${summary.totalHours.toFixed(1)}h`,
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'My Attendance');
    XLSX.writeFile(workbook, `my_attendance_${month}_${year}.xlsx`);
    toast.success('Excel downloaded');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`My Attendance - ${month}/${year}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`${user?.name || 'Employee'} (${user?.role || ''})`, 14, 22);
    autoTable(doc, {
      head: [['Date', 'Check In', 'Check Out', 'Hours', 'Overtime', 'Status']],
      body: records.map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.hoursWorked?.toFixed(1) || '0',
        r.overtime?.toFixed(1) || '0',
        r.status,
      ]),
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    const finalY = doc.lastAutoTable?.finalY || 40;
    doc.text(
      `Present: ${summary.present} | Leave: ${summary.leave} | Absent: ${summary.absent} | Late: ${summary.late} | Hours: ${summary.totalHours.toFixed(1)}h | OT: ${summary.overtime.toFixed(1)}h`,
      14,
      finalY + 10
    );
    doc.save(`my_attendance_${month}_${year}.pdf`);
    toast.success('PDF downloaded');
  };

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="TRACKING & SCHEDULING"
          title="Attendance Tracker"
          subtitle={`${records.length} records for ${month}/${year}`}
          icon={Clock}
          actions={
            <>
              <button
                onClick={() => setShowAttModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black px-3 sm:px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 border-0 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <Clock size={14} /> Mark Attendance
              </button>
              <button
                onClick={exportExcel}
                className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase tracking-wider font-black px-3 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                onClick={exportPDF}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10px] uppercase tracking-wider font-black px-3 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                <FileText size={14} /> PDF
              </button>
            </>
          }
        />

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-5 shadow-sm flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all cursor-pointer shadow-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 bg-white/80 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Present', value: summary.present, color: 'text-emerald-600' },
            { label: 'Leave', value: summary.leave, color: 'text-amber-600' },
            { label: 'Absent', value: summary.absent, color: 'text-rose-500' },
            { label: 'Late', value: summary.late, color: 'text-orange-500' },
            { label: 'Hours', value: `${summary.totalHours.toFixed(1)}h`, color: 'text-brand-indigo' },
            { label: 'Overtime', value: `${summary.overtime.toFixed(1)}h`, color: 'text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 p-4 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 m-0 mb-1">{s.label}</p>
              <p className={`text-xl font-black m-0 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {chartData.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
            <h2 className="font-black text-slate-900 text-lg mb-6 m-0">Attendance Overview</h2>
            <div className="overflow-x-auto overflow-y-hidden w-full custom-scrollbar">
              <div style={{ minWidth: `${Math.max(chartData.length * 40, 600)}px`, height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
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

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-xs sm:text-sm m-0 uppercase tracking-wider">Daily Records</h2>
            <Download size={14} className="text-slate-400" />
          </div>
          <EmployeeTableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-left">Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Check In</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Check Out</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-brand-indigo text-center">Hours</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-purple-600 text-center">Overtime</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] uppercase font-black tracking-wider text-slate-500 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 font-black text-slate-400 text-[11px] uppercase tracking-wider">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-black text-slate-900 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-bold text-slate-600">
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-bold text-slate-600">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-black text-brand-indigo">
                        {r.hoursWorked?.toFixed(1) || '—'}h
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-black text-purple-600">
                        {r.overtime ? `+${r.overtime.toFixed(1)}h` : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </EmployeeTableWrap>
        </div>
      </div>

      {/* Mark Attendance Modal — same as admin */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[92dvh] sm:max-h-[90vh]">
            <div className="px-5 sm:px-6 py-5 sm:py-6 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative shrink-0">
              <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mb-3" />
              <button
                onClick={() => setShowAttModal(false)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mb-3 sm:mb-4 border border-slate-200 shadow-sm">
                <Clock size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl m-0">Mark Attendance</h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2 m-0">
                Record your attendance for the day
              </p>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Employee</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">
                  {user?.name} ({user?.role})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Date</label>
                  <input
                    type="date"
                    value={attForm.date}
                    onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Status</label>
                  <select
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer"
                  >
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
                  <input
                    type="time"
                    value={attForm.checkInTime}
                    onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Check Out</label>
                  <input
                    type="time"
                    value={attForm.checkOutTime}
                    onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Notes</label>
                <input
                  value={attForm.notes}
                  onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAttModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-[10px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAtt}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-black shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <CheckCircle size={14} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeeAttendance;
