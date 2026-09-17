'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building, Save, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API, { uploadImage } from '../../services/api';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';
import EmployeePageHeader from './EmployeePageHeader';

const EmployeeProfile = () => {
  const { user, setUser } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const roleLabel =
    user?.role === 'deliveryGuy'
      ? 'Delivery Rider'
      : user?.role === 'cashier'
        ? 'Cashier'
        : user?.role === 'stockEmployee'
          ? 'Stock Employee'
          : user?.role;

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      const { data } = await API.put('/auth/profile', { phone });
      setUser(data);
      toast.success('Phone updated!');
    } catch (err) {
      toast.error('Failed to update');
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
      
      const { data: profileData } = await API.put('/auth/profile', { avatar: uploadData.url });
      setUser(profileData);
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
      const { data: profileData } = await API.put('/auth/profile', { avatar: '' });
      setUser(profileData);
      toast.success('Profile photo removed!');
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout navItems={getEmployeeNavGroups(user?.role)} title="Employee Portal">
      <div className="animate-fade-in space-y-6">
        <EmployeePageHeader
          badge="ACCOUNT"
          title="My Profile"
          subtitle="View employment details and manage personal information"
          icon={User}
        />

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-brand-indigo to-brand-violet rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-brand-indigo/15">
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative group cursor-pointer">
              {user?.avatar ? (
                <>
                  <img src={getImageUrl(user.avatar)} alt="Profile" className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-md" />
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-md z-20 transition-all hover:scale-110 border-0 cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white/20 shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="text-white text-xs font-bold">{uploading ? '...' : 'Change'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-black m-0 text-white leading-tight">{user?.name}</h2>
              <p className="text-brand-indigo-100 font-bold uppercase tracking-wider text-[10px] mt-1.5 px-3 py-1 bg-white/10 rounded-full w-fit backdrop-blur-xs">{roleLabel}</p>
              <p className="text-white/70 text-xs mt-2.5 font-medium">Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Personal Info */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2 m-0">
            <User size={14} className="text-slate-400" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Full Name</label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold select-none">
                <User size={14} className="text-slate-400" /> {user?.name}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Email</label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold select-none">
                <Mail size={14} className="text-slate-400" /> {user?.email}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Phone</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1 flex-1 shadow-xs">
                  <Phone size={14} className="text-slate-400 ml-1.5 shrink-0" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-0 py-2.5 px-2 text-xs font-bold text-slate-700 focus:outline-none"
                    placeholder="+94 7X XXX XXXX"
                  />
                </div>
                <button
                  onClick={handleSavePhone}
                  disabled={saving}
                  className="bg-brand-indigo hover:bg-brand-violet text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 border-0 transition-all cursor-pointer shadow-md"
                >
                  <Save size={14} /> {saving ? '...' : 'Save'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Role</label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-700 font-bold select-none">
                <Building size={14} className="text-slate-400" /> {roleLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Info */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2 m-0">
            <Building size={14} className="text-slate-400" /> Employment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Department</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.department || '—'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Joined Date</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.joinDate ? new Date(user.employeeInfo.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">EPF Number</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.epfNo || '—'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">ETF Number</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.etfNo || '—'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Bank Name</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.bankName || '—'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Account Number</label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs text-slate-700 font-bold select-none">
                {user?.employeeInfo?.bankAccount ? `****${user.employeeInfo.bankAccount.slice(-4)}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4">
             <div className="text-center space-y-2">
               <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Trash2 size={20} />
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

export default EmployeeProfile;
