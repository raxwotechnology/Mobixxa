'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Trash2, CreditCard, Building, CheckCircle, RefreshCw, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
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
  const [empSearch, setEmpSearch] = useState('');
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
      const [advRes, empRes, accRes] = await Promise.all([
        getSalaryAdvances({ month, year }),
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

  const filteredAdvances = advances.filter(a =>
    a.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 m-0">
              <DollarSign size={24} className="text-brand-indigo" /> Advance Payments
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1 m-0">
              Record employee salary advances with payment mode & automatic payroll deduction
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer border-0"
          >
            <Plus size={16} /> New Advance Payment
          </button>
        </div>

        {/* Raxwo-style Top Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block mb-1">
              Outstanding Advances
            </span>
            <h2 className="text-2xl font-black text-slate-900 m-0">
              LKR {totalOutstanding.toLocaleString()}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 m-0">
              {advances.length} Active record(s) for {month}/{year}
            </p>
          </div>

          <div className="md:col-span-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by employee name or notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advances Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-3 border-brand-indigo border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAdvances.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
              No advance payments recorded for {month}/{year}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Request Date</th>
                    <th className="px-5 py-4">Payment Method</th>
                    <th className="px-5 py-4">Advance Amount</th>
                    <th className="px-5 py-4">Repayment</th>
                    <th className="px-5 py-4">Reason / Notes</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredAdvances.map(adv => (
                    <tr key={adv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                            {adv.employeeId?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 m-0">{adv.employeeId?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 m-0">{adv.employeeId?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {new Date(adv.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold uppercase text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {adv.paymentMethod || 'cash'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-rose-600 text-sm">
                          LKR {Number(adv.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-bold text-[10px] uppercase">
                        {adv.repaymentType === 'lump_sum' ? 'Lump Sum (Next Payroll)' : 'Installments'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 italic">
                        "{adv.reason || 'Salary advance'}"
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => { setItemToDelete(adv); setDeleteModalOpen(true); }}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border-0"
                          title="Delete Advance Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Raxwo Style New Advance Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 m-0">New Advance Payment</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer border-0">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Type to search employee name or role..."
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs mb-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  />
                  <select
                    required
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                  >
                    <option value="">Select Employee ({employees.length} available)</option>
                    {employees
                      .filter(e => e.name?.toLowerCase().includes(empSearch.toLowerCase()) || e.role?.toLowerCase().includes(empSearch.toLowerCase()))
                      .map(e => (
                        <option key={e._id} value={e._id}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Advance Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Repayment Type</label>
                  <select
                    value={form.repaymentType}
                    onChange={e => setForm({ ...form, repaymentType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                  >
                    <option value="lump_sum">Lump Sum (Next Payroll)</option>
                    <option value="installments">Installments</option>
                  </select>
                </div>
              </div>

              {form.paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Bank Account</label>
                  <select
                    value={form.bankAccountId}
                    onChange={e => setForm({ ...form, bankAccountId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>
                        {acc.bankName} - {acc.accountNumber} ({acc.accountName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Reason for advance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2"
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
