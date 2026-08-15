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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight m-0">My Attendance</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 m-0 mt-1">Track your daily attendance and monthly summary.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onMarkAttendanceModal && (
            <button
              onClick={onMarkAttendanceModal}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 border-0 cursor-pointer"
            >
              <Clock size={15} /> Mark Attendance
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet size={15} /> Excel
            </button>
          )}
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={15} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Real-time Clock Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider m-0">{formattedDate}</p>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight m-0">{formattedClock}</div>
          <p className="text-xs font-bold text-slate-500 m-0 pt-1 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            <span>{workedTodayStr}</span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2">
            {isOnBreak ? (
              <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> On Break
              </span>
            ) : isClockedIn ? (
              <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-xs">
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
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-black'
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
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <LogOut size={15} />
                <span>Clock Out</span>
              </button>
            ) : (
              <button
                onClick={() => handleAction(onCheckIn)}
                disabled={actionLoading || isClockedOut}
                className={`font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border-0 ${
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

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PRESENT */}
        <div className="bg-emerald-50/60 border-t-4 border-t-emerald-500 border-x border-b border-emerald-200/80 rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider m-0 mb-1">PRESENT</p>
          <p className="text-3xl font-black text-emerald-900 m-0">{summary.present}</p>
        </div>

        {/* HALF DAYS */}
        <div className="bg-blue-50/60 border-t-4 border-t-blue-500 border-x border-b border-blue-200/80 rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <p className="text-[11px] font-black text-blue-800 uppercase tracking-wider m-0 mb-1">HALF DAYS</p>
          <p className="text-3xl font-black text-blue-900 m-0">{summary.halfDays}</p>
        </div>

        {/* LEAVES TAKEN */}
        <div className="bg-purple-50/60 border-t-4 border-t-purple-500 border-x border-b border-purple-200/80 rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <p className="text-[11px] font-black text-purple-800 uppercase tracking-wider m-0 mb-1">LEAVES TAKEN</p>
          <p className="text-3xl font-black text-purple-900 m-0">{summary.leavesTaken}</p>
        </div>

        {/* ABSENT */}
        <div className="bg-rose-50/60 border-t-4 border-t-rose-500 border-x border-b border-rose-200/80 rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider m-0 mb-1">ABSENT</p>
          <p className="text-3xl font-black text-rose-900 m-0">{summary.absent}</p>
        </div>
      </div>

      {/* Month & Year Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Month</span>
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Monthly Attendance Trend Chart */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-black text-slate-900 text-base m-0 mb-6 tracking-tight">Monthly Attendance Trend</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: '700' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: '700' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }} iconType="circle" />
              <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Half Day" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Late" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Records Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider m-0">Attendance History Records</h3>
          <span className="text-xs font-bold text-slate-400">{records.length} Entries</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider">DATE</th>
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider">STATUS</th>
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider text-center">CLOCK IN</th>
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider text-center">CLOCK OUT</th>
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider text-center">BREAK</th>
                <th className="px-6 py-3.5 font-black uppercase text-slate-500 tracking-wider text-right">WORKED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 font-bold text-slate-400">Loading attendance data...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 font-bold text-slate-400">No attendance records found for this period.</td>
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
                  let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  if (st === 'half-day') badgeStyle = 'bg-blue-100 text-blue-800 border-blue-200';
                  else if (st === 'late') badgeStyle = 'bg-orange-100 text-orange-800 border-orange-200';
                  else if (st === 'leave') badgeStyle = 'bg-purple-100 text-purple-800 border-purple-200';
                  else if (st === 'absent') badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';

                  const checkInFormatted = r.checkIn
                    ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  const checkOutFormatted = r.checkOut
                    ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  const breakStr = r.breakMinutes > 0 ? `${r.breakMinutes}m` : '—';
                  const workedStr = r.hoursWorked > 0 ? `${r.hoursWorked.toFixed(1)}h` : '—';

                  return (
                    <tr key={r._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{dateFormatted}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                          {r.status || 'Present'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-center whitespace-nowrap">{checkInFormatted}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-center whitespace-nowrap">{checkOutFormatted}</td>
                      <td className="px-6 py-4 font-semibold text-slate-500 text-center whitespace-nowrap">{breakStr}</td>
                      <td className="px-6 py-4 font-black text-slate-900 text-right whitespace-nowrap">{workedStr}</td>
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
