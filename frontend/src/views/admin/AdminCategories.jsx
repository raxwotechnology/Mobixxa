'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', image: '' });
  const [saving, setSaving] = useState(false);

  // Deletion States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', icon: '', image: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, icon: cat.icon || '', image: cat.image || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        toast.success('Category updated');
      } else {
        await createCategory(form);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (cat) => {
    setItemToDelete({ id: cat._id, name: cat.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteCategory(itemToDelete.id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Categories">
        <div className="ds-page">
          <div className="ds-loading"><div className="ds-spinner" /></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Categories">
      <div className="ds-page">
        <div className="ds-page-header">
          <div className="ds-page-header-left">
            <span className="ds-page-header-badge">
              <Tag size={11} /> Categories
            </span>
            <h1>Product Categories</h1>
            <p>{categories.length} categories configured</p>
          </div>
          <div className="ds-page-header-right">
            <button onClick={openCreate} className="ds-btn ds-btn-primary">
              <Plus size={16} /> Add Category
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {categories.map((cat) => (
            <div key={cat._id} className="ds-card" style={{ overflow: 'hidden' }}>
              <div style={{ height: '120px', background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Tag size={36} style={{ color: 'var(--ds-text-faint)' }} />
                )}
              </div>
              <div className="ds-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {cat.icon && <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>}
                  <div style={{ fontWeight: 600, color: 'var(--ds-text-body)' }}>{cat.name}</div>
                </div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-muted)', fontFamily: 'monospace', marginBottom: '1rem' }}>
                  slug: {cat.slug}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(cat)} className="ds-btn ds-btn-ghost ds-btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => handleDeleteClick(cat)} className="ds-btn ds-btn-danger ds-btn-sm" style={{ flex: 1 }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="ds-empty">
            No categories yet. Click "Add Category" to create one.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ds-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <div className="ds-modal-title">{editingId ? 'Edit Category' : 'New Category'}</div>
              <button onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost ds-btn-icon"><X size={18} /></button>
            </div>
            <div className="ds-modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ds-form-group">
                    <label className="ds-label">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Icon (emoji)</label>
                    <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="ds-input" />
                  </div>
                  <div className="ds-form-group">
                    <label className="ds-label">Image URL</label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="ds-input" />
                  </div>
                </div>
                <div className="ds-modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="ds-btn ds-btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="ds-btn ds-btn-primary">
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </button>
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
        itemName={itemToDelete?.name}
      />
    </DashboardLayout>
  );
};

export default AdminCategories;
