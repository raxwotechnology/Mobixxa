'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, FileDown, Upload, Paperclip } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, uploadDocument, getFinancialDashboard, getStores, getAccounts } from '../../services/api';

import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { adminNavGroups as navItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const EXPENSE_CATEGORIES = ['Employee Payments', 'Utilities', 'Water Bill', 'Electricity', 'Overtime', 'Rent', 'Salaries', 'Marketing', 'Transport', 'Supplies', 'Maintenance', 'Insurance', 'Internet & Phone', 'Equipment', 'Packaging', 'Cleaning', 'Security', 'Miscellaneous', 'Other'];
const INCOME_CATEGORIES = ['Sales', 'Interest', 'Rent Income', 'Commission', 'Refund', 'Insurance Claim', 'Asset Sale', 'Sponsorship', 'Other Income', 'Other'];

const emptyForm = { 
  type: 'expense', 
  category: 'Utilities', 
  amount: '', 
  date: new Date().toISOString().split('T')[0], 
  paymentMethod: 'Cash',
  accountId: '',
  chequeDetails: { number: '', bank: '', dueDate: '' },
  referenceNo: '',
  description: '',
  attachments: [] 
};


const AdminExpenses = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);

  
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const { selectedStoreId } = useAdminStoreStore();

  const fetchData = async () => {
    try {
      const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
      const [txRes, sumRes, storesRes, accountsRes] = await Promise.all([
        getTransactions({ storeId: storeParam }),
        getFinancialDashboard({ period: 'monthly', storeId: storeParam }),
        getStores(),
        getAccounts({ storeId: storeParam })
      ]);

      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setStores(storesRes.data.stores || storesRes.data);
      setAccounts(accountsRes.data || []);

    } catch (err) {
      toast.error('Failed to load ledger records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedStoreId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, type: activeTab, category: activeTab === 'expense' ? 'Utilities' : 'Sales', storeId: selectedStoreId !== 'all' ? selectedStoreId : '' });
    setShowModal(true);
  };

  const openEdit = (tx) => {
    setEditingId(tx._id);
    setForm({ 
      type: tx.type, 
      category: tx.category, 
      amount: tx.amount, 
      date: tx.date?.split('T')[0] || '', 
      paymentMethod: tx.paymentMethod || 'Cash',
      accountId: tx.accountId?._id || tx.accountId || '',
      chequeDetails: tx.chequeDetails || { number: '', bank: '', dueDate: '' },
      referenceNo: tx.referenceNo || '',
      description: tx.description || '',
      attachments: tx.attachments || [],
      storeId: tx.storeId?._id || tx.storeId || ''
    });

    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      const res = await uploadDocument(fd);
      setForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, { name: file.name, url: res.data.url }]
      }));
      toast.success('File attached');
    } catch (err) {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await updateTransaction(editingId, payload);
        toast.success('Transaction updated');
      } else {
        await createTransaction(payload);
        toast.success('Transaction added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (tx) => {
    setItemToDelete({ id: tx._id, name: tx.description || tx.category });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTransaction(itemToDelete.id);
      toast.success('Record deleted');
      fetchData();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filtered = transactions.filter(t => {
    if (t.type !== activeTab) return false;
    const matchSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const exportColumns = [
    { label: 'Category', accessor: 'category' },
    { label: 'Description', accessor: 'description' },
    { label: 'Amount (Rs.)', accessor: (r) => r.amount?.toFixed(2) },
    { label: 'Payment Method', accessor: 'paymentMethod' },
    { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
  ];

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Financial Ledger">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Financial Ledger">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <div className="relative">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <span className="text-lg">💰</span>
              </div>
              Ledger Management
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">{transactions.length} total transactions tracked</p>
          </div>
          
          <div className="relative flex gap-3">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-200 transition-all shadow-sm">
                <FileDown size={16} strokeWidth={2.5} /> Export ▾
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 min-w-[140px] overflow-hidden">
                <button onClick={() => exportToCSV(filtered, exportColumns, activeTab)} className="w-full text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-600 hover:bg-brand-indigo/5 hover:text-brand-indigo transition-colors border-b border-slate-50">📄 CSV Format</button>
                <button onClick={() => exportToExcel(filtered, exportColumns, activeTab)} className="w-full text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-600 hover:bg-brand-indigo/5 hover:text-brand-indigo transition-colors border-b border-slate-50">📊 Excel Sheet</button>
                <button onClick={() => exportToPDF(filtered, exportColumns, `${activeTab}_report`)} className="w-full text-left px-5 py-3 text-[10px] uppercase font-black tracking-wider text-slate-600 hover:bg-brand-indigo/5 hover:text-brand-indigo transition-colors">📋 PDF Document</button>
              </div>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 bg-brand-indigo hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-brand-indigo/20 hover:shadow-xl hover:shadow-brand-indigo/30 hover:-translate-y-0.5">
              <Plus size={16} strokeWidth={3} /> Add {activeTab === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-max">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setCatFilter('all'); }}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === t 
                ? 'bg-white text-brand-indigo shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transparent border border-transparent'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 relative z-10">Total Income</p>
              <p className="text-3xl font-black tracking-tight text-emerald-600 mt-2 relative z-10">Rs. {summary.totalIncome?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 relative z-10">Total Expenses</p>
              <p className="text-3xl font-black tracking-tight text-rose-500 mt-2 relative z-10">Rs. {summary.totalExpense?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-indigo/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 relative z-10">Net Balance</p>
              <p className={`text-3xl font-black tracking-tight mt-2 relative z-10 ${summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>Rs. {summary.balance?.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-indigo/20 rounded-full blur-xl mix-blend-screen group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 relative z-10">Total Transactions</p>
              <p className="text-3xl font-black tracking-tight text-white mt-2 relative z-10">{summary.transactionCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
            <input placeholder={`Search ${activeTab}s...`} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-3 px-5 text-[11px] uppercase font-black tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm cursor-pointer min-w-[200px]">
            <option value="all">All Categories</option>
            {(activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Payment Method</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5 text-center">Docs</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-lg border ${activeTab === 'expense' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800">{tx.description || 'N/A'}</p>
                      {tx.referenceNo && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Ref: {tx.referenceNo}</p>}
                    </td>
                    <td className={`px-6 py-4 text-base font-black tracking-tight ${activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {activeTab === 'expense' ? '-' : '+'} <span className="text-xs">Rs.</span> {tx.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">{tx.paymentMethod}</td>
                    <td className="px-6 py-4 font-bold text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      {tx.attachments?.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-brand-indigo bg-brand-indigo/10 px-3 py-1.5 rounded-lg border border-brand-indigo/20">
                          <Paperclip size={12} strokeWidth={2.5} /> {tx.attachments.length}
                        </span>
                      ) : <span className="text-slate-300 font-black">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(tx)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-brand-indigo hover:bg-brand-indigo/10 transition-all border border-slate-100 hover:border-brand-indigo/20"><Edit2 size={14} strokeWidth={2.5} /></button>
                        <button onClick={() => handleDeleteClick(tx)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-100 hover:border-rose-200"><Trash2 size={14} strokeWidth={2.5} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 font-bold">No {activeTab}s found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl my-8 overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-md relative shrink-0">
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-brand-indigo/10 text-brand-indigo rounded-full flex items-center justify-center mb-3 border border-brand-indigo/20 shadow-sm">
                {activeTab === 'expense' ? <span className="text-xl">📉</span> : <span className="text-xl">📈</span>}
              </div>
              <h2 className="text-xl font-black text-slate-900">{editingId ? `Edit ${activeTab}` : `Add New ${activeTab}`}</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">{editingId ? 'Update ledger entry' : 'Create a new ledger entry'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 bg-slate-50/50 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Store Context</label>
                <select value={form.storeId} onChange={(e) => setForm({...form, storeId: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                  <option value="">Global / All Stores</option>
                  {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Category *</label>
                  <select required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    {(activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Amount (Rs.) *</label>
                  <input type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}
                    placeholder="0.00" className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm ${activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className={form.paymentMethod === 'Cheque' ? '' : 'col-span-2'}>
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Debit/Credit Account *</label>
                  <select required value={form.accountId} onChange={(e) => setForm({...form, accountId: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm cursor-pointer">
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (Rs. {a.balance?.toLocaleString()})</option>)}
                  </select>
                </div>
                {form.paymentMethod === 'Cheque' && (
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Cheque Due Date</label>
                    <input type="date" value={form.chequeDetails.dueDate?.split('T')[0] || ''} 
                      onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, dueDate: e.target.value }})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                  </div>
                )}
              </div>

              {form.paymentMethod === 'Cheque' && (
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Cheque Number</label>
                    <input value={form.chequeDetails.number} onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, number: e.target.value }})}
                      placeholder="XXXXXX" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Bank</label>
                    <input value={form.chequeDetails.bank} onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, bank: e.target.value }})}
                      placeholder="e.g. BOC" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
                  </div>
                </div>
              )}


              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Description</label>
                <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder={`What was this ${activeTab} for?`} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm" />
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2">Reference Number</label>
                <input value={form.referenceNo} onChange={(e) => setForm({...form, referenceNo: e.target.value})}
                  placeholder="Receipt No, Cheque No, etc." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all shadow-sm font-mono tracking-wider" />
              </div>

              {/* Attachments Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Attachments (Bills/Receipts)</label>
                  <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                    {uploading ? <div className="w-3 h-3 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin"/> : <Upload size={12} strokeWidth={3}/>}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
                  </label>
                </div>
                {form.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {form.attachments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-indigo hover:text-indigo-700 hover:underline flex items-center gap-2">
                          <Paperclip size={14} strokeWidth={2.5} /> {doc.name || 'Attachment'}
                        </a>
                        <button type="button" onClick={() => removeAttachment(idx)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"><Trash2 size={14} strokeWidth={2.5} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic text-center py-4">No attachments yet. Upload bills or receipts to keep a record.</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-slate-50/50 pb-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-[11px] uppercase tracking-wider font-black hover:bg-slate-200 text-slate-700 transition-all">Cancel</button>
                <button type="submit" disabled={saving || uploading} className="flex-1 py-3 rounded-xl bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] uppercase tracking-wider font-black shadow-lg shadow-brand-indigo/20 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update Record' : `Save ${activeTab}`}
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
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminExpenses;
