'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import { adminMarkAttendance, checkIn, checkOut, startBreak, endBreak, getActiveBreak } from '../../services/api';
import API from '../../services/api';
import { toast } from 'react-toastify';
import AttendanceDashboardView from '../../components/AttendanceDashboardView';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const now = new Date();

const EmployeeAttendance = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
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
      const [{ data }, activeBrkRes] = await Promise.all([
        API.get('/hr/attendance', { params: { month, year } }),
        getActiveBreak().catch(() => ({ data: null })),
      ]);
      setRecords(data || []);
      setActiveBreak(activeBrkRes?.data || null);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const handleCheckInAction = async () => {
    try {
      await checkIn();
      toast.success('Successfully Clocked In! ⚡');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock In');
    }
  };

  const handleCheckOutAction = async () => {
    try {
      await checkOut();
      toast.success('Successfully Clocked Out! 🚪');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock Out');
    }
  };

  const handleStartBreakAction = async () => {
    try {
      const res = await startBreak();
      setActiveBreak(res.data || true);
      toast.info('Break Started ☕');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreakAction = async () => {
    try {
      await endBreak();
      setActiveBreak(null);
      toast.success('Break Ended ⚡');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end break');
    }
  };

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
      toast.success('Attendance marked successfully');
      setShowAttModal(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const exportExcel = () => {
    const rows = records.map((r) => ({
      Date: new Date(r.date).toLocaleDateString(),
      'Check In': r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      'Check Out': r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      'Break (Mins)': r.breakMinutes || 0,
      Hours: r.hoursWorked?.toFixed(1) || '0',
      Status: r.status,
    }));
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
      head: [['Date', 'Check In', 'Check Out', 'Break', 'Hours', 'Status']],
      body: records.map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.breakMinutes ? `${r.breakMinutes}m` : '—',
        r.hoursWorked?.toFixed(1) || '0',
        r.status,
      ]),
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`my_attendance_${month}_${year}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <AttendanceDashboardView
        user={user}
        records={records}
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
        onExportExcel={exportExcel}
        onExportPDF={exportPDF}
      />

      {/* Mark Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-6 bg-slate-900 text-white relative">
              <button
                onClick={() => setShowAttModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <h3 className="font-black text-lg m-0">Mark Attendance</h3>
              <p className="text-xs text-slate-300 mt-1 m-0">Record your daily attendance record</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Employee</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700">
                  {user?.name} ({user?.role})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={attForm.date}
                    onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Status</label>
                  <select
                    value={attForm.status}
                    onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                  >
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
                  <input
                    type="time"
                    value={attForm.checkInTime}
                    onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Check Out</label>
                  <input
                    type="time"
                    value={attForm.checkOutTime}
                    onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Notes</label>
                <input
                  value={attForm.notes}
                  onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAttModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-xs font-bold hover:bg-slate-200 text-slate-700 transition-all border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAtt}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <CheckCircle size={15} /> Submit
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
