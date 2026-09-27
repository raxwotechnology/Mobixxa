'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Trash2, ToggleLeft, ToggleRight, Tag, Gift, Percent, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { adminNavGroups as navItems } from './adminNavItems';
import { getPromotions, createPromotion, deletePromotion, togglePromotion } from '../../services/api';
import { toast } from 'react-toastify';

const PROMO_TYPES = [
  { value: 'percentage', label: 'Percentage Off', icon: '' },
  { value: 'fixed', label: 'Fixed Amount Off', icon: '' },
  { value: 'bogo', label: 'Buy One Get One', icon: '' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y Free', icon: '' },
];

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'percentage', discountValue: '', buyQuantity: '',
    getQuantity: '', startDate: '', endDate: '', description: '',
    minOrderAmount: '', maxDiscountAmount: '',
  });

  const fetchPromotions = async () => {
    try {
      const { data } = await getPromotions();
      setPromotions(data);
    } catch (err) {
      toast.error('Failed to load promotions');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPromotion({
        name: form.name,
        type: form.type,
        discountValue: Number(form.discountValue),
        buyQuantity: Number(form.buyQuantity) || 0,
        getQuantity: Number(form.getQuantity) || 0,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
        conditions: {
          minOrderAmount: Number(form.minOrderAmount) || 0,
          maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
        },
      });
      toast.success('Promotion created!');
      setShowModal(false);
      setForm({ name: '', type: 'percentage', discountValue: '', buyQuantity: '', getQuantity: '', startDate: '', endDate: '', description: '', minOrderAmount: '', maxDiscountAmount: '' });
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleToggle = async (id) => {
    try {
      await togglePromotion(id);
      toast.success('Status updated');
      fetchPromotions();
    } catch (err) { toast.error('Failed'); }
  };

  const handleDeleteClick = (promotion) => {
    setItemToDelete(promotion);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePromotion(itemToDelete._id);
      toast.success('Deleted');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchPromotions();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();
  const isUpcoming = (startDate) => new Date(startDate) > new Date();

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Promotions">
        <div className="ds-page">
          <div className="ds-loading"><div className="ds-spinner" /></div>
        </div>
      </DashboardLayout>
    );
  }

  const activeCount = promotions.filter(p => p.isActive && !isExpired(p.endDate)).length;
  const expiredCount = promotions.filter(p => isExpired(p.endDate)).length;

  return (
    <DashboardLayout navItems={navItems} title="Promotions">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge"><Gift size={11} /> Promotions</span>
            <h1>Promotions & Discounts</h1>
            <p>{promotions.length} total • {activeCount} active • {expiredCount} expired</p>
          </div>
          <div className="ds-page-header-right">
            <button onClick={() => setShowModal(true)} className="ds-btn ds-btn-primary">
              <Plus size={18} /> New Promotion
            </button>
          </div>
        </div>

        {/* Promotions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {promotions.map(p => {
            const expired = isExpired(p.endDate);
            const upcoming = isUpcoming(p.startDate);
            const typeInfo = PROMO_TYPES.find(t => t.value === p.type) || PROMO_TYPES[0];
            return (
              <div key={p._id} className="ds-card" style={{ opacity: expired ? 0.6 : 1, borderColor: p.isActive && !expired ? 'var(--ds-primary)' : 'var(--ds-border)' }}>
                <div className="ds-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                    <div>
                      <div className="ds-card-title">{p.name}</div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>{typeInfo.label}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleToggle(p._id)} className="ds-btn ds-btn-ghost ds-btn-icon ds-btn-sm" title={p.isActive ? 'Deactivate' : 'Activate'}>
                      {p.isActive ? <ToggleRight size={20} style={{color: 'var(--ds-primary)'}} /> : <ToggleLeft size={20} style={{color: 'var(--ds-text-muted)'}} />}
                    </button>
                    <button onClick={() => handleDeleteClick(p)} className="ds-btn ds-btn-danger ds-btn-icon ds-btn-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="ds-card-body">
                  <div style={{ background: 'var(--ds-border-soft)', padding: '1rem', borderRadius: 'var(--ds-r-md)', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {p.type === 'percentage' && `${p.discountValue}% OFF`}
                      {p.type === 'fixed' && `Rs. ${p.discountValue} OFF`}
                      {p.type === 'bogo' && `Buy 1 Get 1 Free`}
                      {p.type === 'buy_x_get_y' && `Buy ${p.buyQuantity} Get ${p.getQuantity} Free`}
                    </span>
                  </div>

                  {p.description && <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)', marginBottom: '0.5rem' }}>{p.description}</p>}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', marginBottom: '1rem' }}>
                    <Calendar size={12} />
                    <span>{new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {expired && <span className="ds-badge ds-badge-red">Expired</span>}
                    {upcoming && !expired && <span className="ds-badge ds-badge-blue">Upcoming</span>}
                    {!expired && !upcoming && p.isActive && <span className="ds-badge ds-badge-green">Active</span>}
                    {!p.isActive && <span className="ds-badge ds-badge-slate">Disabled</span>}
                    {p.conditions?.minOrderAmount > 0 && <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)' }}>Min: Rs.{p.conditions.minOrderAmount}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {promotions.length === 0 && (
          <div className="ds-empty">
            <Gift size={48} style={{ color: 'var(--ds-text-faint)', margin: '0 auto 1rem' }} />
            <p>No promotions yet</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ds-modal ds-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <div className="ds-modal-title">New Promotion</div>
              <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon"><X size={20} /></button>
            </div>
            <div className="ds-modal-body">
              <form onSubmit={handleCreate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Name *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Weekend Special" className="ds-input" />
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Type *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {PROMO_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => setForm({...form, type: t.value})} className={`ds-btn ${form.type === t.value ? 'ds-btn-primary' : 'ds-btn-secondary'}`} style={{ justifyContent: 'flex-start' }}>
                          <span>{t.icon}</span> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">
                        {form.type === 'percentage' ? 'Discount %' : form.type === 'fixed' ? 'Discount Amount (Rs.)' : 'Discount Value'} *
                      </label>
                      <input type="number" required min="0" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})} className="ds-input" />
                    </div>
                    {form.type === 'buy_x_get_y' && (
                      <>
                        <div className="ds-form-group">
                          <label className="ds-label">Buy Qty</label>
                          <input type="number" min="1" value={form.buyQuantity} onChange={(e) => setForm({...form, buyQuantity: e.target.value})} className="ds-input" />
                        </div>
                        <div className="ds-form-group">
                          <label className="ds-label">Get Qty Free</label>
                          <input type="number" min="1" value={form.getQuantity} onChange={(e) => setForm({...form, getQuantity: e.target.value})} className="ds-input" />
                        </div>
                      </>
                    )}
                    <div className="ds-form-group">
                      <label className="ds-label">Min Order (Rs.)</label>
                      <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({...form, minOrderAmount: e.target.value})} placeholder="0" className="ds-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ds-form-group">
                      <label className="ds-label">Start Date *</label>
                      <input type="date" required value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="ds-input" />
                    </div>
                    <div className="ds-form-group">
                      <label className="ds-label">End Date *</label>
                      <input type="date" required value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} className="ds-input" />
                    </div>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-label">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="2" placeholder="Optional description..." className="ds-input" style={{ resize: 'none' }} />
                  </div>
                </div>

                <div className="ds-modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost">Cancel</button>
                  <button type="submit" className="ds-btn ds-btn-primary">Create Promotion</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName="this promotion"
      />
    </DashboardLayout>
  );
};

export default AdminPromotions;
