import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Upload, Globe, Phone, Mail, MapPin, Palette, DollarSign, Gift, Shield, Store, UserCog, FileText, ClipboardCheck, MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getSettings, updateSettings, uploadLogo, uploadImage } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import useSettingsStore from '../../store/settingsStore';
import { getImageUrl } from '../../utils/imageHelper';

const SettingsInputField = ({ label, value, onChange, type = 'text', placeholder = '', suffix = '' }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
        placeholder={placeholder}
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-slate-400">{suffix}</span>}
    </div>
  </div>
);

const SettingsTextArea = ({ label, value, onChange, placeholder = '', rows = 3 }) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
      placeholder={placeholder}
    />
  </div>
);

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');
  const fileRef = useRef(null);
  const sealFileRef = useRef(null);
  const setSettingsLocal = useSettingsStore((s) => s.setSettingsLocal);

  const [defaultPrinter, setDefaultPrinter] = useState(() => localStorage.getItem('default_printer') || '');

  const handlePrinterChange = (val) => {
    setDefaultPrinter(val);
    localStorage.setItem('default_printer', val);
  };

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await getSettings();
      setSettings(data);
      setSettingsLocal(data);
    } catch (err) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field, value) => {
    setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
  };

  const handleTemplateChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      documentTemplates: {
        ...prev.documentTemplates,
        [section]: {
          ...(prev.documentTemplates?.[section] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleTemplateFieldToggle = (section, field) => {
    setSettings(prev => {
      const current = prev.documentTemplates?.[section]?.fields?.[field] !== false;
      return {
        ...prev,
        documentTemplates: {
          ...prev.documentTemplates,
          [section]: {
            ...(prev.documentTemplates?.[section] || {}),
            fields: {
              ...(prev.documentTemplates?.[section]?.fields || {}),
              [field]: !current,
            },
          },
        },
      };
    });
  };

  const handleSmsTemplateChange = (field, value) => {
    setSettings(prev => ({ ...prev, smsTemplates: { ...prev.smsTemplates, [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateSettings(settings);
      setSettings(data);
      setSettingsLocal(data);
      toast.success('Settings saved successfully!');
    } catch (err) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset file input so same file can be re-uploaded
    e.target.value = '';
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await uploadLogo(formData);
      // Backend returns relative path like /uploads/logo-xxx.png
      const logoPath = data.logoUrl || data.logo;
      const merged = { ...settings, logoUrl: logoPath, logo: logoPath };
      setSettings(merged);
      // Force-update the global store so DashboardLayout & Navbar reflect instantly
      setSettingsLocal(merged);
      toast.success('Logo uploaded successfully! ✅');
    } catch (err) {
      toast.error('Failed to upload logo: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSealUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadImage(formData);
      const sealPath = data.url;
      const merged = { ...settings, sealUrl: sealPath, seal: sealPath };
      setSettings(merged);
      setSettingsLocal(merged);
      toast.success('Seal uploaded successfully! ✅');
    } catch (err) {
      toast.error('Failed to upload seal: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Mobixa Admin Panel"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'commerce', label: 'Commerce', icon: DollarSign },
    { key: 'loyalty', label: 'Loyalty', icon: Gift },
    { key: 'receipt', label: 'Receipt/A4 Designer', icon: FileText },
    { key: 'templates', label: 'Templates', icon: ClipboardCheck },
    { key: 'permissions', label: 'Permissions', icon: UserCog },
    { key: 'social', label: 'Social', icon: Palette },
    { key: 'advanced', label: 'Advanced', icon: Shield },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div>
        <div className="flex items-center justify-between mb-8 bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Settings size={20} strokeWidth={2.5} />
              </div>
              Brand Settings
            </h1>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mt-2">Manage your tech and smart devices storefront configuration</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/40 p-2 rounded-2xl border border-white/50 w-fit backdrop-blur-md">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${tab === t.key ? 'bg-white text-brand-indigo shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}>
              <t.icon size={14} strokeWidth={2.5} /> {t.label}
            </button>
          ))}
        </div>

        {/* General */}
        {tab === 'general' && (
          <div className="space-y-6">
            {/* Logo */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">Shop Branding</h2>
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                  <img
                    src={getImageUrl(settings.logoUrl || settings.logo) || '/logo.png'}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 bg-brand-indigo hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md">
                    <Upload size={14} strokeWidth={2.5} /> Upload Logo
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">PNG, JPG, or SVG. Max 2MB.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <SettingsInputField label="Shop Name" value={settings.shopName} onChange={(v) => handleChange('shopName', v)} placeholder="Mobixa" />
                <SettingsInputField label="Tagline" value={settings.tagline} onChange={(v) => handleChange('tagline', v)} placeholder="Where style meets accessories" />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">Footer</h2>
              <SettingsInputField label="Footer Text" value={settings.footerText} onChange={(v) => handleChange('footerText', v)} placeholder="© 2026 Raxwo (Pvt) LTD. All rights reserved." />
            </div>

            {/* Hero Products */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">🏠 Landing Page Hero Products</h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-6">These appear as floating badges on the homepage hero section.</p>
              {[0, 1].map((idx) => {
                const products = settings.heroProducts || [];
                const prod = products[idx] || { name: '', price: '', emoji: '' };
                const updateHeroProduct = (field, value) => {
                  const updated = [...(settings.heroProducts || [{ name: '', price: '', emoji: '' }, { name: '', price: '', emoji: '' }])];
                  if (!updated[idx]) updated[idx] = { name: '', price: '', emoji: '' };
                  updated[idx] = { ...updated[idx], [field]: value };
                  handleChange('heroProducts', updated);
                };
                return (
                  <div key={idx} className="mb-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black uppercase tracking-wider text-brand-indigo mb-4">Product Badge {idx + 1}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <SettingsInputField label="Name" value={prod.name} onChange={(v) => updateHeroProduct('name', v)} placeholder={idx === 0 ? 'Luxe Tote Bag' : 'Radiance Serum'} />
                      <SettingsInputField label="Price (LKR)" value={prod.price} onChange={(v) => updateHeroProduct('price', v)} type="number" placeholder="9500" />
                      <SettingsInputField label="Emoji" value={prod.emoji} onChange={(v) => updateHeroProduct('emoji', v)} placeholder={idx === 0 ? '👜' : '✨'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        {tab === 'contact' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Phone size={16} strokeWidth={2.5} />
              </div>
              Contact Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <SettingsInputField label="Email" value={settings.email} onChange={(v) => handleChange('email', v)} placeholder="hello@mobilehub.com" />
              <SettingsInputField label="Primary Phone" value={settings.phone} onChange={(v) => handleChange('phone', v)} placeholder="+94 11 255 5000" />
              <SettingsInputField label="Secondary Phone" value={settings.phone2} onChange={(v) => handleChange('phone2', v)} placeholder="Optional" />
              <SettingsInputField label="Country" value={settings.country} onChange={(v) => handleChange('country', v)} placeholder="Sri Lanka" />
              <SettingsInputField label="City" value={settings.city} onChange={(v) => handleChange('city', v)} placeholder="Colombo" />
              <div className="sm:col-span-2">
                <SettingsInputField label="Full Address" value={settings.address} onChange={(v) => handleChange('address', v)} placeholder="88 Tech Avenue, Colombo 03" />
              </div>
            </div>
          </div>
        )}

        {/* Commerce */}
        {tab === 'commerce' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <DollarSign size={16} strokeWidth={2.5} />
                </div>
                Currency & Pricing
              </h2>
              <div className="grid sm:grid-cols-3 gap-6">
                <SettingsInputField label="Default Currency" value={settings.currency} onChange={(v) => handleChange('currency', v)} />
                <SettingsInputField label="USD → LKR Rate" value={settings.exchangeRate} onChange={(v) => handleChange('exchangeRate', v)} type="number" suffix="LKR/USD" />
                <SettingsInputField label="Tax Rate" value={settings.taxRate} onChange={(v) => handleChange('taxRate', v)} type="number" suffix="e.g. 0.08" />
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  🚚
                </div>
                Delivery
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <SettingsInputField label="Free Delivery Threshold" value={settings.deliveryFeeThreshold} onChange={(v) => handleChange('deliveryFeeThreshold', v)} type="number" suffix="Rs." />
                <SettingsInputField label="Delivery Fee" value={settings.deliveryFee} onChange={(v) => handleChange('deliveryFee', v)} type="number" suffix="Rs." />
              </div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">Orders above the threshold get free delivery. Otherwise delivery fee is charged.</p>
            </div>
          </div>
        )}

        {/* Loyalty */}
        {tab === 'loyalty' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Gift size={16} strokeWidth={2.5} />
              </div>
              Loyalty Points Configuration
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <SettingsInputField label="Points Per Unit Spent" value={settings.loyaltyPointsPerUnit} onChange={(v) => handleChange('loyaltyPointsPerUnit', v)} type="number" suffix="Rs. / pt" />
              <SettingsInputField label="Point Redemption Value" value={settings.loyaltyPointValue} onChange={(v) => handleChange('loyaltyPointValue', v)} type="number" suffix="Rs. / pt" />
            </div>
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-2">How it works:</p>
              <p className="text-xs font-bold text-emerald-700">Customer earns 1 point for every Rs. {settings.loyaltyPointsPerUnit} spent.</p>
              <p className="text-xs font-bold text-emerald-700 mt-1">Each point is worth Rs. {settings.loyaltyPointValue} when redeemed.</p>
            </div>
          </div>
        )}

        {/* Receipt Settings */}
        {tab === 'receipt' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Settings Panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                    <FileText size={16} strokeWidth={2.5} />
                  </div>
                  Receipt / Invoice Designer
                </h2>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-6">Customize design templates, fonts, branding details, and legal text.</p>

                <div className="space-y-6">
                  {/* Template Style */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Layout Style Template</label>
                    <select
                      value={settings.receiptSettings?.layoutStyle || 'receipt'}
                      onChange={(e) => handleChange('receiptSettings', { ...settings.receiptSettings, layoutStyle: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer"
                    >
                      <option value="receipt">80mm Thermal Receipt (POS)</option>
                      <option value="a4">A4 Professional Invoice (Billing)</option>
                    </select>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Brand Theme Accent Color</label>
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={settings.receiptSettings?.themeColor || '#6366f1'}
                          onChange={(e) => handleChange('receiptSettings', { ...settings.receiptSettings, themeColor: e.target.value })}
                          className="w-12 h-12 rounded-xl cursor-pointer opacity-0 absolute inset-0 w-full h-full"
                        />
                        <div className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: settings.receiptSettings?.themeColor || '#6366f1' }}></div>
                      </div>
                      <input
                        type="text"
                        value={settings.receiptSettings?.themeColor || '#6366f1'}
                        onChange={(e) => handleChange('receiptSettings', { ...settings.receiptSettings, themeColor: e.target.value })}
                        placeholder="#6366f1"
                        className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Header Title */}
                  <SettingsInputField
                    label="Header Logo / Title Text"
                    value={settings.receiptSettings?.headerTitle || settings.shopName}
                    onChange={(v) => handleChange('receiptSettings', { ...settings.receiptSettings, headerTitle: v })}
                    placeholder="e.g. Mobixa Corner"
                  />

                  {/* Subtitle / Branch details */}
                  <SettingsInputField
                    label="Header Subtitle / Contact Info"
                    value={settings.receiptSettings?.subtitle || settings.address}
                    onChange={(v) => handleChange('receiptSettings', { ...settings.receiptSettings, subtitle: v })}
                    placeholder="e.g. 88 Tech Avenue, Colombo 03"
                  />

                  {/* Official Store Seal Upload */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-4">Official Store Seal Image</label>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                        {(settings.sealUrl || settings.seal) ? (
                          <img src={getImageUrl(settings.sealUrl || settings.seal)} alt="Store Seal" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">No Seal</span>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => sealFileRef.current?.click()}
                          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm border border-slate-200"
                        >
                          <Upload size={14} strokeWidth={2.5} /> Upload Seal
                        </button>
                        <input
                          ref={sealFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSealUpload}
                          className="hidden"
                        />
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Rendered on official POS bills.</p>
                      </div>
                    </div>
                  </div>

                  {/* Letterhead Header Textarea */}
                  <SettingsTextArea
                    label="Letterhead Header Text (A4 Invoice)"
                    value={settings.letterheadHeader}
                    onChange={(v) => handleChange('letterheadHeader', v)}
                    placeholder="e.g. MOBIXA (PVT) LTD\nNo. 12, Galle Road, Colombo\nReg: PV-12345"
                  />

                  {/* Letterhead Footer Textarea */}
                  <SettingsTextArea
                    label="Letterhead Footer Text (A4 Invoice)"
                    value={settings.letterheadFooter}
                    onChange={(v) => handleChange('letterheadFooter', v)}
                    placeholder="e.g. Thank you for shopping with us!\nContact: info@smartmobile.lk | Web: smartmobile.lk"
                  />

                  {/* Default Printer Selection */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Default Local Printer Assignment</label>
                    <select
                      value={defaultPrinter}
                      onChange={(e) => handlePrinterChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer"
                    >
                      <option value="">-- No Default (Prompt System Dialogue) --</option>
                      <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                      <option value="XP-80 Thermal Printer">XP-80 Thermal Printer (80mm)</option>
                      <option value="Canon LBP2900">Canon LBP2900 (A4 Laser)</option>
                      <option value="Epson L3110">Epson L3110 Series</option>
                    </select>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">Current assignment saved in LocalStorage.</p>
                  </div>

                  {/* Footer Message */}
                  <SettingsInputField
                    label="Footer Greeting Message"
                    value={settings.receiptSettings?.footerMessage || 'Thank you for your purchase!'}
                    onChange={(v) => handleChange('receiptSettings', { ...settings.receiptSettings, footerMessage: v })}
                    placeholder="e.g. Thank you! Visit us again."
                  />

                  {/* Warranty Terms */}
                  <SettingsTextArea
                    label="Warranty & Serial Disclaimers"
                    value={settings.receiptSettings?.warrantyTerms}
                    onChange={(v) => handleChange('receiptSettings', { ...settings.receiptSettings, warrantyTerms: v })}
                    placeholder="Standard manufacturer warranty applies..."
                  />

                  {/* Terms & Conditions */}
                  <SettingsTextArea
                    label="Return / Exchange Policy Statement"
                    value={settings.receiptSettings?.termsAndConditions}
                    onChange={(v) => handleChange('receiptSettings', { ...settings.receiptSettings, termsAndConditions: v })}
                    placeholder="Goods sold are not returnable..."
                  />

                  {/* Show Warranty Toggle */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-900">Show Warranty Periods</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Print the warranty details next to each line item</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('receiptSettings', { ...settings.receiptSettings, showWarranty: !settings.receiptSettings?.showWarranty })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.receiptSettings?.showWarranty !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.receiptSettings?.showWarranty !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Live Preview Side Panel */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-start items-center sticky top-6 shadow-sm backdrop-blur-sm" style={{ minHeight: '500px' }}>
              <h3 className="text-sm font-black text-slate-900 mb-1 self-start flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">📄</span>
                Document Live Preview
              </h3>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-6 self-start">Visual representation of the printed template</p>

              {/* Thermal Receipt Preview */}
              {(settings.receiptSettings?.layoutStyle || 'receipt') === 'receipt' ? (
                <div className="w-[300px] bg-white border border-slate-300 shadow-xl p-5 font-mono text-[11px] text-slate-900 relative overflow-hidden rounded-md" style={{ minHeight: '400px', borderStyle: 'dashed' }}>
                  <div className="text-center mb-4">
                    {(settings.logoUrl || settings.logo) && (
                      <img src={getImageUrl(settings.logoUrl || settings.logo)} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 opacity-80" />
                    )}
                    <h4 className="font-bold text-sm uppercase text-slate-800">{settings.receiptSettings?.headerTitle || settings.shopName}</h4>
                    <p className="text-[10px] text-slate-600">{settings.receiptSettings?.subtitle || settings.address}</p>
                    <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  <div className="space-y-1 text-slate-700">
                    <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    <p>Invoice: #INV-28491029</p>
                    <p>Cashier: {settings.shopName} Staff</p>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  <table className="w-full text-left font-mono text-[11px] text-slate-800">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="pb-1">Item</th>
                        <th className="text-center pb-1">Qty</th>
                        <th className="text-right pb-1">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">
                          <p className="font-bold">iPhone 15 Pro Max (256GB)</p>
                          <p className="text-[9px] text-slate-500">IMEI: 359182930491823</p>
                          {settings.receiptSettings?.showWarranty !== false && (
                            <p className="text-[9px] text-brand-indigo font-sans font-semibold">Warranty: 12 Months</p>
                          )}
                        </td>
                        <td className="text-center py-2">1</td>
                        <td className="text-right py-2 font-semibold">Rs. 320,000</td>
                      </tr>
                      <tr>
                        <td className="py-2">
                          <p className="font-bold">Anker Nano USB-C Charger</p>
                          {settings.receiptSettings?.showWarranty !== false && (
                            <p className="text-[9px] text-brand-indigo font-sans font-semibold">Warranty: 6 Months</p>
                          )}
                        </td>
                        <td className="text-center py-2">1</td>
                        <td className="text-right py-2 font-semibold">Rs. 8,500</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  <div className="space-y-1 text-right text-slate-700">
                    <p>Subtotal: Rs. 328,500</p>
                    <p>VAT (8%): Rs. 26,280</p>
                    <p className="font-bold text-xs text-slate-900 mt-1">Grand Total: Rs. 354,780</p>
                  </div>

                  <div className="border-b border-dashed border-slate-300 my-2" />

                  <div className="text-center space-y-2 text-[10px] mt-4 font-sans text-slate-600">
                    <p className="font-bold text-slate-800">{settings.receiptSettings?.footerMessage || 'Thank you for your purchase!'}</p>
                    <p className="italic text-[9px]">{settings.receiptSettings?.termsAndConditions}</p>
                    <p className="italic text-[9px]">{settings.receiptSettings?.warrantyTerms}</p>
                    {(settings.sealUrl || settings.seal) && (
                      <div className="flex justify-center mt-2">
                        <img src={getImageUrl(settings.sealUrl || settings.seal)} alt="Store Seal" className="w-12 h-12 object-contain opacity-70 grayscale" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* A4 Invoice Preview */
                <div className="w-[380px] bg-white border border-slate-200 shadow-xl p-6 font-sans text-[10px] text-slate-900 relative overflow-hidden rounded-lg" style={{ minHeight: '480px' }}>
                  {/* Top Color Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: settings.receiptSettings?.themeColor || '#3b82f6' }} />

                  <div className="flex justify-between items-start mb-6 mt-2">
                    <div>
                      {(settings.logoUrl || settings.logo) && (
                        <img src={getImageUrl(settings.logoUrl || settings.logo)} alt="Logo" className="w-14 h-14 object-contain mb-2 opacity-95" />
                      )}
                      {settings.letterheadHeader ? (
                        <pre className="font-sans text-[10px] leading-relaxed text-slate-900 whitespace-pre-line">
                          {settings.letterheadHeader}
                        </pre>
                      ) : (
                        <>
                          <h4 className="font-black text-sm uppercase text-slate-900" style={{ color: settings.receiptSettings?.themeColor || '#4f46e5' }}>
                            {settings.receiptSettings?.headerTitle || settings.shopName}
                          </h4>
                          <p className="text-slate-500">{settings.receiptSettings?.subtitle || settings.address}</p>
                          <p className="text-slate-500">Email: {settings.email} | Tel: {settings.phone}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Invoice</h3>
                      <p className="font-bold text-slate-800 mt-1">#INV-28491029</p>
                      <p className="text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 my-4" />

                  {/* Customer / Billed To Section */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-black text-slate-400 uppercase text-[8px] tracking-wider mb-1">Billed To:</p>
                      <p className="font-bold text-slate-800">John Doe</p>
                      <p className="text-slate-500">+94 77 123 4567</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-400 uppercase text-[8px] tracking-wider mb-1">Payment Details:</p>
                      <p className="font-bold text-slate-800">Split Payment Method</p>
                      <p className="text-slate-500">Cash / Card</p>
                    </div>
                  </div>

                  {/* Products Table */}
                  <table className="w-full text-left text-[9px] mb-6 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[8px]">
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2">
                          <p className="font-bold text-slate-800">iPhone 15 Pro Max (256GB)</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">IMEI: 359182930491823</p>
                          {settings.receiptSettings?.showWarranty !== false && (
                            <p className="text-[8px] text-brand-indigo font-bold mt-0.5">Warranty: 12 Months</p>
                          )}
                        </td>
                        <td className="text-center py-2 font-semibold">1</td>
                        <td className="text-right py-2 text-slate-600">Rs. 320,000</td>
                        <td className="text-right py-2 font-bold text-slate-800">Rs. 320,000</td>
                      </tr>
                      <tr>
                        <td className="py-2">
                          <p className="font-bold text-slate-800">Anker Nano USB-C Charger</p>
                          {settings.receiptSettings?.showWarranty !== false && (
                            <p className="text-[8px] text-brand-indigo font-bold mt-0.5">Warranty: 6 Months</p>
                          )}
                        </td>
                        <td className="text-center py-2 font-semibold">1</td>
                        <td className="text-right py-2 text-slate-600">Rs. 8,500</td>
                        <td className="text-right py-2 font-bold text-slate-800">Rs. 8,500</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals Section */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-1/2 text-[8px] text-muted-text space-y-1">
                      <p className="font-bold uppercase tracking-wider text-dark-navy">Taxes & Disclaimers</p>
                      <p className="italic">{settings.receiptSettings?.warrantyTerms}</p>
                      <p className="italic">{settings.receiptSettings?.termsAndConditions}</p>
                    </div>
                    <div className="w-1/2 text-right space-y-1.5 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-text">Subtotal:</span>
                        <span className="font-semibold">Rs. 328,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-text">Taxes (8%):</span>
                        <span className="font-semibold">Rs. 26,280</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-bold" style={{ color: settings.receiptSettings?.themeColor || '#3b82f6' }}>
                        <span>Total:</span>
                        <span>Rs. 354,780</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-6 pt-3 border-t border-gray-100">
                    <div className="w-2/3 text-[9px] text-muted-text">
                      {settings.letterheadFooter ? (
                        <pre className="font-sans text-[9px] leading-relaxed whitespace-pre-line text-left">
                          {settings.letterheadFooter}
                        </pre>
                      ) : (
                        <p>{settings.receiptSettings?.footerMessage || 'Thank you for your purchase!'}</p>
                      )}
                    </div>
                    <div className="w-1/3 flex justify-end">
                      {(settings.sealUrl || settings.seal) && (
                        <div className="relative">
                          <img src={getImageUrl(settings.sealUrl || settings.seal)} alt="Store Seal" className="w-14 h-14 object-contain opacity-75" />
                          <span className="absolute bottom-0 right-0 text-[8px] text-gray-400 font-sans">Official Seal</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Templates */}
        {tab === 'templates' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                { key: 'paysheet', label: 'Paysheets', layouts: ['standard', 'compact'] },
                { key: 'invoice', label: 'Invoices / Bills', layouts: ['a4', 'compact'] },
                { key: 'posReceipt', label: 'POS Receipts', layouts: ['thermal', 'compact'] },
              ].map((tpl) => {
                const data = settings.documentTemplates?.[tpl.key] || {};
                return (
                  <div key={tpl.key} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
                    <h2 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                      <FileText size={16} className="text-brand-indigo" strokeWidth={2.5} /> {tpl.label}
                    </h2>
                    <div className="space-y-4">
                      <SettingsInputField label="Document Title" value={data.title} onChange={(v) => handleTemplateChange(tpl.key, 'title', v)} />
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">Layout</label>
                        <select value={data.layout || tpl.layouts[0]} onChange={(e) => handleTemplateChange(tpl.key, 'layout', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 shadow-sm cursor-pointer">
                          {tpl.layouts.map((layout) => <option key={layout} value={layout}>{layout}</option>)}
                        </select>
                      </div>
                      <SettingsInputField label="Accent Color" value={data.accentColor} onChange={(v) => handleTemplateChange(tpl.key, 'accentColor', v)} placeholder="#4f46e5" />
                      <SettingsTextArea label="Footer Text" value={data.footerText} onChange={(v) => handleTemplateChange(tpl.key, 'footerText', v)} rows={2} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <ClipboardCheck size={16} strokeWidth={2.5} />
                </div>
                Paysheet Content Options
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['showEmployeeRole', 'Employee Role'],
                  ['showStore', 'Store'],
                  ['showProcessedBy', 'Processed By'],
                  ['showEmployerContributions', 'Employer EPF/ETF'],
                ].map(([field, label]) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => handleTemplateFieldToggle('paysheet', field)}
                    className={`px-5 py-4 rounded-2xl border text-sm font-bold text-left transition-all ${settings.documentTemplates?.paysheet?.fields?.[field] !== false ? 'bg-brand-indigo/5 border-brand-indigo/20 text-brand-indigo shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {settings.documentTemplates?.paysheet?.fields?.[field] !== false ? 'Show' : 'Hide'} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <MessageSquare size={16} strokeWidth={2.5} />
                </div>
                SMS Templates
              </h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-6">Use placeholders like {'{shopName}'}, {'{code}'}, {'{invoiceNo}'}, {'{total}'}, {'{orderNo}'}, and {'{status}'}.</p>
              <div className="grid lg:grid-cols-2 gap-6">
                <SettingsTextArea label="OTP Message" value={settings.smsTemplates?.otp} onChange={(v) => handleSmsTemplateChange('otp', v)} rows={2} />
                <SettingsTextArea label="Payment Message" value={settings.smsTemplates?.payment} onChange={(v) => handleSmsTemplateChange('payment', v)} rows={2} />
                <SettingsTextArea label="POS Receipt Message" value={settings.smsTemplates?.posReceipt} onChange={(v) => handleSmsTemplateChange('posReceipt', v)} rows={2} />
                <SettingsTextArea label="Order Status Message" value={settings.smsTemplates?.orderStatus} onChange={(v) => handleSmsTemplateChange('orderStatus', v)} rows={2} />
              </div>
            </div>
          </div>
        )}
        {/* Permissions */}
        {tab === 'permissions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <UserCog size={16} strokeWidth={2.5} />
                </div>
                Role Permissions
              </h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-8">Control feature access for each role. Changes take effect immediately after saving.</p>

              {/* Cashier Permissions */}
              <div className="mb-8">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm">C</span>
                  Cashier Permissions
                </h3>
                <div className="space-y-4 pl-11">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Barcode Generation</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow cashiers to generate and print barcodes</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      cashier: { ...settings.rolePermissions?.cashier, canGenerateBarcodes: !settings.rolePermissions?.cashier?.canGenerateBarcodes }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.cashier?.canGenerateBarcodes !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.cashier?.canGenerateBarcodes !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Return Access</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow cashiers to process customer returns</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      cashier: { ...settings.rolePermissions?.cashier, canAccessReturns: !settings.rolePermissions?.cashier?.canAccessReturns }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.cashier?.canAccessReturns ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.cashier?.canAccessReturns ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">View Inventory</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow cashiers to view stock levels</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      cashier: { ...settings.rolePermissions?.cashier, canViewInventory: !settings.rolePermissions?.cashier?.canViewInventory }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.cashier?.canViewInventory ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.cashier?.canViewInventory ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Apply Discounts</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow cashiers to apply manual discounts at POS</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      cashier: { ...settings.rolePermissions?.cashier, canApplyDiscounts: !(settings.rolePermissions?.cashier?.canApplyDiscounts !== false) }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.cashier?.canApplyDiscounts !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.cashier?.canApplyDiscounts !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Sales Reports</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow cashiers to view sales reports</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      cashier: { ...settings.rolePermissions?.cashier, canViewSalesReports: !settings.rolePermissions?.cashier?.canViewSalesReports }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.cashier?.canViewSalesReports ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.cashier?.canViewSalesReports ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Manager Permissions */}
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm">M</span>
                  Manager Permissions
                </h3>
                <div className="space-y-4 pl-11">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Barcode Generation</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to generate and print barcodes</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canGenerateBarcodes: !settings.rolePermissions?.manager?.canGenerateBarcodes }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canGenerateBarcodes !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canGenerateBarcodes !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Return Access</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to process customer returns</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canAccessReturns: !settings.rolePermissions?.manager?.canAccessReturns }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canAccessReturns !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canAccessReturns !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Payroll Management</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to process salary payments</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canManagePayroll: !(settings.rolePermissions?.manager?.canManagePayroll !== false) }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canManagePayroll !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canManagePayroll !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Supplier Payments</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to manage supplier payment ledger</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canManageSupplierPayments: !(settings.rolePermissions?.manager?.canManageSupplierPayments !== false) }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canManageSupplierPayments !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canManageSupplierPayments !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">AI Predictions</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to view AI sales forecasts</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canViewPredictions: !settings.rolePermissions?.manager?.canViewPredictions }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canViewPredictions ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canViewPredictions ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Promotions</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">Allow managers to create and manage promotions</p>
                    </div>
                    <button onClick={() => handleChange('rolePermissions', {
                      ...settings.rolePermissions,
                      manager: { ...settings.rolePermissions?.manager, canManagePromotions: !(settings.rolePermissions?.manager?.canManagePromotions !== false) }
                    })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.rolePermissions?.manager?.canManagePromotions !== false ? 'bg-brand-indigo' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[4px] transition-all shadow-sm ${settings.rolePermissions?.manager?.canManagePromotions !== false ? 'right-[4px]' : 'left-[4px]'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex gap-4 items-start">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1">Note:</p>
                <p className="text-xs font-bold text-blue-900">Admin always has full access to all features. Permission changes apply to Cashier and Manager roles only.</p>
                <p className="text-xs font-bold text-blue-900 mt-1">Remember to click <strong>Save Changes</strong> after modifying permissions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Social */}
        {tab === 'social' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
            <h2 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <Palette size={16} strokeWidth={2.5} />
              </div>
              Social Media Links
            </h2>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-6">Configure the social media account links displayed in the website footer.</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <SettingsInputField label="Facebook Page URL" value={settings.socialLinks?.facebook} onChange={(v) => handleSocialChange('facebook', v)} placeholder="https://facebook.com/yourshop" />
              <SettingsInputField label="TikTok Account URL" value={settings.socialLinks?.tiktok} onChange={(v) => handleSocialChange('tiktok', v)} placeholder="https://tiktok.com/@yourshop" />
              <SettingsInputField label="Instagram Profile URL" value={settings.socialLinks?.instagram} onChange={(v) => handleSocialChange('instagram', v)} placeholder="https://instagram.com/yourshop" />
              <SettingsInputField label="YouTube Channel URL" value={settings.socialLinks?.youtube} onChange={(v) => handleSocialChange('youtube', v)} placeholder="https://youtube.com/@yourshop" />
            </div>
          </div>
        )}

        {/* Advanced */}
        {tab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 rounded-bl-[100px] pointer-events-none -z-10"></div>
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <Shield size={16} strokeWidth={2.5} />
                </div>
                Maintenance Mode
              </h2>
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Enable Maintenance Mode</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">When enabled, customers will see a maintenance page</p>
                </div>
                <button onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              {settings.maintenanceMode && (
                <div className="mt-4 bg-red-50/80 rounded-2xl p-4 text-[11px] font-bold text-red-600 border border-red-100 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">⚠️</span> Maintenance mode is ON. Customers cannot access the site.
                </div>
              )}
            </div>

            {/* Config Summary */}
            <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-6 backdrop-blur-sm">
              <h2 className="text-sm font-black text-slate-900 mb-4">Current Configuration</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {[
                  { l: 'Currency', v: settings.currency },
                  { l: 'Exchange Rate', v: `1 USD = ${settings.exchangeRate} LKR` },
                  { l: 'Tax Rate', v: `${(settings.taxRate * 100).toFixed(0)}%` },
                  { l: 'Delivery Fee', v: `Rs. ${settings.deliveryFee}` },
                  { l: 'Free Delivery Above', v: `Rs. ${settings.deliveryFeeThreshold}` },
                  { l: 'Points per Rs.', v: `${settings.loyaltyPointsPerUnit}` },
                  { l: 'Point Value', v: `Rs. ${settings.loyaltyPointValue}` },
                  { l: 'Maintenance', v: settings.maintenanceMode ? '🔴 ON' : '🟢 OFF' },
                ].map(c => (
                  <div key={c.l} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{c.l}</p>
                    <p className="font-bold text-slate-900 mt-2">{c.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
