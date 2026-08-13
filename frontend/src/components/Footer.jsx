import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import useAuthStore from '../store/authStore';
import { getImageUrl } from '../utils/imageHelper';

const FacebookIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TiktokIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2.896-2.896c.24 0 .473.03.696.084V9.334a6.34 6.34 0 0 0-.696-.039 6.341 6.341 0 1 0 6.341 6.341V8.657a8.21 8.21 0 0 0 4.77 1.518V6.73a4.811 4.811 0 0 1-1.000-.044z"/>
  </svg>
);

const InstagramIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const Footer = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandLogoUrl = getImageUrl(settings?.logoUrl || settings?.logo) || '/logo.png';
  const brandEmail = settings?.email || 'support@mobixa.com';
  const brandPhone = settings?.phone || '+94 11 255 5000';
  const brandAddress = settings?.address || '88 Tech Avenue, Colombo 03';

  const socialButtons = [
    { name: 'Facebook', icon: FacebookIcon, url: settings?.socialLinks?.facebook, hoverBg: 'hover:bg-blue-600' },
    { name: 'TikTok', icon: TiktokIcon, url: settings?.socialLinks?.tiktok, hoverBg: 'hover:bg-zinc-800' },
    { name: 'Instagram', icon: InstagramIcon, url: settings?.socialLinks?.instagram, hoverBg: 'hover:bg-pink-600' },
    { name: 'YouTube', icon: YoutubeIcon, url: settings?.socialLinks?.youtube, hoverBg: 'hover:bg-red-600' },
  ];

  const roleFooterLinks = {
    admin: [
      { to: '/admin', label: 'Overview' },
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/returns', label: 'Returns' },
      { to: '/admin/financials', label: 'Financials' },
    ],
    manager: [
      { to: '/manager', label: 'Overview' },
      { to: '/manager/orders', label: 'Orders' },
      { to: '/manager/returns', label: 'Returns' },
      { to: '/manager/employees', label: 'Employees' },
    ],
    cashier: [
      { to: '/employee', label: 'Dashboard' },
      { to: '/pos', label: 'POS' },
      { to: '/employee/returns', label: 'Returns' },
      { to: '/employee/stock', label: 'Stock' },
    ],
    deliveryGuy: [
      { to: '/delivery', label: 'Deliveries' },
      { to: '/employee/attendance', label: 'Attendance' },
      { to: '/employee/leaves', label: 'Leaves' },
      { to: '/employee/profile', label: 'Profile' },
    ],
    stockEmployee: [
      { to: '/employee', label: 'Dashboard' },
      { to: '/employee/stock', label: 'Stock' },
      { to: '/employee/attendance', label: 'Attendance' },
      { to: '/employee/profile', label: 'Profile' },
    ],
  };
  const staffRole = user?.role && roleFooterLinks[user.role] ? user.role : null;

  return (
    <footer className="bg-gradient-to-b from-slate-950 to-zinc-950 text-white relative overflow-hidden mt-auto border-t border-slate-800/50">
      {/* Staff Quick Bar if logged in as staff */}
      {staffRole && (
        <div className="bg-white/5 border-b border-white/5 py-3">
          <div className="base-container flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
            <p className="text-xs text-brand-indigo font-bold m-0 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-indigo animate-pulse"></span>
              <span>{brandName} • <span className="capitalize">{staffRole} Portal</span></span>
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {roleFooterLinks[staffRole].map((l) => (
                <Link key={l.to} to={l.to} className="text-xs text-slate-300 hover:text-brand-indigo transition-all font-semibold">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-brand-indigo/10 to-brand-violet/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Main Footer */}
      <div className="base-container py-16 px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex flex-row items-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white p-[1.5px] border border-slate-800 shadow-lg">
                <img
                  src={brandLogoUrl}
                  alt={brandName}
                  className="w-full h-full rounded-[10px] object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent">
                {brandName}
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Elevate your tech lifestyle with curated smartphones, laptops, and premium accessories in one destination.
            </p>
            <div className="flex gap-2.5 pt-2">
              {socialButtons.map((item, i) => {
                const Icon = item.icon;
                const href = item.url || '#';
                return (
                  <a
                    key={i}
                    href={href}
                    target={href !== '#' ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    title={item.name}
                    className={`w-9 h-9 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-slate-300 hover:text-white ${item.hoverBg} hover:scale-115 transition-all shadow-sm`}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-[15px] uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3.5 text-slate-400 text-sm p-0 m-0 list-none font-medium">
              {[
                { label: "New Arrivals", path: "/shop?sort=newest" },
                { label: "Tech Deals", path: "/deals" },
                { label: "Our Boutiques", path: "/stores" },
                { label: "Categories", path: "/shop" }
              ].map(item => (
                <li key={item.label} className="group flex items-center">
                  <Link 
                    to={item.path}
                    className="hover:text-brand-indigo group-hover:translate-x-1.5 transition-all duration-200 inline-flex items-center"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-white text-[15px] uppercase tracking-wider mb-6">Customer Service</h4>
            <ul className="space-y-3.5 text-slate-400 text-sm p-0 m-0 list-none font-medium">
              {[
                { label: "Help Center", path: "/help-center" },
                { label: "Warranty Check", path: "/warranty-check" },
                { label: "Track Order", path: "/orders" },
                { label: "Shipping Info", path: "/shipping-info" },
                { label: "Returns & Exchange", path: "/returns-policy" },
                { label: "Privacy Policy", path: "/privacy-policy" }
              ].map(item => (
                <li key={item.label} className="group flex items-center">
                  <Link 
                    to={item.path}
                    className="hover:text-brand-indigo group-hover:translate-x-1.5 transition-all duration-200 inline-flex items-center"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white text-[15px] uppercase tracking-wider mb-6">Contact Us</h4>
            <div className="space-y-4 text-sm text-slate-400 font-medium">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-violet flex-shrink-0 mt-0.5" />
                <span>{brandAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-brand-violet flex-shrink-0" />
                <span>{brandPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-brand-violet flex-shrink-0" />
                <span className="truncate">{brandEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-black/10">
        <div className="base-container py-5 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
            <div className="w-5 h-5 rounded-md bg-white p-[1px]">
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="w-full h-full rounded-[4px] object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            </div>
            <span>
              © {new Date().getFullYear()}{' '}
              <a
                href="https://raxwo.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-indigo hover:text-brand-indigo/80 font-bold transition-all underline decoration-brand-indigo/35 underline-offset-4"
              >
                Raxwo (Pvt) LTD
              </a>
              . {brandName}. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Accepted Payments:</span>
            <div className="flex gap-2.5 text-slate-400 font-semibold bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
              <span title="Visa/Master Card">💳 Card</span>
              <span title="Bank Transfer">🏦 Bank</span>
              <span title="Cash on Delivery">💵 Cash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="dark-glass-panel text-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 relative border border-slate-700/30">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 border-b border-white/10 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-indigo/20 border border-brand-indigo/20 flex items-center justify-center text-brand-indigo text-2xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                🎧
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white m-0">Help Center & Support Hotlines</h3>
                <p className="text-xs text-brand-indigo m-0">Direct shop, admin, and management support contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Shop Support */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-indigo font-bold text-xs uppercase tracking-wider">
                  <span>🛍️</span> Shop Support
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="flex items-center gap-2 m-0">
                    <Phone size={13} className="text-brand-indigo shrink-0" />
                    <span className="font-bold">{brandPhone}</span>
                  </p>
                  <p className="flex items-center gap-2 m-0">
                    <Mail size={13} className="text-brand-indigo shrink-0" />
                    <span className="truncate">{brandEmail}</span>
                  </p>
                  <p className="flex items-start gap-2 m-0 text-[10px] text-slate-400 pt-2 border-t border-white/5">
                    <MapPin size={13} className="text-brand-indigo shrink-0 mt-0.5" />
                    <span>{brandAddress}</span>
                  </p>
                </div>
              </div>

              {/* 2. Admin Support */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-fuchsia font-bold text-xs uppercase tracking-wider">
                  <span>🛡️</span> Admin Support
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="flex items-center gap-2 m-0">
                    <Phone size={13} className="text-brand-fuchsia shrink-0" />
                    <span className="font-bold">{brandPhone}</span>
                  </p>
                  <p className="flex items-center gap-2 m-0">
                    <Mail size={13} className="text-brand-fuchsia shrink-0" />
                    <span className="truncate">admin@raxwo.net</span>
                  </p>
                  <div className="pt-1.5 border-t border-white/5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-brand-fuchsia/10 text-brand-fuchsia text-[9px] font-bold">
                      Account & Payments
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Manager Support */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <span>👔</span> Store Manager
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="flex items-center gap-2 m-0">
                    <Phone size={13} className="text-amber-400 shrink-0" />
                    <span className="font-bold">{settings?.phone2 || brandPhone}</span>
                  </p>
                  <p className="flex items-center gap-2 m-0">
                    <Mail size={13} className="text-amber-400 shrink-0" />
                    <span className="truncate font-medium">manager@mobixa.com</span>
                  </p>
                  <div className="pt-1.5 border-t border-white/5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[9px] font-bold">
                      Orders & Returns
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
              <p className="m-0">⏰ <strong>Operating Hours:</strong> Mon - Sat: 8:30 AM - 7:00 PM | Sun: 9:00 AM - 5:00 PM</p>
              <div className="flex gap-2">
                <a href={`tel:${brandPhone}`} className="bg-brand-indigo hover:opacity-95 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-indigo/15">
                  📞 Call Shop
                </a>
                <a href={`mailto:${brandEmail}`} className="bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-colors">
                  ✉️ Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;