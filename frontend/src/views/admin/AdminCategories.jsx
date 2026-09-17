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
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-indigo rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Categories">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex items-center gap-1.5 bg-brand-indigo/10 text-brand-indigo text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-brand-indigo/15">
                <Tag size={11} /> Business Management
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 m-0">Product Categories</h1>
            <p className="text-slate-400 text-xs font-normal mt-1 m-0">{categories.length} categories configured</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-indigo/20 transition-all cursor-pointer"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-indigo/30 transition-all group">
              {/* Image */}
              <div className="h-32 bg-gradient-to-br from-brand-indigo/10 to-brand-violet/5 flex items-center justify-center relative overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <Tag size={36} className="text-brand-indigo/30" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {cat.icon && <span className="text-lg">{cat.icon}</span>}
                  <h3 className="font-extrabold text-slate-800 text-sm m-0">{cat.name}</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mb-3 m-0">slug: {cat.slug}</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/15 transition-colors cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-400 text-sm font-bold">
            No categories yet. Click "Add Category" to create one.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/80" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 m-0">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Icon (emoji)</label>
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📱" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Image URL</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-indigo/15 focus:border-brand-indigo bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-brand-indigo/20 cursor-pointer">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
                  Cancel
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

export default AdminCategories;
