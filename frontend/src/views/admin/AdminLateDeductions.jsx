'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, Download, Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getLateDeductions } from '../../services/api';
import API from '../../services/api';
import { toast } from 'react-toastify';

const AdminLateDeductions = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await getLateDeductions(params);
      setRecords(data);
    } catch (err) {
      toast.error('Failed to load late-deduction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    API.get('/admin/users')
      .then(({ data }) => setEmployees((data || []).filter(u => ['cashier', 'manager', 'deliveryGuy', 'stockEmployee'].includes(u.role))))
      .catch(() => {});
  }, []);
  useEffect(() => { fetchData(); }, [dateRange.startDate, dateRange.endDate]);

  const filteredRecords = records.filter(r =>
    r.employeeId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Per-employee monthly totals, derived from the same records the table
  // shows — one source of truth, no separate summary computation.
  const summary = useMemo(() => {
    const byEmployee = new Map();
    filteredRecords.forEach(r => {
      const id = r.employeeId?._id || 'unknown';
      if (!byEmployee.has(id)) {
        byEmployee.set(id, { employee: r.employeeId, totalLateMinutes: 0, totalDeduction: 0, recordCount: 0 });
      }
      const entry = byEmployee.get(id);
      entry.totalLateMinutes += r.lateMinutes || 0;
      entry.totalDeduction += r.lateDeduction || 0;
      entry.recordCount += 1;
    });
    return Array.from(byEmployee.values()).sort((a, b) => b.totalDeduction - a.totalDeduction);
  }, [filteredRecords]);

  const totalDeduction = filteredRecords.reduce((s, r) => s + (r.lateDeduction || 0), 0);
  const totalLateMinutes = filteredRecords.reduce((s, r) => s + (r.lateMinutes || 0), 0);

  const exportCSV = () => {
    const rows = [['Employee', 'Date', 'Check-in', 'Late Minutes', 'Deduction (Rs.)']];
    filteredRecords.forEach(r => {
      rows.push([
        r.employeeId?.name || 'Unknown',
        new Date(r.date).toLocaleDateString(),
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '',
        r.lateMinutes,
        r.lateDeduction,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `late_deductions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Late deductions exported!');
  };

  if (loading) {
    return (
      <DashboardLayout title="Late Deductions">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Late Deductions">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Clock size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="ds-page-title">Late Arrival Deductions</h1>
              <p className="ds-page-subtitle">Automatically computed from check-in time vs. shift start</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input type="date" value={dateRange.startDate} onChange={e => setDateRange(r => ({ ...r, startDate: e.target.value }))} className="ds-input py-2 px-3 text-xs w-auto" />
            <input type="date" value={dateRange.endDate} onChange={e => setDateRange(r => ({ ...r, endDate: e.target.value }))} className="ds-input py-2 px-3 text-xs w-auto" />
            <button onClick={exportCSV} className="ds-btn ds-btn-secondary">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ds-stat">
            <span className="ds-stat-label text-rose-600">Total Deducted</span>
            <div className="ds-stat-value text-rose-600">− Rs. {totalDeduction.toLocaleString()}</div>
            <p className="ds-stat-sub">Late fee deductions</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label">Total Late Minutes</span>
            <div className="ds-stat-value text-slate-900">{totalLateMinutes}m</div>
            <p className="ds-stat-sub">Across all employees</p>
          </div>
          <div className="ds-stat">
            <span className="ds-stat-label">Late Instances</span>
            <div className="ds-stat-value text-slate-900">{filteredRecords.length}</div>
            <p className="ds-stat-sub">Incidents recorded</p>
          </div>
        </div>

        {/* Per-employee summary */}
        <div className="ds-card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Employee Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="text-right">Late Minutes</th>
                  <th className="text-right">Total Deduction</th>
                  <th className="text-right">Instances</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold">
                          {s.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{s.employee?.name}</p>
                          <p className="text-[0.7rem] text-slate-400 capitalize">{s.employee?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-medium text-xs">{s.totalLateMinutes}m</td>
                    <td className="text-right font-bold text-xs text-rose-600">− Rs. {s.totalDeduction.toLocaleString()}</td>
                    <td className="text-right text-xs font-medium">{s.recordCount}</td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No late deductions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Records */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search by employee name..." value={search} onChange={e => setSearch(e.target.value)} className="ds-input pl-10 max-w-sm" />
          </div>
          <div className="ds-table-wrap">
            <div className="overflow-x-auto">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th className="text-right">Late</th>
                    <th className="text-right">Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r._id}>
                      <td className="font-semibold text-slate-900 text-xs">{r.employeeId?.name || 'Unknown'}</td>
                      <td className="text-slate-500 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="text-slate-500 text-xs">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="text-right text-xs font-medium">{r.lateMinutes}m</td>
                      <td className="text-right text-xs font-bold text-rose-600">− Rs. {(r.lateDeduction || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No late deductions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLateDeductions;
