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
      toast.success('Successfully Clocked In!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock In');
    }
  };

  const handleCheckOutAction = async () => {
    try {
      await checkOut();
      toast.success('Successfully Clocked Out!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to Clock Out');
    }
  };

  const handleStartBreakAction = async () => {
    try {
      const res = await startBreak();
      setActiveBreak(res.data || true);
      toast.info('Break Started');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    }
  };

  const handleEndBreakAction = async () => {
    try {
      await endBreak();
      setActiveBreak(null);
      toast.success('Break Ended');
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
      <div className="ds-page">
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
          <div className="ds-modal-overlay">
            <div className="ds-modal">
              <div className="ds-modal-header">
                <h2 className="ds-modal-title">
                  <Clock size={18} /> Mark Attendance
                </h2>
                <button
                  onClick={() => setShowAttModal(false)}
                  className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="ds-modal-body">
                <div className="ds-form-group">
                  <label className="ds-label">Employee</label>
                  <div className="ds-input" style={{ pointerEvents: 'none', opacity: 0.8, background: 'var(--ds-border-soft)' }}>
                    {user?.name} ({user?.role})
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Date</label>
                    <input
                      type="date"
                      className="ds-input"
                      value={attForm.date}
                      onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Status</label>
                    <select
                      className="ds-input ds-select"
                      value={attForm.status}
                      onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
                      <option value="late">Late</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Check In</label>
                    <input
                      type="time"
                      className="ds-input"
                      value={attForm.checkInTime}
                      onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                    />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Check Out</label>
                    <input
                      type="time"
                      className="ds-input"
                      value={attForm.checkOutTime}
                      onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ds-form-group">
                  <label className="ds-label">Notes</label>
                  <input
                    className="ds-input"
                    value={attForm.notes}
                    onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="ds-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAttModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAtt}
                  className="ds-btn ds-btn-primary"
                >
                  <CheckCircle size={15} /> Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeAttendance;
