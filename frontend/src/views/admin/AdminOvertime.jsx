'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, DollarSign, User, CheckCircle, Trash2, X, Download, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getOvertimeSummary, getOvertimeRecords, createOvertimeRecord, markOvertimePaid, rejectOvertimeRecord, deleteOvertimeRecord, getEmployeeOTReport } from '../../services/api';
import API from '../../services/api';
import { toast } from 'react-toastify';

const AdminOvertime = () => {
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], hours: '', ratePerHour: '', description: '' });
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empReport, setEmpReport] = useState(null);
  const [empReportLoading, setEmpReportLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const [sumRes, recRes] = await Promise.all([
        getOvertimeSummary(params),
        getOvertimeRecords(params),
      ]);
      setSummary(sumRes.data);
      setRecords(recRes.data);
    } catch (err) {
      toast.error('Failed to load OT data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setEmployees((data || []).filter(u => ['cashier', 'manager', 'deliveryGuy', 'stockEmployee'].includes(u.role)));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); fetchEmployees(); }, []);
  useEffect(() => { fetchData(); }, [dateRange.startDate, dateRange.endDate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return toast.error('Select an employee');
    try {
      await createOvertimeRecord({
        ...form,
        hours: Number(form.hours),
        ratePerHour: Number(form.ratePerHour),
      });
      toast.success('OT record created');
      setShowModal(false);
      setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], hours: '', ratePerHour: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create OT record');
    }
  };

  const handlePay = async (id) => {
    try {
      await markOvertimePaid(id);
      toast.success('Marked as paid');
      fetchData();
      if (selectedEmployee) viewEmployeeReport(selectedEmployee);
    } catch (err) { toast.error('Failed to mark as paid'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this OT request?')) return;
    try {
      await rejectOvertimeRecord(id);
      toast.success('OT request rejected');
      fetchData();
      if (selectedEmployee) viewEmployeeReport(selectedEmployee);
    } catch (err) { toast.error('Failed to reject OT'); }
  };

  const handleDeleteClick = (record) => {
    setItemToDelete(record);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteOvertimeRecord(itemToDelete._id);
      toast.success('Deleted');
      setDeleteModalOpen(false);
      fetchData();
      if (selectedEmployee) viewEmployeeReport(selectedEmployee);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const viewEmployeeReport = async (empId) => {
    setSelectedEmployee(empId);
    setEmpReportLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await getEmployeeOTReport(empId, params);
      setEmpReport(data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setEmpReportLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [['Employee', 'Date', 'Hours', 'Rate/Hr', 'Amount', 'Status', 'Description']];
    records.forEach(r => {
      rows.push([
        r.employeeId?.name || 'Unknown',
        new Date(r.date).toLocaleDateString(),
        r.hours, r.ratePerHour, r.totalAmount,
        r.status, r.description || '',
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ot_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('OT report exported!');
  };

  const totalOT = summary.reduce((s, r) => s + r.totalAmount, 0);
  const totalPaid = summary.reduce((s, r) => s + r.paidAmount, 0);
  const totalPending = summary.reduce((s, r) => s + r.pendingAmount, 0);
  const totalHours = summary.reduce((s, r) => s + r.totalHours, 0);

  const filteredRecords = records.filter(r =>
    r.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout title="Overtime">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Overtime">
      <div className="ds-page">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Clock size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Overtime Pay Management</h1>
              <p className="ds-page-subtitle">Track, approve, and disburse employee overtime earnings</p>
            </div>
          </div>
          <div className="ds-page-header-right flex gap-2 flex-wrap items-center">
            <input type="date" value={dateRange.startDate} onChange={e => setDateRange(r => ({ ...r, startDate: e.target.value }))} className="ds-input text-xs py-2 w-auto" />
            <input type="date" value={dateRange.endDate} onChange={e => setDateRange(r => ({ ...r, endDate: e.target.value }))} className="ds-input text-xs py-2 w-auto" />
            <button onClick={exportCSV} className="ds-btn ds-btn-secondary text-xs uppercase py-2">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => setShowModal(true)} className="ds-btn ds-btn-primary text-xs uppercase py-2">
              <Plus size={14} /> Add OT
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="ds-stats grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="ds-stat">
            <div className="ds-stat-label">Total OT Hours</div>
            <div className="ds-stat-value text-blue-600">{totalHours.toFixed(1)}h</div>
            <div className="ds-stat-sub">Accumulated hours logged</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Total OT Amount</div>
            <div className="ds-stat-value">Rs. {totalOT.toLocaleString()}</div>
            <div className="ds-stat-sub">Gross overtime liability</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Paid Overtime</div>
            <div className="ds-stat-value text-emerald-600">Rs. {totalPaid.toLocaleString()}</div>
            <div className="ds-stat-sub">Disbursed successfully</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Pending Approval/Pay</div>
            <div className="ds-stat-value text-amber-600">Rs. {totalPending.toLocaleString()}</div>
            <div className="ds-stat-sub">Awaiting settlement</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ds-tab-bar mb-6">
          {[
            { key: 'summary', label: 'Employee Summary' },
            { key: 'records', label: 'All Records' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedEmployee(null); }}
              className={`ds-tab-btn ${tab === t.key && !selectedEmployee ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Employee Report View */}
        {selectedEmployee && empReport && (
          <div className="ds-card mb-6">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <button onClick={() => { setSelectedEmployee(null); setEmpReport(null); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer border-0 bg-transparent">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-base font-semibold text-slate-900 m-0">{empReport.employee?.name}'s OT Report</h2>
                <p className="text-xs text-slate-400 font-medium m-0 mt-0.5">{empReport.employee?.email} · {empReport.employee?.role}</p>
              </div>
            </div>
            
            <div className="ds-stats grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="ds-stat p-3">
                <div className="ds-stat-label">Total Hours</div>
                <div className="ds-stat-value text-blue-600">{empReport.summary.totalHours.toFixed(1)}h</div>
              </div>
              <div className="ds-stat p-3">
                <div className="ds-stat-label">Total Amount</div>
                <div className="ds-stat-value">Rs. {empReport.summary.totalAmount.toLocaleString()}</div>
              </div>
              <div className="ds-stat p-3">
                <div className="ds-stat-label">Paid</div>
                <div className="ds-stat-value text-emerald-600">Rs. {empReport.summary.paidAmount.toLocaleString()}</div>
              </div>
              <div className="ds-stat p-3">
                <div className="ds-stat-label">Pending</div>
                <div className="ds-stat-value text-amber-600">Rs. {empReport.summary.pendingAmount.toLocaleString()}</div>
              </div>
            </div>

            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-right">Hours</th>
                    <th className="text-right">Rate/Hr</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(empReport.records || []).map(r => (
                    <tr key={r._id}>
                      <td className="font-semibold text-slate-800">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="text-right font-medium">{r.hours}h</td>
                      <td className="text-right">Rs. {r.ratePerHour}</td>
                      <td className="text-right font-bold text-slate-900 tabular-nums">Rs. {r.totalAmount.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={r.status === 'paid' ? 'ds-badge-green' : r.status === 'rejected' ? 'ds-badge-red' : 'ds-badge-amber'}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => handlePay(r._id)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer border border-emerald-200">Pay</button>
                              <button onClick={() => handleReject(r._id)} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer border border-rose-200">Reject</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteClick(r)} className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {tab === 'summary' && !selectedEmployee && (
          <div className="ds-card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm m-0">Employee OT Summary</h2>
              <span className="text-xs text-slate-400 font-medium">{summary.length} active employees</span>
            </div>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th className="text-left">Employee</th>
                    <th className="text-right">Total Hours</th>
                    <th className="text-right">Total OT</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Pending</th>
                    <th className="text-right">Records</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200/60">
                            {s.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm m-0">{s.employee?.name}</p>
                            <p className="text-xs text-slate-400 capitalize m-0">{s.employee?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-medium">{s.totalHours.toFixed(1)}h</td>
                      <td className="text-right font-bold text-slate-900 tabular-nums">Rs. {s.totalAmount.toLocaleString()}</td>
                      <td className="text-right text-emerald-600 font-semibold tabular-nums">Rs. {s.paidAmount.toLocaleString()}</td>
                      <td className="text-right text-amber-600 font-semibold tabular-nums">Rs. {s.pendingAmount.toLocaleString()}</td>
                      <td className="text-right font-medium text-slate-600">{s.recordCount}</td>
                      <td className="text-right">
                        <button onClick={() => viewEmployeeReport(s.employeeId)} className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-xs font-semibold bg-transparent border-0 cursor-pointer">
                          View Report <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {summary.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-medium">No OT records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {tab === 'records' && (
          <div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search by employee name..." value={search} onChange={e => setSearch(e.target.value)} className="ds-input pl-9 w-full sm:w-80 text-sm" />
            </div>
            <div className="ds-card p-0 overflow-hidden">
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="text-left">Employee</th>
                      <th className="text-left">Date</th>
                      <th className="text-right">Hours</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Status</th>
                      <th className="text-left">Note</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r => (
                      <tr key={r._id}>
                        <td className="font-semibold text-slate-900">{r.employeeId?.name || 'Unknown'}</td>
                        <td className="text-slate-500 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="text-right font-medium">{r.hours}h</td>
                        <td className="text-right">Rs. {r.ratePerHour}</td>
                        <td className="text-right font-bold text-slate-900 tabular-nums">Rs. {r.totalAmount.toLocaleString()}</td>
                        <td className="text-center">
                          <span className={r.status === 'paid' ? 'ds-badge-green' : r.status === 'rejected' ? 'ds-badge-red' : 'ds-badge-amber'}>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400 max-w-[150px] truncate">{r.description || '—'}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {r.status === 'pending' && (
                              <>
                                <button onClick={() => handlePay(r._id)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer border border-emerald-200">Pay</button>
                                <button onClick={() => handleReject(r._id)} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer border border-rose-200">Reject</button>
                              </>
                            )}
                            <button onClick={() => handleDeleteClick(r)} className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-0 bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr><td colSpan={8} className="py-12 text-center text-slate-400 font-medium">No OT records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create OT Modal */}
      {showModal && (
        <div className="ds-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h2 className="ds-modal-title">Add Overtime Record</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="ds-form-group">
                <label className="ds-label">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={form.employeeId ? [form.employeeId] : []}
                  onChange={([id]) => setForm({ ...form, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Date *</label>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="ds-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="ds-form-group">
                  <label className="ds-label">OT Hours *</label>
                  <input type="number" step="0.5" min="0.5" required value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="e.g. 2.5" className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Rate Per Hour (Rs.) *</label>
                  <input type="number" min="1" required value={form.ratePerHour} onChange={e => setForm({ ...form, ratePerHour: e.target.value })} placeholder="e.g. 250" className="ds-input" />
                </div>
              </div>
              {form.hours && form.ratePerHour && (
                <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 font-medium m-0">Total Calculated OT Pay</p>
                  <p className="text-lg font-bold text-blue-600 m-0 mt-0.5 tabular-nums">Rs. {(Number(form.hours) * Number(form.ratePerHour)).toLocaleString()}</p>
                </div>
              )}
              <div className="ds-form-group">
                <label className="ds-label">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Weekend shift, Holiday work" className="ds-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="ds-btn ds-btn-primary flex-1 justify-center">Create OT Record</button>
                <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-secondary flex-1 justify-center">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName="this OT record"
      />
    </DashboardLayout>
  );
};

export default AdminOvertime;
