'use client';

import { useState, useEffect } from 'react';
import { Store, ToggleLeft, ToggleRight, ExternalLink, Plus, X, Edit2, Trash2, AlertCircle, AlertTriangle, Upload, Trash, Package, DollarSign, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStoreSummaries, toggleStoreStatus, createStore, updateStore, deleteStore, uploadImage } from '../../services/api';

import API from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from '../../utils/navigation';
import { adminNavGroups as navItems } from './adminNavItems';
import StockTransferModal from './StockTransferModal';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

import { getImageUrl } from '../../utils/imageHelper';

const emptyForm = { name: '', description: '', address: '', city: '', phone: '', email: '', bannerImage: '', logo: '', managerId: '' };

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [storeToToggle, setStoreToToggle] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);

  const fetchStores = async () => {
    try { const { data } = await getAdminStoreSummaries(); setStores(data); }
    catch { toast.error('Failed to load stores'); }
    finally { setLoading(false); }
  };

  const fetchManagers = async () => {
    try { const { data } = await API.get('/admin/users'); setManagers((data.users || data).filter(u => u.role === 'manager')); }
    catch { /* ignore */ }
  };

  useEffect(() => { fetchStores(); fetchManagers(); }, []);

  const handleToggleClick = (storeId, storeName, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    setStoreToToggle({ id: storeId, name: storeName, action });
    setToggleModalOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (!storeToToggle) return;
    try {
      await toggleStoreStatus(storeToToggle.id);
      toast.success(`Store ${storeToToggle.action}d successfully`);
      fetchStores();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggleModalOpen(false);
      setStoreToToggle(null);
    }
  };

  const handleDeleteClick = (store) => {
    setStoreToDelete({ id: store._id, name: store.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!storeToDelete) return;
    try {
      await deleteStore(storeToDelete.id);
      toast.success('Store deleted successfully');
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete store');
    } finally {
      setDeleteModalOpen(false);
      setStoreToDelete(null);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (s) => {
    setEditingId(s._id);
    setForm({ name: s.name||'', description: s.description||'', address: s.address||'', city: s.city||'', phone: s.phone||'', email: s.email||'', bannerImage: s.bannerImage||'', logo: s.logo||'', managerId: s.managerId?._id||'' });
    setShowModal(true);
  };

  const handleImageUpload = async (field, e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadImage(fd);
      setForm(prev => ({ ...prev, [field]: data.url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingId) { await updateStore(editingId, form); toast.success('Store updated!'); }
      else { await createStore(form); toast.success('Store created!'); }
      setShowModal(false); fetchStores();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Stores">
        <div className="ds-page">
          <div className="ds-loading"><div className="ds-spinner" /></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Stores">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Store size={11} /> Stores
            </span>
            <h1>Store Management</h1>
            <p>{stores.length} registered boutiques</p>
          </div>
          <div className="ds-page-header-right" style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowTransferModal(true)} className="ds-btn ds-btn-secondary">
              <ToggleRight size={15} /> Transfer Stock
            </button>
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <Plus size={16} /> Add Store
            </button>
          </div>
        </div>

        {/* Store Network KPI Metrics */}
        <div className="ds-stats">
          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <Store size={18} />
              </div>
              <span className="ds-stat-change blue">Network</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Total Boutiques</p>
              <p className="ds-stat-value">{stores.length}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <CheckCircle size={18} />
              </div>
              <span className="ds-stat-change up">Operational</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Active Outlets</p>
              <p className="ds-stat-value text-emerald-600">{stores.filter(s => s.isActive).length}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Package size={18} />
              </div>
              <span className="ds-stat-change neu">Units</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Total Stock Items</p>
              <p className="ds-stat-value">{stores.reduce((sum, s) => sum + (s.totalStock || 0), 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="ds-stat">
            <div className="ds-stat-top">
              <div className="ds-stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
                <DollarSign size={18} />
              </div>
              <span className="ds-stat-change amber">Asset Value</span>
            </div>
            <div className="ds-stat-bottom">
              <p className="ds-stat-label">Stock Valuation</p>
              <p className="ds-stat-value text-blue-600">Rs. {stores.reduce((sum, s) => sum + (s.totalStockValue || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {stores.map(store => (
            <div key={store._id} className="ds-card" style={{ opacity: store.isActive ? 1 : 0.8, overflow: 'hidden', padding: 0 }}>
              <div style={{ height: '120px', background: 'var(--ds-border-soft)', position: 'relative' }}>
                {store.bannerImage ? (
                  <img src={getImageUrl(store.bannerImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={32} style={{ color: '#94a3b8', opacity: 0.6 }} />
                  </div>
                )}
                <span className={`ds-badge ${store.isActive ? 'ds-badge-green' : 'ds-badge-red'}`} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="ds-card-body" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {store.logo ? (
                    <img src={getImageUrl(store.logo)} alt="" style={{ width: '42px', height: '42px', borderRadius: 'var(--ds-r-md)', objectFit: 'cover', border: '1px solid var(--ds-border)' }} />
                  ) : (
                    <div style={{ width: '42px', height: '42px', borderRadius: 'var(--ds-r-md)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Store size={20} style={{ color: 'var(--ds-text-faint)' }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ds-text-head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</div>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{store.city || 'Colombo'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem', background: '#fafbfc', padding: '0.75rem 1rem', borderRadius: 'var(--ds-r-md)', border: '1px solid var(--ds-border)' }}>
                  <div>
                    <div className="ds-stat-label">Stock Units</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ds-text-head)', marginTop: '0.125rem' }}>
                      {(store.totalStock || 0).toLocaleString()} <span style={{ fontSize: '0.6875rem', color: 'var(--ds-text-muted)', fontWeight: 500 }}>({store.totalProducts || 0} items)</span>
                    </div>
                  </div>
                  <div>
                    <div className="ds-stat-label">Inventory Worth</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.125rem' }}>
                      Rs. {(store.totalStockValue || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <div className="ds-stat-label">Bank &amp; Cash Reserves</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ds-text-head)', marginTop: '0.125rem' }}>
                      Rs. {(store.totalAssets || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong style={{ color: 'var(--ds-text-body)' }}>Manager:</strong> {store.managerId?.name || 'Unassigned'}</div>
                  <div><strong style={{ color: 'var(--ds-text-body)' }}>Phone:</strong> {store.phone || '—'}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--ds-border-soft)', paddingTop: '0.875rem' }}>
                  <button onClick={() => handleToggleClick(store._id, store.name, store.isActive)} className={`ds-btn ds-btn-sm ${store.isActive ? 'ds-btn-danger' : 'ds-btn-primary'}`} style={{ flex: 1 }}>
                    {store.isActive ? <><ToggleRight size={14} /> Deactivate</> : <><ToggleLeft size={14} /> Activate</>}
                  </button>
                  <button onClick={() => openEdit(store)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title="Edit Store"><Edit2 size={13} /></button>
                  <button onClick={() => handleDeleteClick(store)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Delete Store"><Trash2 size={13} /></button>
                  <Link to={`/store/${store._id}`} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title="Open Store Dashboard"><ExternalLink size={13} /></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {stores.length === 0 && (
          <div className="ds-empty">
            <Store size={40} style={{ color: 'var(--ds-text-faint)', margin: '0 auto 1rem' }} />
            <p>No stores registered yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ds-modal ds-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <div className="ds-modal-title">{editingId ? 'Edit Store' : 'Add New Store'}</div>
              <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon"><X size={18} /></button>
            </div>
            <div className="ds-modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Store Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Mobixa Atelier Colombo" className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Assign Manager</label>
                    <select value={form.managerId} onChange={e => setForm({...form, managerId: e.target.value})} className="ds-select">
                      <option value="">Select manager...</option>
                      {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">City</label>
                      <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Colombo" className="ds-input" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Phone</label>
                      <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+94 XX XXX XXXX" className="ds-input" />
                    </div>
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Address</label>
                    <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address" className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="store@example.com" className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" placeholder="About this store..." className="ds-input" style={{ resize: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">Logo</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--ds-r-md)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {form.logo ? <img src={getImageUrl(form.logo)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={16} style={{ color: 'var(--ds-text-faint)' }} />}
                        </div>
                        <label className="ds-btn ds-btn-secondary ds-btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
                          <Upload size={13} /> {uploadingField === 'logo' ? 'Uploading...' : form.logo ? 'Change' : 'Upload'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingField === 'logo'} onChange={e => handleImageUpload('logo', e)} />
                        </label>
                        {form.logo && (
                          <button type="button" onClick={() => setForm({...form, logo: ''})} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Remove logo"><Trash size={13} /></button>
                        )}
                      </div>
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">Banner</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--ds-r-md)', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {form.bannerImage ? <img src={getImageUrl(form.bannerImage)} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={16} style={{ color: 'var(--ds-text-faint)' }} />}
                        </div>
                        <label className="ds-btn ds-btn-secondary ds-btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
                          <Upload size={13} /> {uploadingField === 'bannerImage' ? 'Uploading...' : form.bannerImage ? 'Change' : 'Upload'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingField === 'bannerImage'} onChange={e => handleImageUpload('bannerImage', e)} />
                        </label>
                        {form.bannerImage && (
                          <button type="button" onClick={() => setForm({...form, bannerImage: ''})} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm" title="Remove banner"><Trash size={13} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ds-modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost">Cancel</button>
                  <button type="submit" disabled={saving || !!uploadingField} className="ds-btn ds-btn-primary">
                    {saving ? 'Saving...' : editingId ? 'Update Store' : 'Create Store'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <StockTransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
        stores={stores.filter(s => s.isActive)} 
      />

      {/* Toggle Status Confirmation Modal */}
      {toggleModalOpen && storeToToggle && (
        <div className="ds-modal-overlay" onClick={() => { setToggleModalOpen(false); setStoreToToggle(null); }}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <div className="ds-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} style={{ color: storeToToggle.action === 'deactivate' ? 'var(--ds-red)' : 'var(--ds-green)' }} />
                <span style={{ textTransform: 'capitalize' }}>{storeToToggle.action} Store</span>
              </div>
              <button onClick={() => { setToggleModalOpen(false); setStoreToToggle(null); }} className="ds-btn ds-btn-ghost ds-btn-icon"><X size={18} /></button>
            </div>
            <div className="ds-modal-body">
              <p style={{ margin: 0 }}>
                Are you sure you want to <strong>{storeToToggle.action}</strong> the store <strong>"{storeToToggle.name}"</strong>?
              </p>
            </div>
            <div className="ds-modal-footer">
              <button 
                type="button" 
                onClick={() => { setToggleModalOpen(false); setStoreToToggle(null); }} 
                className="ds-btn ds-btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleToggleConfirm} 
                className={`ds-btn ${storeToToggle.action === 'deactivate' ? 'ds-btn-danger' : 'ds-btn-primary'}`}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setStoreToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={storeToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminStores;
