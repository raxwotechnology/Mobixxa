'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock, Coffee, LogOut, LogIn, FileSpreadsheet, FileText, Calendar,
  CheckCircle, AlertTriangle, UserCheck, ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AttendanceDashboardView = ({
  user,
  records = [],
  loading = false,
  month,
  year,
  onMonthChange,
  onYearChange,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  onMarkAttendanceModal,
  onExportExcel,
  onExportPDF,
  activeBreak,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's attendance record
  const todayRecord = useMemo(() => {
    const todayStr = new Date().toDateString();
    return records.find((r) => new Date(r.date).toDateString() === todayStr);
  }, [records]);

  // Is clocked in, on break, clocked out
  const isClockedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);
  const isOnBreak = Boolean(activeBreak || todayRecord?.breakStart);
  const isClockedOut = Boolean(todayRecord?.checkOut);

  // Worked today time string calculation
  const workedTodayStr = useMemo(() => {
    if (!todayRecord?.checkIn) return 'Not Clocked In Yet';
    const checkInMs = new Date(todayRecord.checkIn).getTime();
    const endMs = todayRecord.checkOut ? new Date(todayRecord.checkOut).getTime() : currentTime.getTime();
    const breakMs = (todayRecord.breakMinutes || 0) * 60 * 1000;
    const diffMs = Math.max(0, endMs - checkInMs - breakMs);
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Worked today: ${hrs}h ${mins}m`;
  }, [todayRecord, currentTime]);

  // Monthly summary stats
  const summary = useMemo(() => {
    let present = 0;
    let halfDays = 0;
    let leavesTaken = 0;
    let absent = 0;
    let totalHours = 0;

    records.forEach((r) => {
      const st = (r.status || '').toLowerCase();
      if (st === 'present' || st === 'late') present++;
      else if (st === 'half-day') halfDays++;
      else if (st === 'leave') leavesTaken++;
      else if (st === 'absent') absent++;

      totalHours += r.hoursWorked || 0;
    });

    return { present, halfDays, leavesTaken, absent, totalHours };
  }, [records]);

  // Bar chart dataset
  const chartData = useMemo(() => {
    const byDay = {};
    records.forEach((r) => {
      const dayNum = new Date(r.date).getDate();
      const key = String(dayNum);
      if (!byDay[key]) {
        byDay[key] = { name: key, Present: 0, 'Half Day': 0, Late: 0, Absent: 0 };
      }
      const st = (r.status || '').toLowerCase();
      if (st === 'present') byDay[key].Present = 1;
      else if (st === 'half-day') byDay[key]['Half Day'] = 1;
      else if (st === 'late') byDay[key].Late = 1;
      else if (st === 'absent') byDay[key].Absent = 1;
    });
    return Object.values(byDay).sort((a, b) => Number(a.name) - Number(b.name));
  }, [records]);

  const handleAction = async (actionFn) => {
    if (!actionFn || actionLoading) return;
    try {
      setActionLoading(true);
      await actionFn();
    } finally {
      setActionLoading(false);
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  const formattedClock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Header Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight m-0">My Attendance</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 m-0 mt-1">Track your daily attendance and monthly summary.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onMarkAttendanceModal && (
            <button
              onClick={onMarkAttendanceModal}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
            >
              <Clock size={15} /> Mark Attendance
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Excel
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={15} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Real-time Clock Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">{formattedDate}</p>
          <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight m-0">{formattedClock}</div>
          <p className="text-xs font-bold text-slate-500 m-0 pt-1 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            <span>{workedTodayStr}</span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2">
            {isOnBreak ? (
              <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> On Break
              </span>
            ) : isClockedIn ? (
              <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In at {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : isClockedOut ? (
              <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Clocked Out Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Not Clocked In
              </span>
            )}
          </div>

          {/* Clocking Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Start / End Break Button */}
            {!isClockedOut && (
              <button
                onClick={() => handleAction(isOnBreak ? onEndBreak : onStartBreak)}
                disabled={actionLoading}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border ${
                  isOnBreak
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                }`}
              >
                <Coffee size={14} />
                <span>{isOnBreak ? 'End Break' : 'Start Break'}</span>
              </button>
            )}

            {/* Clock In / Out Main Button */}
            {isClockedIn && !isClockedOut ? (
              <button
                onClick={() => handleAction(onCheckOut)}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <LogOut size={15} />
                <span>Clock Out</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction(onCheckIn)}
                disabled={actionLoading || isClockedOut}
                className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border-0 ${
                  isClockedOut
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-[0_4px_16px_rgba(37,99,235,0.35)]'
                }`}
              >
                <LogIn size={15} />
                <span>{isClockedOut ? 'Clocked Out Today' : 'Clock In'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 Summary Stat Cards matching enterprise reference card format */}
      <div className="ds-stats">
        {/* PRESENT */}
        <div className="ds-stat">
          <div className="ds-stat-top">
            <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
              <CheckCircle size={18} />
            </div>
            <span className="ds-stat-change up">Present</span>
          </div>
          <div className="ds-stat-bottom">
            <p className="ds-stat-label">Present Days</p>
            <p className="ds-stat-value text-emerald-600">{summary.present}</p>
          </div>
        </div>

        {/* HALF DAYS */}
        <div className="ds-stat">
          <div className="ds-stat-top">
            <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <Clock size={18} />
            </div>
            <span className="ds-stat-change blue">Half Day</span>
          </div>
          <div className="ds-stat-bottom">
            <p className="ds-stat-label">Half Days</p>
            <p className="ds-stat-value text-blue-600">{summary.halfDays}</p>
          </div>
        </div>

        {/* LEAVES TAKEN */}
        <div className="ds-stat">
          <div className="ds-stat-top">
            <div className="ds-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Calendar size={18} />
            </div>
            <span className="ds-stat-change neu">Leave</span>
          </div>
          <div className="ds-stat-bottom">
            <p className="ds-stat-label">Leaves Taken</p>
            <p className="ds-stat-value text-purple-600">{summary.leavesTaken}</p>
          </div>
        </div>

        {/* ABSENT */}
        <div className="ds-stat">
          <div className="ds-stat-top">
            <div className="ds-stat-icon" style={{ background: '#fff1f2', color: '#be123c' }}>
              <ShieldAlert size={18} />
            </div>
            <span className="ds-stat-change down">Absent</span>
          </div>
          <div className="ds-stat-bottom">
            <p className="ds-stat-label">Absent Days</p>
            <p className="ds-stat-value text-rose-600">{summary.absent}</p>
          </div>
        </div>

        {/* TOTAL HOURS */}
        <div className="ds-stat">
          <div className="ds-stat-top">
            <div className="ds-stat-icon" style={{ background: '#f8fafc', color: '#334155' }}>
              <Clock size={18} />
            </div>
            <span className="ds-stat-change neu">Logged</span>
          </div>
          <div className="ds-stat-bottom">
            <p className="ds-stat-label">Total Hours</p>
            <p className="ds-stat-value">{summary.totalHours.toFixed(1)}h</p>
          </div>
        </div>
      </div>

      {/* Month & Year Filter Bar */}
      <div className="ds-card" style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} className="text-slate-400" />
            <span className="ds-label" style={{ margin: 0 }}>Month</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="ds-input ds-select"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="ds-label" style={{ margin: 0 }}>Year</span>
            <input
              type="number"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="ds-input"
              style={{ width: '90px' }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Attendance Trend Chart */}
      <div className="ds-card">
        <div className="ds-card-header">
          <h3 className="ds-card-title">Monthly Attendance Trend</h3>
          <span className="ds-badge ds-badge-slate">{records.length} Recorded Days</span>
        </div>
        <div className="ds-card-body">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: '700' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: '700' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }} iconType="circle" />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Half Day" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Late" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Records Table */}
      <div className="ds-card">
        <div className="ds-card-header">
          <h3 className="ds-card-title">Attendance History Records</h3>
          <span className="ds-badge ds-badge-slate">{records.length} Entries</span>
        </div>

        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Clock In</th>
                <th style={{ textAlign: 'center' }}>Clock Out</th>
                <th style={{ textAlign: 'center' }}>Break</th>
                <th style={{ textAlign: 'right' }}>Worked</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="ds-loading"><div className="ds-spinner" /></div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ds-text-muted)' }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const dateObj = new Date(r.date);
                  const dateFormatted = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const st = (r.status || 'present').toLowerCase();
                  let badgeClass = 'ds-badge ds-badge-green';
                  if (st === 'half-day') badgeClass = 'ds-badge ds-badge-blue';
                  else if (st === 'late') badgeClass = 'ds-badge ds-badge-amber';
                  else if (st === 'leave') badgeClass = 'ds-badge ds-badge-violet';
                  else if (st === 'absent') badgeClass = 'ds-badge ds-badge-red';

                  const checkInFormatted = r.checkIn
                    ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  const checkOutFormatted = r.checkOut
                    ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  const breakStr = r.breakMinutes > 0 ? `${r.breakMinutes}m` : '—';
                  const workedStr = r.hoursWorked > 0 ? `${r.hoursWorked.toFixed(1)}h` : '—';

                  return (
                    <tr key={r._id || idx}>
                      <td style={{ fontWeight: 600 }}>{dateFormatted}</td>
                      <td>
                        <span className={badgeClass}>
                          {r.status || 'Present'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{checkInFormatted}</td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{checkOutFormatted}</td>
                      <td style={{ textAlign: 'center', color: 'var(--ds-text-muted)' }}>{breakStr}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{workedStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboardView;
