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
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">⚠️ Late Arrival Deductions</h1>
            <p className="text-muted-text text-sm mt-1">Automatically computed from check-in time vs. shift start</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="date" value={dateRange.startDate} onChange={e => setDateRange(r => ({ ...r, startDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm bg-white" />
            <input type="date" value={dateRange.endDate} onChange={e => setDateRange(r => ({ ...r, endDate: e.target.value }))} className="border border-card-border rounded-xl py-2 px-3 text-sm bg-white" />
            <button onClick={exportCSV} className="flex items-center gap-2 border border-card-border text-dark-navy px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-red-600">− Rs. {totalDeduction.toLocaleString()}</p>
            <p className="text-xs text-muted-text mt-1">Total Deducted</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-2">
              <Clock size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-dark-navy">{totalLateMinutes}m</p>
            <p className="text-xs text-muted-text mt-1">Total Late Minutes</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-dark-navy">{filteredRecords.length}</p>
            <p className="text-xs text-muted-text mt-1">Late Instances</p>
          </div>
        </div>

        {/* Per-employee summary */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-card-border">
            <h2 className="font-semibold text-dark-navy">Employee Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-muted-text text-xs uppercase font-semibold">Employee</th>
                  <th className="text-right py-3 px-4 text-muted-text text-xs uppercase font-semibold">Late Minutes</th>
                  <th className="text-right py-3 px-4 text-muted-text text-xs uppercase font-semibold">Total Deduction</th>
                  <th className="text-right py-3 px-4 text-muted-text text-xs uppercase font-semibold">Instances</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">
                          {s.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-navy text-sm">{s.employee?.name}</p>
                          <p className="text-xs text-muted-text capitalize">{s.employee?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{s.totalLateMinutes}m</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">− Rs. {s.totalDeduction.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{s.recordCount}</td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-muted-text">No late deductions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Records */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by employee name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-96 border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        </div>
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-muted-text text-xs uppercase font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 text-muted-text text-xs uppercase font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-muted-text text-xs uppercase font-semibold">Check-in</th>
                  <th className="text-right py-3 px-4 text-muted-text text-xs uppercase font-semibold">Late</th>
                  <th className="text-right py-3 px-4 text-muted-text text-xs uppercase font-semibold">Deduction</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-dark-navy">{r.employeeId?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-muted-text">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-muted-text">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 px-4 text-right">{r.lateMinutes}m</td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">− Rs. {(r.lateDeduction || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-text">No late deductions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLateDeductions;
