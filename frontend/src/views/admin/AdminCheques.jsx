'use client';

import { useState, useEffect } from 'react';
import { Landmark, Search, Calendar, Filter, CheckCircle2, AlertCircle, FileText, Building, Trash2, X, Plus, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

import { getCheques, updateChequeStatus, deleteTransaction, getStores, getAccounts, createTransaction } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups } from './adminNavItems';
import { managerNavGroups, getFilteredManagerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';
import useAuthStore from '../../store/authStore';
import useAdminStoreStore from '../../store/adminStoreStore';

const AdminCheques = ({ navItems: propNavItems }) => {
  const { user } = useAuthStore();
  const navItems = propNavItems || (
    user?.role === 'cashier'
      ? getEmployeeNavGroups('cashier')
      : user?.role === 'manager'
      ? getFilteredManagerNavGroups(user)
      : adminNavGroups
  );
  const { selectedStoreId } = useAdminStoreStore();
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });

  // Manual Cheque States
  const [showModal, setShowModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [stores, setStores] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: '',
    bank: '',
    dueDate: '',
    amount: '',
    type: 'income',
    storeId: '',
    accountId: '',
    description: ''
  });

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId !== 'all') params.storeId = selectedStoreId;
      if (filter.status) params.status = filter.status;
      
      const { data } = await getCheques(params);
      setCheques(data || []);
    } catch (err) {
      toast.error('Failed to load cheques');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [storesRes, accountsRes] = await Promise.all([
        getStores(),
        getAccounts()
      ]);
      setStores(storesRes.data.stores || storesRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary data for cheques modal');
    }
  };

  useEffect(() => {
    fetchCheques();
  }, [selectedStoreId, filter.status]);

  useEffect(() => {
    fetchAuxiliary();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateChequeStatus(id, { status: newStatus });
      toast.success(`Cheque marked as ${newStatus}`);
      fetchCheques();
    } catch (err) {
      toast.error('Failed to update cheque status');
    }
  };

  const handleDeleteClick = (cheque) => {
    setItemToDelete(cheque);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTransaction(itemToDelete._id);

      toast.success('Cheque deleted successfully');
      fetchCheques();
    } catch (err) {
      toast.error('Failed to delete cheque');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.number || !form.bank || !form.dueDate || !form.amount || !form.storeId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await createTransaction({
        storeId: form.storeId,
        accountId: form.accountId || undefined,
        type: form.type,
        category: form.type === 'income' ? 'Cheque Received' : 'Cheque Issued',
        amount: Number(form.amount),
        paymentMethod: 'cheque',
        referenceNo: `CHQ-${form.number}`,
        description: form.description || `Cheque #${form.number} from ${form.bank}`,
        chequeDetails: {
          number: form.number,
          bank: form.bank,
          dueDate: form.dueDate,
          status: 'Pending'
        }
      });
      toast.success('Cheque recorded successfully!');
      setShowModal(false);
      setForm({
        number: '',
        bank: '',
        dueDate: '',
        amount: '',
        type: 'income',
        storeId: selectedStoreId !== 'all' ? selectedStoreId : '',
        accountId: '',
        description: ''
      });
      fetchCheques();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record cheque');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cleared': return 'ds-badge-green';
      case 'Bounced': return 'ds-badge-red';
      default: return 'ds-badge-amber';
    }
  };

  const filteredCheques = cheques.filter(c => 
    c.chequeDetails.number?.toLowerCase().includes(filter.search.toLowerCase()) ||
    c.chequeDetails.bank?.toLowerCase().includes(filter.search.toLowerCase()) ||
    c.description?.toLowerCase().includes(filter.search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} title="Cheque Management">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-badge"><Landmark size={24} /></div>
            <div>
              <h1>Cheque Registry</h1>
              <p>Monitor and manage all customer and supplier cheques</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button onClick={() => {
              setForm({ ...form, storeId: selectedStoreId !== 'all' ? selectedStoreId : '' });
              setShowModal(true);
            }} className="ds-btn ds-btn-primary">
              <Plus size={16} /> Record Cheque
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ds-card">
          <div className="ds-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="ds-filter-bar">
              <div className="ds-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by cheque number, bank, or note..."
                  className="ds-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} style={{ color: 'var(--ds-text-muted)' }} />
                <select
                  className="ds-select"
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Bounced">Bounced</option>
                </select>
              </div>
            </div>
          </div>

          <div className="ds-card-body">
            {loading ? (
              <div className="ds-loading"><div className="ds-spinner" /></div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Cheque Details</th>
                      <th>Due Date</th>
                      <th>Store</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCheques.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <div className="ds-empty">No cheques found matching your criteria.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredCheques.map((c) => (
                        <tr key={c._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--ds-r-sm)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ds-primary)' }}>
                                <FileText size={18} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--ds-text-head)' }}>#{c.chequeDetails.number || 'N/A'}</div>
                                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Building size={12} /> {c.chequeDetails.bank || 'Unknown Bank'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--ds-text-body)' }}>
                              <Calendar size={14} style={{ color: 'var(--ds-text-muted)' }} />
                              {c.chequeDetails.dueDate ? new Date(c.chequeDetails.dueDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td style={{ color: 'var(--ds-text-muted)' }}>
                            {c.storeId?.name || 'All Stores'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--ds-text-head)' }}>
                            Rs. {c.amount.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`ds-badge ${getStatusColor(c.chequeDetails.status)}`}>
                              {c.chequeDetails.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              {c.chequeDetails.status === 'Pending' && (
                                <>
                                  <button onClick={() => handleStatusUpdate(c._id, 'Cleared')} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" style={{ color: 'var(--ds-badge-green, #10b981)' }} title="Mark as Cleared"><CheckCircle2 size={16} /></button>
                                  <button onClick={() => handleStatusUpdate(c._id, 'Bounced')} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" style={{ color: 'var(--ds-badge-red, #ef4444)' }} title="Mark as Bounced"><AlertCircle size={16} /></button>
                                </>
                              )}
                              {c.chequeDetails.status !== 'Pending' && (
                                <button onClick={() => handleStatusUpdate(c._id, 'Pending')} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title="Reset to Pending"><Clock size={16} /></button>
                              )}
                              <button onClick={() => handleDeleteClick(c)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Delete Cheque Record"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="ds-modal-overlay">
          <div className="ds-modal ds-modal-lg">
            <div className="ds-modal-header">
              <h2 className="ds-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Landmark size={20} /> Record Cheque Payment</h2>
              <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ds-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ds-form-group">
                  <label className="ds-label">Cheque Type *</label>
                  <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="ds-select">
                    <option value="income">Received (Customer Cheque)</option>
                    <option value="expense">Issued (Supplier/Expense Cheque)</option>
                  </select>
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Cheque Number *</label>
                  <input required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="ds-input" placeholder="e.g. 102938" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Bank Name *</label>
                  <input required value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} className="ds-input" placeholder="e.g. BOC, Sampath Bank" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Due Date *</label>
                  <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="ds-input" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Amount (Rs.) *</label>
                  <input type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="ds-input" placeholder="0.00" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-label">Associated Store *</label>
                  <select required value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="ds-select">
                    <option value="">Select Branch...</option>
                    {stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ds-label">Target Bank Account (Optional)</label>
                  <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="ds-select">
                    <option value="">Select Account...</option>
                    {accounts.filter(a => a.type === 'Bank').map(a => <option key={a._id} value={a._id}>{a.name} ({a.bankName})</option>)}
                  </select>
                  <span className="ds-form-hint">Select the bank account where this cheque will be deposited once cleared.</span>
                </div>
                <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="ds-label">Description / Notes</label>
                  <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="ds-input" placeholder="Details about customer, invoice or supplier..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="ds-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="ds-btn ds-btn-primary">{saving ? 'Saving...' : 'Record Cheque'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.chequeDetails?.number ? `cheque #${itemToDelete.chequeDetails.number}` : 'this cheque'}
      />
    </DashboardLayout>
  );
};

export default AdminCheques;
