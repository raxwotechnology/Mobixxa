'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Trash2, CreditCard, Building, CheckCircle, RefreshCw, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { getSalaryAdvances, recordSalaryAdvance, deleteSalaryAdvance, getAdminUsers, getAccounts } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const now = new Date();

const AdminSalaryAdvances = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    paymentMethod: 'cash',
    bankAccountId: '',
    repaymentType: 'lump_sum',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (month && month !== 'all') params.month = month;
      if (year && year !== 'all') params.year = year;
      const [advRes, empRes, accRes] = await Promise.all([
        getSalaryAdvances(params),
        getAdminUsers({ limit: 100 }),
        getAccounts().catch(() => ({ data: [] })),
      ]);
      setAdvances(advRes.data || []);
      const allUsers = empRes.data?.users || empRes.data || [];
      setEmployees(allUsers.filter(u => u.role !== 'customer'));
      setAccounts(accRes.data?.accounts || accRes.data || []);
    } catch (err) {
      toast.error('Failed to load salary advances');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return toast.error('Select an employee');
    try {
      await recordSalaryAdvance(form);
      toast.success('Advance payment recorded successfully');
      setShowModal(false);
      setForm({
        employeeId: '',
        amount: '',
        paymentMethod: 'cash',
        bankAccountId: '',
        repaymentType: 'lump_sum',
        reason: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSalaryAdvance(itemToDelete._id);
      toast.success('Salary advance removed');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete advance');
    }
  };

  const totalOutstanding = advances.reduce((sum, a) => sum + (a.amount || 0), 0);

  const filteredAdvances = advances.filter(a => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const empName = a.employeeId?.name || (typeof a.employeeId === 'string' ? employees.find(e => e._id === a.employeeId)?.name : '') || '';
    const empEmail = a.employeeId?.email || '';
    const empRole = a.employeeId?.role || '';
    const reason = a.reason || '';
    const method = a.paymentMethod || '';
    const amount = String(a.amount || '');
    return (
      empName.toLowerCase().includes(q) ||
      empEmail.toLowerCase().includes(q) ||
      empRole.toLowerCase().includes(q) ||
      reason.toLowerCase().includes(q) ||
      method.toLowerCase().includes(q) ||
      amount.includes(q)
    );
  });

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div className="ds-page">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <DollarSign size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Advance Payments</h1>
              <p className="ds-page-subtitle">
                Record employee salary advances with payment mode &amp; automatic payroll deduction
              </p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button
              onClick={() => setShowModal(true)}
              className="ds-btn ds-btn-primary"
            >
              <Plus size={15} /> New Advance Payment
            </button>
          </div>
        </div>

        {/* Stats & Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ds-stat">
            <span className="ds-stat-label text-rose-600">
              Outstanding Advances
            </span>
            <div className="ds-stat-value text-slate-900">
              LKR {totalOutstanding.toLocaleString()}
            </div>
            <p className="ds-stat-sub">
              {advances.length} Active record(s) {month === 'all' ? `(All Months ${year})` : `for ${new Date(0, month - 1).toLocaleString('en', { month: 'short' })} ${year}`}
            </p>
          </div>

          <div className="md:col-span-3 ds-card flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by employee name (e.g. Kapila), reason, or amount..."
                className="ds-input pl-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={month}
                onChange={e => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="ds-input py-2 px-3 text-xs w-auto cursor-pointer"
              >
                <option value="all">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="ds-input py-2 px-3 text-xs w-auto cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advances Table */}
        <div className="ds-table-wrap">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAdvances.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              {search ? `No salary advances found matching "${search}"` : `No advance payments recorded for ${month === 'all' ? 'any month' : `${month}/${year}`}`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Request Date</th>
                    <th>Payment Method</th>
                    <th>Advance Amount</th>
                    <th>Repayment</th>
                    <th>Reason / Notes</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvances.map(adv => {
                    const empName = adv.employeeId?.name || (typeof adv.employeeId === 'string' ? employees.find(e => e._id === adv.employeeId)?.name : null) || 'Unknown Employee';
                    const empRole = adv.employeeId?.role || (typeof adv.employeeId === 'string' ? employees.find(e => e._id === adv.employeeId)?.role : null) || 'Staff';
                    return (
                      <tr key={adv._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {empName.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 m-0">{empName}</p>
                              <p className="text-[0.7rem] text-slate-400 m-0 capitalize">{empRole}</p>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium text-slate-700">
                          {new Date(adv.requestDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span className="ds-badge ds-badge-gray capitalize">
                            {adv.paymentMethod || 'cash'}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-rose-600 text-xs">
                            LKR {Number(adv.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="text-slate-600 text-xs font-medium">
                          {adv.repaymentType === 'lump_sum' ? 'Lump Sum (Next Payroll)' : 'Installments'}
                        </td>
                        <td className="text-slate-700 text-xs font-medium">
                          {adv.reason || 'Salary advance'}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => { setItemToDelete(adv); setDeleteModalOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-0"
                            title="Delete Advance Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Advance Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="ds-modal max-w-md w-full p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 m-0">New Advance Payment</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer border-0">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Employee *</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={form.employeeId ? [form.employeeId] : []}
                  onChange={([id]) => setForm({ ...form, employeeId: id || '' })}
                  placeholder="Search and select employee..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Advance Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 10000"
                  className="ds-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="ds-input"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Repayment Type</label>
                  <select
                    value={form.repaymentType}
                    onChange={e => setForm({ ...form, repaymentType: e.target.value })}
                    className="ds-input"
                  >
                    <option value="lump_sum">Lump Sum (Next Payroll)</option>
                    <option value="installments">Installments</option>
                  </select>
                </div>
              </div>

              {form.paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company Bank Account</label>
                  <select
                    value={form.bankAccountId}
                    onChange={e => setForm({ ...form, bankAccountId: e.target.value })}
                    className="ds-input"
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(acc => acc.type === 'Bank').map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} — {acc.bankName} ({acc.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Reason for advance"
                  className="ds-input"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ds-btn ds-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ds-btn ds-btn-primary flex-1 justify-center"
                >
                  <CheckCircle size={15} /> Record Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete ? `Advance of LKR ${itemToDelete.amount} for ${itemToDelete.employeeId?.name}` : ''}
      />
    </DashboardLayout>
  );
};

export default AdminSalaryAdvances;
