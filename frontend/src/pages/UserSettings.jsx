import { useState, useEffect } from 'react';
import { User, Lock, Palette, Bell, CheckCircle, Save, Moon, Sun } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import useAuthStore from '../store/authStore';
import useThemeStore, { THEME_ACCENTS } from '../store/themeStore';
import useCurrencyStore from '../store/currencyStore';
import { updateProfile } from '../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups } from './admin/adminNavItems';
import { managerNavGroups } from './storeOwner/managerNavItems';

const UserSettings = () => {
  const { user, login } = useAuthStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { accent, mode, notifications, setAccent, setMode, toggleNotificationPref, applyThemeToDocument } = useThemeStore();

  const [activeTab, setActiveTab] = useState('security'); // 'security', 'theme', 'profile', 'notifications'

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
    applyThemeToDocument();
  }, [user]);

  const getNavGroups = () => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'manager') return managerNavGroups;
    return null;
  };

  const navGroups = getNavGroups();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const { data } = await updateProfile({ name, phone });
      login(data, data.token);
      toast.success('Profile details updated successfully! 👤');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      await updateProfile({
        currentPassword,
        newPassword,
      });
      toast.success('Password updated successfully! 🔒');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSelectAccent = (key, name) => {
    setAccent(key);
    toast.success(`Theme color changed to ${name}! 🎨`);
  };

  const content = (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-lg flex-shrink-0 flex items-center justify-center font-black text-xl text-white">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{name || 'User Account'}</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {email} • <span className="uppercase font-black text-brand-indigo">{user?.role || 'Customer'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
          >
            {mode === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-600" />}
            {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-sm space-y-1 h-fit">
          {[
            { id: 'security', label: 'Security & Password', icon: Lock, color: 'text-amber-500' },
            { id: 'theme', label: 'Theme & Color Accent', icon: Palette, color: 'text-indigo-500' },
            { id: 'profile', label: 'Profile Details', icon: User, color: 'text-emerald-500' },
            { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-rose-500' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={active ? { backgroundColor: THEME_ACCENTS[accent]?.primary || '#6366f1', color: '#ffffff', boxShadow: `0 8px 20px -4px ${(THEME_ACCENTS[accent]?.primary || '#6366f1')}60` } : {}}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  active ? 'text-white font-black shadow-md' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : tab.color} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Main Panel */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          {/* TAB 1: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Lock className="text-amber-500" size={20} /> Security & Password Reset
                </h3>
                <p className="text-xs text-slate-500 mt-1">Change your account password securely with real-time validation</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold text-slate-700">Current Login Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            newPassword.length > 8 ? 'w-full bg-emerald-500' : newPassword.length >= 6 ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-rose-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">
                        {newPassword.length > 8 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> {updatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: THEME & COLOR ACCENT CUSTOMIZER */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Palette className="text-indigo-500" size={20} /> Personal Theme & Color Customizer
                </h3>
                <p className="text-xs text-slate-500 mt-1">Customize the primary accent colors and visual experience for your account</p>
              </div>

              {/* Color Accents Grid */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Choose Accent Theme Color</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(THEME_ACCENTS).map(([key, config]) => {
                    const isSelected = accent === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectAccent(key, config.name)}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${config.gradient} shadow-md`} />
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 m-0">{config.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 m-0">{config.primary}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={18} className="text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Layout Mode</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={`flex-1 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      mode === 'light' ? 'border-indigo-600 bg-indigo-50/50 font-black text-slate-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    ☀️ Light Clean Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={`flex-1 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      mode === 'dark' ? 'border-indigo-600 bg-slate-900 text-white font-black' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🌙 Dark Glass Mode
                  </button>
                </div>
              </div>

              {/* Currency Preference */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Currency Preference</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrency('LKR')}
                    className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      currency === 'LKR' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    LKR 🇱🇰 (Sri Lankan Rupee)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 p-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      currency === 'USD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    USD 🇺🇸 (US Dollar)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="text-emerald-500" size={20} /> Personal Profile Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">Update your display name and contact phone number</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+9477XXXXXXX"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full max-w-lg mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-semibold cursor-not-allowed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} /> {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bell className="text-rose-500" size={20} /> Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-1">Manage instant alerts for order updates, receipts, and system notifications</p>
              </div>

              <div className="space-y-4 max-w-lg">
                {[
                  { key: 'whatsappAlerts', title: 'WhatsApp Instant Invoices & Status', desc: 'Receive real-time WhatsApp messages for orders & receipts' },
                  { key: 'smsAlerts', title: 'SMS Notifications', desc: 'Receive instant SMS alerts for account & delivery updates' },
                  { key: 'emailInvoices', title: 'Email Official Tax Invoices', desc: 'Receive official PDF receipts via email automatically' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200">
                    <div>
                      <p className="text-xs font-black text-slate-800 m-0">{item.title}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => toggleNotificationPref(item.key)}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (navGroups) {
    return <DashboardLayout navGroups={navGroups} activePath="/settings">{content}</DashboardLayout>;
  }

  return <div className="min-h-screen bg-slate-50/50 py-6">{content}</div>;
};

export default UserSettings;
