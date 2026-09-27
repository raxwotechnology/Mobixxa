'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Users, Phone, Mail, MapPin, Building, DollarSign, Wallet, ArrowRight, Landmark } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getStores } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import useAdminStoreStore from '../../store/adminStoreStore';

const emptyForm = {
  name: '', company: '', contactPerson: '', email: '', phone: '', address: '', taxId: '', notes: '', status: 'active', storeId: '',
  bankName: '', bankBranch: '', bankAccountNumber: '', bankAccountName: '', allStores: false
};

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedStoreId } = useAdminStoreStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
      const [suppRes, storesRes] = await Promise.all([
        getSuppliers({ storeId: storeParam }), 
        getStores()
      ]);
      setSuppliers(suppRes.data || []);
      setStores(storesRes.data.stores || storesRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load suppliers';
      setError(msg);
      toast.error(msg);
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

  const openEdit = (supplier) => {
    setEditingId(supplier._id);
    setForm({
      name: supplier.name || '',
      company: supplier.company || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      notes: supplier.notes || '',
      status: supplier.status || 'active',
      storeId: supplier.storeId?._id || supplier.storeId || '',
      bankName: supplier.bankName || '',
      bankBranch: supplier.bankBranch || '',
      bankAccountNumber: supplier.bankAccountNumber || '',
      bankAccountName: supplier.bankAccountName || '',
      allStores: supplier.allStores || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!form.allStores && !form.storeId) {
        toast.error('Store assignment is required');
        setSaving(false);
        return;
      }

      if (editingId) {
        await updateSupplier(editingId, form);
        toast.success('Supplier updated');
      } else {
        await createSupplier(form);
        toast.success('Supplier added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (supplier) => {
    setItemToDelete({ id: supplier._id, name: supplier.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteSupplier(itemToDelete.id);
      toast.success('Supplier removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete supplier');
    }
  };

  const filtered = suppliers.filter((s) => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Supplier Management">
        <div className="ds-loading">
          <div className="ds-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Supplier Management">
      <div className="ds-page">
        
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <div className="ds-page-header-icon">
              <Users size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="ds-page-title">Suppliers</h1>
              <p className="ds-page-subtitle">{suppliers.length} active supply partners</p>
            </div>
          </div>
          <div className="ds-page-header-right">
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <Plus size={16} /> Add Supplier
            </button>
          </div>
        </div>

        <div className="ds-stats">
          <div className="ds-stat">
            <div className="ds-stat-icon" style={{ backgroundColor: 'var(--ds-primary)', color: '#fff' }}>
              <Users size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">Total Suppliers</p>
              <p className="ds-stat-value">{suppliers.length}</p>
              <p className="ds-stat-sub">Registered Suppliers</p>
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-stat-icon" style={{ backgroundColor: '#10b981', color: '#fff' }}>
              <Wallet size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">Total Outstanding Balance</p>
              <p className="ds-stat-value">Rs. {suppliers.reduce((s,su) => s + (su.outstandingBalance || 0), 0).toLocaleString()}</p>
              <p className="ds-stat-sub">Estimated</p>
            </div>
          </div>
          <div className="ds-stat" style={{ cursor: 'pointer' }}>
            <div className="ds-stat-icon" style={{ backgroundColor: 'transparent', color: 'var(--ds-primary)', border: '2px dashed var(--ds-border)' }}>
              <ArrowRight size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="ds-stat-label">Supplier Payments</p>
              <p className="ds-stat-value" style={{ fontSize: '1rem', color: 'var(--ds-primary)' }}>Manage payments</p>
            </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-filter-bar" style={{ padding: '16px' }}>
            <div className="ds-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, company, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ds-input"
              />
            </div>
          </div>
        </div>

        <div className="ds-card">
          <div className="ds-card-body" style={{ padding: 0 }}>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Contact</th>
                    <th>Bank Details</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="ds-empty">No suppliers found</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((supplier) => {
                      const storeObj = stores.find(s => s._id === (supplier.storeId?._id || supplier.storeId));
                      const storeName = supplier.allStores ? 'All Stores' : (storeObj?.name || 'Local Store');
                      return (
                        <tr key={supplier._id}>
                          <td>
                            <div style={{ fontWeight: 'bold', color: 'var(--ds-text-head)' }}>{supplier.name}</div>
                            <div style={{ fontSize: '0.85em', color: 'var(--ds-text-muted)' }}>{supplier.company || 'Private Supplier'}</div>
                            <span className={supplier.allStores ? 'ds-badge ds-badge-violet' : 'ds-badge ds-badge-blue'} style={{ marginTop: '4px' }}>
                              {storeName}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9em' }}>
                              <Phone size={14} color="var(--ds-text-muted)" /> {supplier.phone || 'No phone'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9em', marginTop: '4px' }}>
                              <Mail size={14} color="var(--ds-text-muted)" /> {supplier.email || 'No email'}
                            </div>
                          </td>
                          <td>
                            {supplier.bankAccountNumber ? (
                              <>
                                <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>{supplier.bankName || 'Bank'}</div>
                                <div style={{ fontSize: '0.85em', fontFamily: 'monospace' }}>{supplier.bankAccountNumber}</div>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.85em', color: 'var(--ds-text-muted)' }}>No Bank Account</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold', color: supplier.outstandingBalance > 0 ? '#ef4444' : '#10b981' }}>
                            Rs. {Number(supplier.outstandingBalance || 0).toLocaleString()}
                          </td>
                          <td>
                            <span className={`ds-badge ${supplier.status === 'active' ? 'ds-badge-green' : 'ds-badge-slate'}`}>
                              {supplier.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEdit(supplier)} className="ds-btn ds-btn-ghost ds-btn-icon">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteClick(supplier)} className="ds-btn ds-btn-danger ds-btn-icon">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ds-modal ds-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="ds-modal-header">
                <h2 className="ds-modal-title">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon">
                  <X size={20} />
                </button>
              </div>

              <div className="ds-modal-body">
                <form id="supplierForm" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Supplier Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ds-input" placeholder="e.g. John Doe" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Company Name</label>
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="ds-input" placeholder="e.g. Samsung Distribution" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Phone Number</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="ds-input" placeholder="07XXXXXXXX" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="ds-input" placeholder="supplier@example.com" />
                  </div>
                  <div className="ds-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="ds-label">Address</label>
                    <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="ds-input" placeholder="Enter physical address..." style={{ resize: 'none' }} />
                  </div>
                  
                  <div className="ds-form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      id="allStores" 
                      checked={form.allStores} 
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm({ 
                          ...form, 
                          allStores: checked, 
                          storeId: checked ? '' : (selectedStoreId !== 'all' ? selectedStoreId : '') 
                        });
                      }}
                    />
                    <label htmlFor="allStores" className="ds-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                      Global Supplier (Supplies to All Stores)
                    </label>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Store Assignment {!form.allStores && '*'}</label>
                    <select 
                      required={!form.allStores}
                      disabled={form.allStores || selectedStoreId !== 'all'}
                      value={form.allStores ? '' : form.storeId} 
                      onChange={(e) => setForm({ ...form, storeId: e.target.value })} 
                      className="ds-select"
                    >
                      <option value="">{form.allStores ? 'All Stores Scoped' : 'Select Store'}</option>
                      {stores.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="ds-select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--ds-border-soft)' }}>
                    <h4 style={{ fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--ds-text-head)' }}>Bank Account Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="ds-form-group">
                        <label className="ds-label">Bank Name</label>
                        <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="ds-input" placeholder="e.g. Commercial Bank" />
                      </div>
                      <div className="ds-form-group">
                        <label className="ds-label">Branch Name</label>
                        <input value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} className="ds-input" placeholder="e.g. Colombo 03" />
                      </div>
                      <div className="ds-form-group">
                        <label className="ds-label">Account Number</label>
                        <input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="ds-input" placeholder="e.g. 1009123456" />
                      </div>
                      <div className="ds-form-group">
                        <label className="ds-label">Account Holder Name</label>
                        <input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="ds-input" placeholder="e.g. Samsung Lanka Pvt Ltd" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="ds-modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-secondary">
                  Cancel
                </button>
                <button type="submit" form="supplierForm" disabled={saving} className="ds-btn ds-btn-primary">
                  {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminSuppliers;
