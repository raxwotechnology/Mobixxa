'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, FileDown, Upload, Paperclip } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, uploadDocument, getFinancialDashboard, getStores, getAccounts } from '../../services/api';

import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups, getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';
import useAuthStore from '../../store/authStore';
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


const AdminExpenses = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'cashier'
      ? getEmployeeNavGroups('cashier')
      : user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
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
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Financial Ledger">
      <div className="ds-page">
        {/* Page Banner */}
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge">
              <FileDown size={24} />
            </div>
            <div>
              <h1>Ledger Management</h1>
              <p>{transactions.length} total transactions tracked</p>
            </div>
          </div>
          
          <div className="ds-page-header-right">
            <div className="relative group inline-block">
              <button className="ds-btn ds-btn-secondary">
                <FileDown size={16} /> Export ▾
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-100 z-20 min-w-[140px] overflow-hidden">
                <button onClick={() => exportToCSV(filtered, exportColumns, activeTab)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100"> CSV Format</button>
                <button onClick={() => exportToExcel(filtered, exportColumns, activeTab)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100"> Excel Sheet</button>
                <button onClick={() => exportToPDF(filtered, exportColumns, `${activeTab}_report`)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"> PDF Document</button>
              </div>
            </div>
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <Plus size={16} /> Add {activeTab === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--ds-border-soft)', borderRadius: 'var(--ds-r-lg)', width: 'fit-content' }}>
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setCatFilter('all'); }}
              style={activeTab === t 
                ? { background: 'var(--ds-primary)', color: '#fff', borderRadius: 'var(--ds-r-md)', padding: '0.5rem 1rem', fontSize: 'var(--ds-text-sm)', fontWeight: '500', transition: 'all 0.2s', cursor: 'pointer', border: 'none' }
                : { background: 'transparent', color: 'var(--ds-text-muted)', borderRadius: 'var(--ds-r-md)', padding: '0.5rem 1rem', fontSize: 'var(--ds-text-sm)', fontWeight: '500', transition: 'all 0.2s', cursor: 'pointer', border: 'none' }
              }
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}s
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="ds-stats">
            <div className="ds-stat">
              <div className="ds-stat-label">Total Income</div>
              <div className="ds-stat-value" style={{ color: 'var(--ds-badge-green, #10b981)' }}>Rs. {summary.totalIncome?.toLocaleString()}</div>
            </div>
            <div className="ds-stat">
              <div className="ds-stat-label">Total Expenses</div>
              <div className="ds-stat-value" style={{ color: 'var(--ds-badge-red, #ef4444)' }}>Rs. {summary.totalExpense?.toLocaleString()}</div>
            </div>
            <div className="ds-stat">
              <div className="ds-stat-label">Net Balance</div>
              <div className="ds-stat-value">Rs. {summary.balance?.toLocaleString()}</div>
            </div>
            <div className="ds-stat">
              <div className="ds-stat-label">Total Transactions</div>
              <div className="ds-stat-value">{summary.transactionCount}</div>
            </div>
          </div>
        )}

        {/* Filters & Table */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-filter-bar">
              <div className="ds-search">
                <Search size={16} />
                <input placeholder={`Search ${activeTab}s...`} value={search} onChange={(e) => setSearch(e.target.value)} className="ds-input" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="ds-select">
                <option value="all">All Categories</option>
                {(activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="ds-card-body p-0">
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'center' }}>Docs</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr key={tx._id}>
                      <td>
                        <span className={`ds-badge ${activeTab === 'expense' ? 'ds-badge-red' : 'ds-badge-green'}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--ds-text-head)' }}>{tx.description || 'N/A'}</div>
                        {tx.referenceNo && <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>Ref: {tx.referenceNo}</div>}
                      </td>
                      <td style={{ fontWeight: '600', color: activeTab === 'expense' ? 'var(--ds-badge-red, #ef4444)' : 'var(--ds-badge-green, #10b981)' }}>
                        {activeTab === 'expense' ? '-' : '+'} Rs. {tx.amount?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`ds-badge ${tx.paymentMethod === 'Cash' ? 'ds-badge-slate' : 'ds-badge-blue'}`}>{tx.paymentMethod}</span>
                      </td>
                      <td>{new Date(tx.date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        {tx.attachments?.length > 0 ? (
                          <span className="ds-badge ds-badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Paperclip size={12} /> {tx.attachments.length}
                          </span>
                        ) : <span style={{ color: 'var(--ds-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => openEdit(tx)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteClick(tx)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="ds-empty">
                          No {activeTab}s found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ds-modal ds-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h2 className="ds-modal-title">{editingId ? `Edit ${activeTab}` : `Add New ${activeTab}`}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ds-form-group">
                  <label className="ds-label">Store Context</label>
                  <select value={form.storeId} onChange={(e) => setForm({...form, storeId: e.target.value})} className="ds-input ds-select">
                    <option value="">Global / All Stores</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Category *</label>
                    <select required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="ds-input ds-select">
                      {(activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Amount (Rs.) *</label>
                    <input type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} placeholder="0.00" className="ds-input" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Date *</label>
                    <input type="date" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} className="ds-input ds-select">
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={`ds-form-group ${form.paymentMethod === 'Cheque' ? '' : 'col-span-2'}`} style={form.paymentMethod !== 'Cheque' ? { gridColumn: 'span 2' } : {}}>
                    <label className="ds-label">Debit/Credit Account *</label>
                    <select required value={form.accountId} onChange={(e) => setForm({...form, accountId: e.target.value})} className="ds-input ds-select">
                      <option value="">Select Account</option>
                      {accounts.map(a => <option key={a._id} value={a._id}>{a.name} (Rs. {a.balance?.toLocaleString()})</option>)}
                    </select>
                  </div>
                  {form.paymentMethod === 'Cheque' && (
                    <div className="ds-form-group">
                      <label className="ds-label">Cheque Due Date</label>
                      <input type="date" value={form.chequeDetails.dueDate?.split('T')[0] || ''} onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, dueDate: e.target.value }})} className="ds-input" />
                    </div>
                  )}
                </div>

                {form.paymentMethod === 'Cheque' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">Cheque Number</label>
                      <input value={form.chequeDetails.number} onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, number: e.target.value }})} placeholder="XXXXXX" className="ds-input" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Bank</label>
                      <input value={form.chequeDetails.bank} onChange={(e) => setForm({...form, chequeDetails: { ...form.chequeDetails, bank: e.target.value }})} placeholder="e.g. BOC" className="ds-input" />
                    </div>
                  </div>
                )}

                <div className="ds-form-group">
                  <label className="ds-label">Description</label>
                  <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder={`What was this ${activeTab} for?`} className="ds-input" />
                </div>
                
                <div className="ds-form-group">
                  <label className="ds-label">Reference Number</label>
                  <input value={form.referenceNo} onChange={(e) => setForm({...form, referenceNo: e.target.value})} placeholder="Receipt No, Cheque No, etc." className="ds-input" />
                </div>

                {/* Attachments Section */}
                <div style={{ background: 'var(--ds-border-soft)', padding: '1rem', borderRadius: 'var(--ds-r-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label className="ds-label" style={{ marginBottom: 0 }}>Attachments (Bills/Receipts)</label>
                    <label className="ds-btn ds-btn-secondary ds-btn-sm" style={{ cursor: 'pointer' }}>
                      {uploading ? <div className="ds-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}/> : <Upload size={12} />}
                      {uploading ? 'Uploading...' : 'Upload File'}
                      <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
                    </label>
                  </div>
                  {form.attachments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {form.attachments.map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.5rem', borderRadius: 'var(--ds-r-sm)' }}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-sm)', color: 'var(--ds-primary)' }}>
                            <Paperclip size={14} /> {doc.name || 'Attachment'}
                          </a>
                          <button type="button" onClick={() => removeAttachment(idx)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>No attachments yet.</p>
                  )}
                </div>
              </div>

              <div className="ds-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || uploading} className="ds-btn ds-btn-primary">
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
