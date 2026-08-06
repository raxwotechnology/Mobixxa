import { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Save, Plus, Trash2, Shield, Package } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getMe, updateProfile, uploadImage } from '../../services/api';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { getImageUrl } from '../../utils/imageHelper';
import { Link } from 'react-router-dom';

import { adminNavGroups } from '../admin/adminNavItems';
import { managerNavGroups } from '../storeOwner/managerNavItems';
import { getEmployeeNavGroups } from '../employee/employeeNav';

const defaultCustomerNavItems = [
  { path: '/profile', label: 'My Profile', icon: User },
];

const Profile = () => {
  const { user, login } = useAuthStore();
  
  const getNavGroups = () => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'manager') return managerNavGroups;
    if (['cashier', 'deliveryGuy', 'stockEmployee'].includes(user?.role)) {
      return getEmployeeNavGroups(user.role);
    }
    return null;
  };

  const navGroups = getNavGroups();
  const layoutProps = navGroups ? { navItems: navGroups, activePath: '/profile' } : { navItems: defaultCustomerNavItems, activePath: '/profile' };

  const settings = useSettingsStore((s) => s.settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    addresses: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getMe();
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          addresses: data.addresses || [],
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...form.addresses];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, addresses: updated });
  };

  const addAddress = () => {
    setForm({
      ...form,
      addresses: [...form.addresses, { street: '', city: '', state: '', zipCode: '', country: '', isDefault: false }],
    });
  };

  const removeAddress = (index) => {
    const updated = form.addresses.filter((_, i) => i !== index);
    setForm({ ...form, addresses: updated });
  };

  const setDefaultAddress = (index) => {
    const updated = form.addresses.map((addr, i) => ({ ...addr, isDefault: i === index }));
    setForm({ ...form, addresses: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, addresses: form.addresses };
      if (form.password) payload.password = form.password;
      const { data } = await updateProfile(payload);
      login(data);
      toast.success('Profile updated successfully!');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const { data: uploadData } = await uploadImage(fd);
      
      const { data: profileData } = await updateProfile({ avatar: uploadData.url });
      login(profileData);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Failed to update photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const { data: profileData } = await updateProfile({ avatar: '' });
      login(profileData);
      toast.success('Profile photo removed!');
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout {...layoutProps} title="My Account">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...layoutProps} title="My Account">
      <div className="max-w-3xl space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-sky-400">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 m-0">My Account Profile</h1>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 m-0">Personal details, contact numbers & saved delivery locations</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group cursor-pointer">
                {user?.avatar ? (
                  <>
                    <img src={getImageUrl(user.avatar)} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-xs border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md z-20 transition-all hover:scale-110 border-0 cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xs text-sky-400">
                    <User size={32} />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-white text-[10px] font-black uppercase tracking-wider">{uploading ? '...' : 'Change'}</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 m-0">{user?.name || 'Customer'}</h2>
                <p className="text-xs text-slate-500 font-semibold m-0 mt-1">Manage your account profile and profile image</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-205 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-205 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-205 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">New Password <span className="text-slate-400 font-medium">(optional)</span></label>
                <div className="relative">
                  <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                    className="w-full bg-white border border-slate-205 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="glass-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
                  <MapPin size={16} className="text-brand-indigo" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-850 m-0 uppercase tracking-wider">Delivery Addresses</h2>
                  <p className="text-xs text-slate-400 font-semibold m-0 mt-0.5">Manage your saved addresses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addAddress}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-indigo hover:text-brand-violet transition-colors border-0 bg-transparent cursor-pointer"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {form.addresses.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <MapPin size={28} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-wider">No addresses saved yet</p>
              </div>
            )}

            <div className="space-y-4">
              {form.addresses.map((addr, i) => (
                <div key={i} className={`border rounded-2xl p-4 transition-all ${addr.isDefault ? 'border-brand-indigo/30 bg-brand-indigo/5' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(i)}
                      className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                        addr.isDefault 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {addr.isDefault ? '✓ Default' : 'Set as Default'}
                    </button>
                    <button type="button" onClick={() => removeAddress(i)} className="text-rose-450 hover:text-rose-600 transition-colors bg-transparent border-0 cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input placeholder="Street" value={addr.street || ''} onChange={(e) => handleAddressChange(i, 'street', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                    <input placeholder="City" value={addr.city || ''} onChange={(e) => handleAddressChange(i, 'city', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                    <input placeholder="State" value={addr.state || ''} onChange={(e) => handleAddressChange(i, 'state', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                    <input placeholder="Zip Code" value={addr.zipCode || ''} onChange={(e) => handleAddressChange(i, 'zipCode', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-violet text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer border-0"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Help Center & Support Contacts */}
        <div id="help-center" className="mt-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 text-2xl">
              🎧
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white m-0">Help Center & Support Hotlines</h3>
              <p className="text-xs text-blue-300 m-0">Direct shop, admin, and management support contact details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Shop Support */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <span>🛍️</span> Shop Support
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="flex items-center gap-2 m-0">
                  <Phone size={14} className="text-blue-400 shrink-0" />
                  <span className="font-semibold">{settings?.phone || '+94 11 255 5000'}</span>
                </p>
                {settings?.phone2 && (
                  <p className="flex items-center gap-2 m-0">
                    <Phone size={14} className="text-blue-400 shrink-0" />
                    <span>{settings.phone2}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 m-0">
                  <Mail size={14} className="text-blue-400 shrink-0" />
                  <span>{settings?.email || 'support@mobilehub.com'}</span>
                </p>
                <p className="flex items-start gap-2 m-0 text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <MapPin size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>{settings?.address || '88 Tech Avenue, Colombo 03'}</span>
                </p>
              </div>
            </div>

            {/* 2. Admin Support */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span>🛡️</span> Admin Support
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="flex items-center gap-2 m-0">
                  <Phone size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold">{settings?.phone || '+94 77 123 4567'}</span>
                </p>
                <p className="flex items-center gap-2 m-0">
                  <Mail size={14} className="text-emerald-400 shrink-0" />
                  <span>{settings?.email || 'admin@raxwo.net'}</span>
                </p>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Account & Payments Escalation
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Manager Support */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span>👔</span> Store Manager
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="flex items-center gap-2 m-0">
                  <Phone size={14} className="text-amber-400 shrink-0" />
                  <span className="font-semibold">{settings?.phone2 || settings?.phone || '+94 71 987 6543'}</span>
                </p>
                <p className="flex items-center gap-2 m-0">
                  <Mail size={14} className="text-amber-400 shrink-0" />
                  <span>manager@mobilehub.com</span>
                </p>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                    Orders & Return Queries
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
            <p className="m-0">⏰ <strong>Operating Hours:</strong> Mon - Sat: 8:30 AM - 7:00 PM | Sun: 9:00 AM - 5:00 PM</p>
            <div className="flex gap-2">
              <a href={`tel:${settings?.phone || '+94112555000'}`} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition-colors">
                📞 Call Shop
              </a>
              <a href={`mailto:${settings?.email || 'support@mobilehub.com'}`} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl transition-colors">
                ✉️ Email Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                ⚠️
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Delete Profile Photo</h3>
              <p className="text-sm text-slate-500">Are you sure you want to permanently delete your profile photo?</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleRemoveAvatar();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
