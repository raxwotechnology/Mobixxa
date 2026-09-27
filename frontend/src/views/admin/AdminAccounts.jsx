'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Wallet, CreditCard, Landmark, ArrowUpRight, ArrowDownLeft, History, MoreVertical, TrendingUp, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { getAccounts, createAccount, updateAccount, deleteAccount, getAccountTransactions, getStores } from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { toast } from 'react-toastify';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups, getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';
import useAuthStore from '../../store/authStore';
import useAdminStoreStore from '../../store/adminStoreStore';

const emptyForm = {
  name: '', type: 'Cash', accountNumber: '', bankName: '', balance: 0, isDefault: false, storeId: ''
};

const AdminAccounts = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'cashier'
      ? getEmployeeNavGroups('cashier')
      : user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
  const { selectedStoreId } = useAdminStoreStore();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [viewingTransactions, setViewingTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transLoading, setTransLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);


  const fetchData = async () => {
    try {
      setLoading(true);
      const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
      const [accRes, storesRes] = await Promise.all([
        getAccounts({ storeId: storeParam }),
        getStores()
      ]);
      setAccounts(accRes.data || []);
      setStores(storesRes.data.stores || storesRes.data || []);


    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedStoreId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, storeId: selectedStoreId !== 'all' ? selectedStoreId : '' });
    setShowModal(true);
  };

  const openEdit = (account) => {
    setEditingId(account._id);
    setForm({
      name: account.name || '',
      type: account.type || 'Cash',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      balance: account.balance || 0,
      isDefault: !!account.isDefault,
      storeId: account.storeId?._id || account.storeId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeId) {
      toast.error('Store is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAccount(editingId, form);
        toast.success('Account updated');
      } else {
        await createAccount(form);
        toast.success('Account created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (account) => {
    setItemToDelete(account);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAccount(itemToDelete._id);
      toast.success('Account deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const fetchTransactions = async (account) => {
    setViewingTransactions(account);
    setTransLoading(true);
    try {
      const { data } = await getAccountTransactions(account._id);
      setTransactions(data || []);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setTransLoading(false);
    }
  };

  const exportExcel = (account) => {
    const rows = transactions.map(t => ({
      Date: new Date(t.date || t.createdAt).toLocaleDateString(),
      Reference: t.referenceNo || '—',
      Category: t.category,
      Description: t.description,
      Type: t.type.toUpperCase(),
      Amount: t.amount
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Ledger Transactions');
    XLSX.writeFile(workbook, `account_${account.name.replace(/\s+/g, '_')}_ledger.xlsx`);
    toast.success('Excel downloaded');
  };

  const exportPDF = (account) => {
    const doc = new jsPDF();
    doc.text(`Ledger Transactions - ${account.name} (${account.type})`, 14, 15);
    const head = [['Date', 'Reference', 'Category', 'Description', 'Type', 'Amount']];
    const body = transactions.map(t => [
      new Date(t.date || t.createdAt).toLocaleDateString(),
      t.referenceNo || '—',
      t.category,
      t.description,
      t.type.toUpperCase(),
      `Rs. ${Number(t.amount).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    doc.save(`account_${account.name.replace(/\s+/g, '_')}_ledger.pdf`);
    toast.success('PDF downloaded');
  };

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Accounts Management">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Accounts Management">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Landmark size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Bank &amp; Financial Accounts</h1>
              <p className="ds-page-subtitle">Manage cash drawers, company bank accounts and mobile settlement wallets</p>
            </div>
          </div>
          
          <div className="ds-page-header-right">
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <Plus size={16} /> New Account
            </button>
          </div>
        </div>

        {/* Total Liquidity Cards */}
        <div className="ds-stats grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="ds-stat">
            <div className="ds-stat-label">Total Combined Balance</div>
            <div className="ds-stat-value text-blue-600">
              Rs. {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="ds-stat-sub">Across all active accounts</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Cash on Hand</div>
            <div className="ds-stat-value text-emerald-600">
              Rs. {accounts.filter(a => a.type === 'Cash').reduce((s, a) => s + a.balance, 0).toLocaleString()}
            </div>
            <div className="ds-stat-sub">Physical drawer cash</div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-label">Bank Balance</div>
            <div className="ds-stat-value">
              Rs. {accounts.filter(a => a.type === 'Bank').reduce((s, a) => s + a.balance, 0).toLocaleString()}
            </div>
            <div className="ds-stat-sub">Bank deposits & transfers</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account) => (
            <div key={account._id} className="ds-card p-5 hover:border-blue-400 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  account.type === 'Cash' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
                  account.type === 'Bank' ? 'bg-blue-50 text-blue-600 border border-blue-200/60' :
                  'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                }`}>
                  {account.type === 'Cash' ? <Wallet size={18} /> : <Landmark size={18} />}
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => fetchTransactions(account)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Ledger Transactions"><History size={15} /></button>
                   <button onClick={() => openEdit(account)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Edit Account"><Edit2 size={15} /></button>
                   <button onClick={() => handleDeleteClick(account)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Account"><Trash2 size={15} /></button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight m-0">{account.name}</h3>
                  {account.isDefault && <span className="ds-badge-amber text-xs font-semibold">Default</span>}
                </div>
                <p className="text-xs font-medium text-slate-400 mb-3">{account.type} • {account.bankName || 'Direct'}</p>
                
                <div className="text-xl font-bold text-slate-900 tracking-tight mb-1 tabular-nums">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Rs.</span>
                  {Number(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs font-mono font-medium text-slate-400 tracking-wider m-0">{account.accountNumber || 'NO ACC. NUMBER'}</p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                 <span className={account.status === 'active' ? 'ds-badge-green' : 'ds-badge-slate'}>
                   {account.status || 'active'}
                 </span>
                 <button onClick={() => fetchTransactions(account)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer">
                   View Ledger <ArrowUpRight size={13} />
                 </button>
              </div>
            </div>
          ))}

          {/* Add New Empty State */}
          <div onClick={openCreate} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-indigo hover:text-brand-indigo hover:bg-brand-indigo/5 cursor-pointer transition-all duration-300 h-[260px] group">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
              <Plus size={32} strokeWidth={2.5} />
            </div>
            <p className="font-bold text-sm">Add New Account</p>
          </div>
        </div>

        {/* Modal: Create/Edit Account */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative">
                <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X size={16} />
                </button>
                <div className="w-12 h-12 bg-brand-indigo/10 text-brand-indigo rounded-full flex items-center justify-center mb-3 border border-brand-indigo/20 shadow-sm">
                  <Landmark size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Account' : 'Create Account'}</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">{editingId ? 'Update account details' : 'Add a new financial account'}</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 bg-slate-50/50 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Account Label / Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="e.g. Commercial Bank - Main" />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Account Type *</label>
                    <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                      <option value="Cash">Cash Drawer</option>
                      <option value="Bank">Bank Account</option>
                      <option value="Mobile Wallet">Mobile Wallet</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Bank Name (Optional)</label>
                    <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" placeholder="e.g. Sampath Bank" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Account Number</label>
                    <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm font-mono" placeholder="XXXX-XXXX-XXXX" />
                  </div>
                  {!editingId && (
                    <div className="md:col-span-2">
                      <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Initial Balance (Rs.)</label>
                      <input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-2">Store Assignment *</label>
                    <select 
                      required 
                      disabled={selectedStoreId !== 'all'}
                      value={form.storeId} 
                      onChange={(e) => setForm({ ...form, storeId: e.target.value })} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Select Store</option>
                      {stores.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-indigo transition-colors">
                      <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 rounded text-brand-indigo focus:ring-brand-indigo accent-brand-indigo" />
                      <span className="text-xs font-bold text-slate-700">Set as Default Account</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-xs uppercase tracking-wider font-bold hover:bg-slate-200 text-slate-700 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-brand-indigo/20 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : editingId ? 'Update Account' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Account Transactions (Ledger) */}
        {viewingTransactions && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewingTransactions(null)}>
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                    viewingTransactions.type === 'Cash' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                    viewingTransactions.type === 'Bank' ? 'bg-blue-50 text-blue-500 border border-blue-100' :
                    'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                  }`}>
                    {viewingTransactions.type === 'Cash' ? <Wallet size={20} /> : <Landmark size={20} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{viewingTransactions.name}</h2>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{viewingTransactions.type} Ledger</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => exportExcel(viewingTransactions)} className="bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-500 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm">Export Excel</button>
                  <button onClick={() => exportPDF(viewingTransactions)} className="bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 hover:border-rose-500 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm">Export PDF</button>
                  <button onClick={() => setViewingTransactions(null)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100"><X size={20} /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {transLoading ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4">
                     <div className="w-10 h-10 border-4 border-brand-indigo/20 border-t-brand-indigo rounded-full animate-spin" />
                     <p className="text-sm font-bold text-slate-400">Loading ledger...</p>
                   </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-center">Type</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactions.map((t) => (
                            <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-600 text-xs">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-mono text-xs font-bold tracking-widest text-brand-indigo">{t.referenceNo || '—'}</td>
                              <td className="px-6 py-4">
                                 <div className="text-xs font-bold text-slate-800">{t.category}</div>
                                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t.description}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                                   t.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                 }`}>
                                   {t.type}
                                 </span>
                              </td>
                              <td className={`px-6 py-4 text-right text-base font-bold tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.type === 'income' ? '+' : '-'} <span className="text-xs">Rs.</span> {Number(t.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          {transactions.length === 0 && (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No transactions found for this account.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                 <div className="text-xs font-bold text-muted-text">Current Live Balance</div>
                 <div className="text-xl font-bold text-dark-navy">Rs. {Number(viewingTransactions.balance).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || 'this account'}
      />
    </DashboardLayout>
  );
};

export default AdminAccounts;
