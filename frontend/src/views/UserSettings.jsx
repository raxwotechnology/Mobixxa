'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Palette, Bell, CheckCircle, Save, Moon, Sun, Type, ALargeSmall, Bold, Search } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import useAuthStore from '../store/authStore';
import useThemeStore, { THEME_ACCENTS, FONT_OPTIONS, SPECTRUM_GRID } from '../store/themeStore';
import useCurrencyStore from '../store/currencyStore';
import { updateProfile } from '../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups } from './admin/adminNavItems';
import { managerNavGroups } from './storeOwner/managerNavItems';
import { getEmployeeNavGroups } from './employee/employeeNav';

const UserSettings = () => {
  const { user, login } = useAuthStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { 
    accent, 
    customColor, 
    mode, 
    fontFamily, 
    fontSize, 
    fontWeight, 
    notifications, 
    setAccent, 
    setCustomColor, 
    setMode, 
    setFontFamily, 
    setFontSize, 
    setFontWeight, 
    toggleNotificationPref, 
    applyThemeToDocument 
  } = useThemeStore();

  const [activeTab, setActiveTab] = useState('security'); // 'security', 'font', 'theme', 'profile', 'notifications'
  const [fontSearch, setFontSearch] = useState('');

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
    if (['cashier', 'deliveryGuy', 'stockEmployee'].includes(user?.role)) {
      return getEmployeeNavGroups(user.role);
    }
    return null;
  };

  const navGroups = getNavGroups();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const { data } = await updateProfile({ name, phone });
      login(data, data.token);
      toast.success('Profile details updated successfully!');
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
      toast.success('Password updated successfully!');
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
    toast.success(`Theme color changed to ${name}!`);
  };

  const handleSelectCustomColor = (hex) => {
    setCustomColor(hex);
    toast.success(`Custom theme color set to ${hex}!`);
  };

  const handleSelectFont = (fontKey, fontName) => {
    setFontFamily(fontKey);
    toast.success(`Font family updated to ${fontName}!`);
  };

  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
  const primaryColor = accent === 'custom' && customColor ? customColor : (themeConfig.primary || '#2563eb');

  const content = (
    <div className="ds-page">
      {/* Header */}
      <div className="ds-page-header">
        <div className="ds-page-header-left">
          <div 
            className="w-14 h-14 rounded-2xl p-[2px] shadow-lg flex-shrink-0 flex items-center justify-center font-bold text-xl text-white transition-all duration-300"
            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 25px -4px ${primaryColor}50` }}
          >
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="ds-card-title m-0 text-xl sm:text-2xl">{name || 'User Account'}</h1>
            <p className="text-xs font-normal text-slate-500 mt-0.5 m-0">
              {email} • <span className="uppercase font-bold" style={{ color: primaryColor }}>{user?.role || 'Customer'}</span>
            </p>
          </div>
        </div>

        <div className="ds-page-header-right">
          <span className="ds-badge ds-badge-slate">
             Light Theme
          </span>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="ds-card h-fit">
          <div className="ds-card-body space-y-1">
            {[
              { id: 'security', label: 'Security & Password', icon: Lock },
              { id: 'font', label: 'Font & Typography', icon: Type },
              { id: 'theme', label: 'Theme & Color Accent', icon: Palette },
              { id: 'profile', label: 'Profile Details', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={
                    active
                      ? {
                          backgroundColor: primaryColor,
                          color: '#ffffff',
                          boxShadow: `0 8px 20px -4px ${primaryColor}60`,
                        }
                      : {}
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    active ? 'text-white font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} style={!active ? { color: primaryColor } : { color: '#ffffff' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Main Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="ds-card">
              <div className="ds-card-header flex flex-col items-start gap-1">
                <h3 className="ds-card-title flex items-center gap-2 m-0">
                  <Lock className="text-amber-500" size={20} /> Security & Password Reset
                </h3>
                <p className="text-xs text-slate-500 m-0">Change your account password securely with real-time validation</p>
              </div>

              <div className="ds-card-body">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    <div className="ds-form-group">
                      <label className="ds-label">Current Login Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="ds-input"
                      />
                    </div>

                    <div className="ds-form-group">
                      <label className="ds-label">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="ds-input"
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
                          <span className="text-xs font-bold uppercase text-slate-400">
                            {newPassword.length > 8 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ds-form-group">
                      <label className="ds-label">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="ds-input"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -4px ${primaryColor}50`, color: '#fff' }}
                      className="ds-btn ds-btn-primary flex items-center gap-2"
                    >
                      <Save size={16} /> {updatingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: FONT & TYPOGRAPHY MANAGEMENT */}
          {activeTab === 'font' && (
            <div className="ds-card">
              <div className="ds-card-header flex flex-col items-start gap-1">
                <h3 className="ds-card-title flex items-center gap-2 m-0">
                  <Type className="text-indigo-600" size={22} /> Font & Typography Management
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Customize font family choices, global text sizing, and font weight boldness for your account
                </p>
              </div>

              <div className="ds-card-body space-y-6">
                {/* SECTION 1: FONT FAMILY SELECTION */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 m-0">Choose Font Family (Applies Across All Pages)</h4>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">Select a typography typeface for headings, product lists, and AI prediction cards</p>
                      </div>
                    </div>
                    <span className="ds-badge ds-badge-primary bg-indigo-50 text-indigo-600 border-0">
                      {Object.keys(FONT_OPTIONS).length} Font Choices
                    </span>
                  </div>

                  {/* Font Search Bar */}
                  <div className="ds-search">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      placeholder="Search 18+ font families (e.g. Poppins, Tech, Serif, Mono, Clean)..."
                      className="ds-input pl-10 pr-10"
                    />
                    {fontSearch && (
                      <button
                        type="button"
                        onClick={() => setFontSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer border-0 bg-transparent"
                        title="Clear search"
                      >
                        
                      </button>
                    )}
                  </div>

                  {/* Font Items Grid */}
                  {(() => {
                    const filteredFonts = Object.entries(FONT_OPTIONS).filter(([key, config]) => {
                      if (!fontSearch.trim()) return true;
                      const q = fontSearch.toLowerCase();
                      return (
                        config.name.toLowerCase().includes(q) ||
                        (config.category && config.category.toLowerCase().includes(q)) ||
                        key.toLowerCase().includes(q)
                      );
                    });

                    if (filteredFonts.length === 0) {
                      return (
                        <div className="ds-empty">
                          <Type size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600 m-0">No fonts found matching "{fontSearch}"</p>
                          <p className="text-xs text-slate-400 m-0 mt-1">Try searching for "Serif", "Sans", "Mono", or "Clean"</p>
                          <button
                            type="button"
                            onClick={() => setFontSearch('')}
                            className="mt-3 text-xs font-bold text-indigo-600 hover:underline border-0 bg-transparent cursor-pointer"
                          >
                            Clear Search Filter
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                        {filteredFonts.map(([key, config]) => {
                          const isSelected = (fontFamily || 'poppins') === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectFont(key, config.name)}
                              style={{ 
                                fontFamily: config.font,
                                ...(isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {})
                              }}
                              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer group ${
                                isSelected ? 'shadow-sm ring-1 ring-offset-1' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 m-0">{config.name}</p>
                                  {config.category && (
                                    <span className="ds-badge ds-badge-slate">
                                      {config.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 m-0 leading-relaxed" style={{ fontFamily: config.font }}>
                                  The quick brown fox jumps over the lazy dog. 12345
                                </p>
                              </div>
                              {isSelected && <CheckCircle size={20} style={{ color: primaryColor }} className="flex-shrink-0 ml-3" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* SECTION 2: FONT SIZE BALANCE & WEIGHT CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Font Size Scaling */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <ALargeSmall size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 m-0">Font Size Scale Balance</h4>
                        <p className="text-xs text-slate-500 m-0">Adjust display text scale ratio</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: 'compact', label: 'Compact', scale: '92%' },
                        { key: 'normal', label: 'Balanced (Default)', scale: '100%' },
                        { key: 'large', label: 'Large Clean', scale: '108%' },
                        { key: 'xlarge', label: 'Extra Large', scale: '116%' },
                      ].map((item) => {
                        const isSelected = (fontSize || 'normal') === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setFontSize(item.key);
                              toast.success(`Font size changed to ${item.label}!`);
                            }}
                            style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected ? 'font-bold shadow-xs ring-1' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <p className="text-xs font-bold m-0">{item.label}</p>
                            <span className="text-xs text-slate-400 font-mono">{item.scale}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Weight Boldness */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Bold size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 m-0">Font Weight & Boldness</h4>
                        <p className="text-xs text-slate-500 m-0">Select heading & UI text weight preference</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: 'normal', label: 'Regular (400)', weight: '400' },
                        { key: 'medium', label: 'Medium (500)', weight: '500' },
                        { key: 'semibold', label: 'SemiBold (600)', weight: '600' },
                        { key: 'bold', label: 'Bold (700)', weight: '700' },
                      ].map((item) => {
                        const isSelected = (fontWeight || 'normal') === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setFontWeight(item.key);
                              toast.success(`Font weight changed to ${item.label}!`);
                            }}
                            style={{
                              ...(isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}),
                              fontWeight: item.weight,
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected ? 'shadow-xs ring-1' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <p className="text-xs m-0">{item.label}</p>
                            <span className="text-xs text-slate-400 font-mono">w-{item.weight}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LIVE PREVIEW & AI PREDICTION DEMO BOX */}
                <div 
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 transition-all"
                  style={{
                    fontFamily: FONT_OPTIONS[fontFamily]?.font || FONT_OPTIONS.poppins.font,
                    fontSize: fontSize === 'compact' ? '0.9rem' : fontSize === 'large' ? '1.08rem' : fontSize === 'xlarge' ? '1.16rem' : '1rem',
                    fontWeight: fontWeight === 'medium' ? '500' : fontWeight === 'semibold' ? '600' : fontWeight === 'bold' ? '700' : '400',
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-100">
                    <span>Dynamic Real-Time Font Preview</span>
                    <span className="text-indigo-600 font-mono">
                      {FONT_OPTIONS[fontFamily]?.name || 'Poppins'} • {fontSize || 'normal'} • {fontWeight || 'normal'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: primaryColor }}>
                       AI Device Prediction Card
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 m-0">Apple iPhone 15 Pro Max (256GB - Natural Titanium)</h4>
                    <p className="text-xs text-slate-600 m-0 leading-relaxed">
                      Based on your recent browsing predictions and sales trends, this device matches 98% of your preferred specifications. Enjoy Super Retina XDR display with ProMotion.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer" style={{ backgroundColor: primaryColor }}>
                      Order Now • LKR 449,900.00
                    </span>
                    <span className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer">
                      Compare Specs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEME & COLOR ACCENT CUSTOMIZER */}
          {activeTab === 'theme' && (
            <div className="ds-card">
              <div className="ds-card-header flex flex-col items-start gap-1">
                <h3 className="ds-card-title flex items-center gap-2 m-0">
                  <Palette className="text-blue-600" size={22} /> Theme & Color Accent Customizer
                </h3>
                <p className="text-xs text-slate-500 m-0">Customize primary accent colors, spectrum hex palettes, display modes, and currency settings</p>
              </div>

              <div className="ds-card-body">
                <div className="space-y-6">
                  {/* SECTION 1: PREDEFINED ACCENT THEMES */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 m-0">Preset Accent Theme Colors (#Hex Codes)</h4>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">Select a primary color scheme for buttons, icons, highlights, and gradients</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(THEME_ACCENTS).map(([key, config]) => {
                      const isSelected = accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectAccent(key, config.name)}
                          style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
                          className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected ? 'shadow-sm ring-1 ring-offset-1' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${config.gradient} shadow-sm border border-black/10`} />
                            <div>
                              <p className="text-xs font-bold text-slate-900 m-0">{config.name}</p>
                              <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-500">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.primary }} />
                                <span>{config.primary}</span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.secondary }} />
                                <span>{config.secondary}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={20} style={{ color: primaryColor }} className="flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Full Spectrum Color Grid & Custom Color Picker */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Spectrum Color Palette Grid</label>
                        <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">Pick any exact shade or enter a custom #hex brand color</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                        <input
                          type="color"
                          value={customColor || '#2563eb'}
                          onChange={(e) => handleSelectCustomColor(e.target.value)}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                          title="Open custom color wheel"
                        />
                        <input
                          type="text"
                          value={customColor || '#2563eb'}
                          onChange={(e) => handleSelectCustomColor(e.target.value)}
                          placeholder="#2563eb"
                          className="w-20 font-mono text-xs font-bold text-slate-800 bg-transparent border-0 focus:outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Color Tiles Grid */}
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
                        {SPECTRUM_GRID.map((hex, idx) => {
                          const isSelected = accent === 'custom' && customColor?.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectCustomColor(hex)}
                              title={`Select ${hex}`}
                              style={{ backgroundColor: hex }}
                              className={`w-full aspect-square rounded-md transition-transform duration-150 hover:scale-125 cursor-pointer relative ${
                                isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-10' : 'hover:z-10'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-md"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Currency Preferences */}
                  <div className="pt-4 border-t border-slate-100">

                    {/* Currency Preference */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Currency Preference</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrency('LKR')}
                          className={`flex-1 p-3.5 rounded-2xl border text-center font-bold text-xs cursor-pointer ${
                            currency === 'LKR' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          LKR (Rupee)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('USD')}
                          className={`flex-1 p-3.5 rounded-2xl border text-center font-bold text-xs cursor-pointer ${
                            currency === 'USD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          USD (Dollar)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="ds-card">
              <div className="ds-card-header flex flex-col items-start gap-1">
                <h3 className="ds-card-title flex items-center gap-2 m-0">
                  <User className="text-emerald-500" size={20} /> Personal Profile Details
                </h3>
                <p className="text-xs text-slate-500 m-0">Update your display name and contact phone number</p>
              </div>

              <div className="ds-card-body">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    <div className="ds-form-group">
                      <label className="ds-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="ds-input"
                      />
                    </div>

                    <div className="ds-form-group">
                      <label className="ds-label">Contact Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+9477XXXXXXX"
                        className="ds-input"
                      />
                    </div>
                  </div>

                  <div className="ds-form-group max-w-lg">
                    <label className="ds-label">Email Address (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="ds-input opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -4px ${primaryColor}50`, color: '#fff' }}
                      className="ds-btn ds-btn-primary flex items-center gap-2"
                    >
                      <Save size={16} /> {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="ds-card">
              <div className="ds-card-header flex flex-col items-start gap-1">
                <h3 className="ds-card-title flex items-center gap-2 m-0">
                  <Bell className="text-rose-500" size={20} /> Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 m-0">Manage instant alerts for order updates, receipts, and system notifications</p>
              </div>

              <div className="ds-card-body">
                <div className="space-y-4 max-w-lg">
                  {[
                    { key: 'whatsappAlerts', title: 'WhatsApp Instant Invoices & Status', desc: 'Receive real-time WhatsApp messages for orders & receipts' },
                    { key: 'smsAlerts', title: 'SMS Notifications', desc: 'Receive instant SMS alerts for account & delivery updates' },
                    { key: 'emailInvoices', title: 'Email Official Tax Invoices', desc: 'Receive official PDF receipts via email automatically' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200">
                      <div>
                        <p className="text-xs font-bold text-slate-800 m-0">{item.title}</p>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">{item.desc}</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (navGroups) {
    return <DashboardLayout navItems={navGroups} activePath="/settings">{content}</DashboardLayout>;
  }

  return <div className="min-h-screen bg-slate-50/50 py-6">{content}</div>;
};

export default UserSettings;
