'use client';

import { useState } from 'react';
import { User, Mail, Phone, Building, Save, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { getEmployeeNavGroups } from './employeeNav';
import API, { uploadImage } from '../../services/api';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';

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
      <div className="ds-page">
        {/* Profile Header */}
        <div className="ds-card" style={{ overflow: 'hidden' }}>
          <div className="ds-card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--ds-primary)', color: '#fff', padding: '2rem' }}>
            <div className="relative group cursor-pointer">
              {user?.avatar ? (
                <>
                  <img src={getImageUrl(user.avatar)} alt="Profile" style={{ width: '6rem', height: '6rem', borderRadius: 'var(--ds-r-lg)', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)' }} />
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', background: 'var(--ds-badge-red, #ef4444)', color: '#fff', padding: '0.375rem', borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 20 }}
                    title="Delete Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <div style={{ width: '6rem', height: '6rem', borderRadius: 'var(--ds-r-lg)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.2)' }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" style={{ borderRadius: 'var(--ds-r-lg)' }}>
                <span className="text-white text-xs font-bold">{uploading ? '...' : 'Change'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#fff' }}>{user?.name}</h2>
              <span className="ds-badge ds-badge-primary" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>{roleLabel}</span>
              <p style={{ fontSize: 'var(--ds-text-xs)', opacity: 0.8, marginTop: '0.5rem' }}>Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title"><User size={16} /> Personal Information</h3>
          </div>
          <div className="ds-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              <div className="ds-form-group">
                <label className="ds-label">Full Name</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={14} style={{ color: 'var(--ds-text-muted)' }} /> {user?.name}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Email</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: 'var(--ds-text-muted)' }} /> {user?.email}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Phone</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="ds-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0 0.75rem' }}>
                    <Phone size={14} style={{ color: 'var(--ds-text-muted)' }} />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-body)' }}
                      placeholder="+94 7X XXX XXXX"
                    />
                  </div>
                  <button
                    onClick={handleSavePhone}
                    disabled={saving}
                    className="ds-btn ds-btn-primary"
                  >
                    <Save size={14} /> {saving ? '...' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Role</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={14} style={{ color: 'var(--ds-text-muted)' }} /> {roleLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Info */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title"><Building size={16} /> Employment Details</h3>
          </div>
          <div className="ds-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div className="ds-form-group">
                <label className="ds-label">Department</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.department || '—'}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Joined Date</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.joinDate ? new Date(user.employeeInfo.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">EPF Number</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.epfNo || '—'}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">ETF Number</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.etfNo || '—'}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Bank Name</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.bankName || '—'}
                </div>
              </div>
              <div className="ds-form-group">
                <label className="ds-label">Account Number</label>
                <div className="ds-input" style={{ background: 'var(--ds-border-soft)' }}>
                  {user?.employeeInfo?.bankAccount ? `****${user.employeeInfo.bankAccount.slice(-4)}` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="ds-modal-overlay">
          <div className="ds-modal">
            <div className="ds-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h3 className="ds-modal-title" style={{ textAlign: 'center', width: '100%' }}>Delete Profile Photo</h3>
            </div>
            <div className="ds-modal-body" style={{ textAlign: 'center' }}>
               <div style={{ width: '3rem', height: '3rem', background: 'var(--ds-badge-red, #fef2f2)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                 <Trash2 size={24} />
               </div>
               <p style={{ color: 'var(--ds-text-muted)' }}>Are you sure you want to permanently delete your profile photo?</p>
            </div>
            <div className="ds-modal-footer" style={{ justifyContent: 'center', borderTop: 'none' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="ds-btn ds-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleRemoveAvatar();
                }}
                className="ds-btn ds-btn-danger"
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
