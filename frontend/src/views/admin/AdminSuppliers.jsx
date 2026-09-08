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
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Supplier Management">
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Users size={20} strokeWidth={2.5} />
              </div>
              Suppliers
            </h1>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">{suppliers.length} active supply partners</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-wider text-[11px] hover:bg-brand-indigo transition-all shadow-md hover:shadow-brand-indigo/20">
            <Plus size={16} strokeWidth={3} /> Add Supplier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-brand-indigo p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
             <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Users size={20} /></div>
               <span className="text-[10px] font-black tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">TOTAL</span>
             </div>
             <h3 className="text-4xl font-black tracking-tight">{suppliers.length}</h3>
             <p className="text-indigo-100/80 text-[10px] font-black uppercase tracking-wider mt-2">Registered Suppliers</p>
           </div>
           
           <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
             <div className="flex justify-between items-start mb-4">
               <div className="w-10 h-10 bg-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center"><Wallet size={20} /></div>
               <span className="text-[10px] font-black tracking-wider text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full">ESTIMATED</span>
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">Rs. {suppliers.reduce((s,su) => s + (su.outstandingBalance || 0), 0).toLocaleString()}</h3>
             <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-2">Total Outstanding Balance</p>
           </div>

           <div className="bg-white/40 p-6 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm flex items-center justify-center group hover:bg-white/60 transition-all cursor-pointer">
             <div className="text-center transition-transform group-hover:scale-105">
               <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Manage payments in</p>
               <button className="text-[12px] font-black uppercase tracking-wider text-brand-indigo flex items-center gap-2 mx-auto">
                 Supplier Payments <ArrowRight size={14} strokeWidth={3} />
               </button>
             </div>
           </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 bg-white/80 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((supplier) => {
            const storeObj = stores.find(s => s._id === (supplier.storeId?._id || supplier.storeId));
            const storeName = supplier.allStores ? 'All Stores' : (storeObj?.name || 'Local Store');
            
            return (
              <div key={supplier._id} className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-lg hover:shadow-brand-indigo/5 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo font-black text-xl group-hover:scale-110 transition-transform">
                        {supplier.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-black text-slate-900 text-lg leading-tight">{supplier.name}</h3>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${supplier.allStores ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {storeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Building size={12} /> {supplier.company || 'Private Supplier'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(supplier)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-brand-indigo hover:border-brand-indigo/30 hover:bg-brand-indigo/5 transition-all shadow-sm"><Edit2 size={14} strokeWidth={2.5} /></button>
                      <button onClick={() => handleDeleteClick(supplier)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"><Trash2 size={14} strokeWidth={2.5} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                           <Phone size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600">{supplier.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                           <Mail size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 truncate">{supplier.email || 'No email'}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                           <MapPin size={14} />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 leading-snug">{supplier.address || 'No address'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  {supplier.bankAccountNumber ? (
                    <div className="mt-6 p-4 bg-slate-50/50 rounded-2xl flex items-start gap-3 border border-slate-100 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                         <Landmark size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-[11px] text-slate-800 uppercase tracking-wider">{supplier.bankName || 'Bank Account'}</p>
                        <p className="font-mono text-sm font-bold text-slate-600 mt-0.5 truncate">{supplier.bankAccountNumber} <span className="text-[10px] text-slate-400 tracking-normal font-sans">({supplier.bankBranch || 'No Branch'})</span></p>
                        {supplier.bankAccountName && (
                          <p className="text-[10px] font-bold text-slate-400 truncate mt-1 uppercase tracking-wider">A/C: {supplier.bankAccountName}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-slate-50/30 rounded-2xl text-center text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 border-dashed">
                      No Bank Account Linked
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Outstanding Balance</p>
                    <p className={`font-black text-xl tracking-tight ${supplier.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      Rs. {Number(supplier.outstandingBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${supplier.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {supplier.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-white/20" onClick={(e) => e.stopPropagation()}>
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-indigo to-purple-500"></div>
                <h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"><X size={20} strokeWidth={2.5} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Supplier Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Company Name</label>
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" placeholder="e.g. Samsung Distribution" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" placeholder="07XXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" placeholder="supplier@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Address</label>
                    <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all resize-none" placeholder="Enter physical address..." />
                  </div>
                  
                  <div className="md:col-span-2 flex items-center gap-3 p-4 bg-brand-indigo/5 rounded-2xl border border-brand-indigo/10">
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
                      className="w-5 h-5 text-brand-indigo rounded-lg border-slate-300 focus:ring-brand-indigo cursor-pointer"
                    />
                    <label htmlFor="allStores" className="text-[11px] font-black text-brand-indigo uppercase tracking-wider cursor-pointer select-none">
                      Global Supplier (Supplies to All Stores)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Store Assignment {!form.allStores && '*'}</label>
                    <select 
                      required={!form.allStores}
                      disabled={form.allStores || selectedStoreId !== 'all'}
                      value={form.allStores ? '' : form.storeId} 
                      onChange={(e) => setForm({ ...form, storeId: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all disabled:opacity-50"
                    >
                      <option value="">{form.allStores ? 'All Stores Scoped' : 'Select Store'}</option>
                      {stores.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Landmark size={12} strokeWidth={3} />
                      </div>
                      Bank Account Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Bank Name</label>
                        <input 
                          value={form.bankName} 
                          onChange={(e) => setForm({ ...form, bankName: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" 
                          placeholder="e.g. Commercial Bank" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Branch Name</label>
                        <input 
                          value={form.bankBranch} 
                          onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" 
                          placeholder="e.g. Colombo 03" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Account Number</label>
                        <input 
                          value={form.bankAccountNumber} 
                          onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all font-mono" 
                          placeholder="e.g. 1009123456" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Account Holder Name</label>
                        <input 
                          value={form.bankAccountName} 
                          onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 transition-all" 
                          placeholder="e.g. Samsung Lanka Pvt Ltd" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-brand-indigo shadow-lg shadow-brand-indigo/20 transition-all">
                    {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 border border-slate-200 rounded-xl font-black uppercase tracking-wider text-[11px] text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
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
