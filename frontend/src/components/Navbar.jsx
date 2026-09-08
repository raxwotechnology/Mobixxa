'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from '../utils/navigation';
import { ShoppingCart, User, Search, MapPin, Menu, X, ChevronDown, RefreshCw, Home, ShoppingBag, Heart, Package, LayoutDashboard, Tag, Settings } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import useCartStore from '../store/cartStore';
import useCurrencyStore from '../store/currencyStore';
import { searchProducts } from '../services/api';
import NotificationBell from './NotificationBell';
import useSettingsStore from '../store/settingsStore';

const buildFeatureIndex = (role) => {
  const items = [
    // Customer
    { label: 'Shop', path: '/shop', roles: ['customer', 'guest'], keywords: ['products', 'buy', 'items'] },
    { label: 'Deals', path: '/deals', roles: ['customer', 'guest'], keywords: ['offers', 'discounts', 'sale'] },
    { label: 'Stores', path: '/stores', roles: ['customer', 'guest'], keywords: ['shops', 'branches'] },
    { label: 'Warranty Check', path: '/warranty-check', roles: ['customer', 'guest'], keywords: ['warranty', 'imei', 'serial', 'check'] },
    { label: 'Orders', path: '/orders', roles: ['customer'], keywords: ['my orders', 'history', 'tracking'] },
    { label: 'Wishlist', path: '/wishlist', roles: ['customer'], keywords: ['favorites', 'saved'] },
    { label: 'Loyalty & Rewards', path: '/loyalty', roles: ['customer'], keywords: ['points', 'rewards', 'store credit'] },

    // Admin
    { label: 'Admin Overview', path: '/admin', roles: ['admin'], keywords: ['dashboard'] },
    { label: 'Users', path: '/admin/users', roles: ['admin'], keywords: ['customers', 'accounts'] },
    { label: 'Employees', path: '/admin/employees', roles: ['admin'], keywords: ['staff', 'leave requests'] },
    { label: 'Products', path: '/admin/products', roles: ['admin'], keywords: ['inventory', 'stock', 'suppliers', 'receiving', 'returns'] },
    { label: 'Orders', path: '/admin/orders', roles: ['admin'], keywords: ['sales', 'deliveries'] },
    { label: 'Returns', path: '/admin/returns', roles: ['admin'], keywords: ['refund', 'exchange', 'store credit'] },
    { label: 'Expenses', path: '/admin/expenses', roles: ['admin'], keywords: ['costs'] },
    { label: 'Financials', path: '/admin/financials', roles: ['admin'], keywords: ['revenue', 'profit', 'report'] },
    { label: 'Reports', path: '/admin/reports', roles: ['admin'], keywords: ['analytics'] },
    { label: 'POS Terminal', path: '/pos', roles: ['admin', 'manager', 'cashier'], keywords: ['pos', 'checkout', 'billing'] },

    // Manager
    { label: 'Manager Overview', path: '/manager', roles: ['manager'], keywords: ['dashboard'] },
    { label: 'Products', path: '/manager/products', roles: ['manager'], keywords: ['inventory', 'stock', 'suppliers', 'receiving', 'returns'] },
    { label: 'Orders', path: '/manager/orders', roles: ['manager'], keywords: ['sales', 'deliveries'] },
    { label: 'Returns', path: '/manager/returns', roles: ['manager'], keywords: ['exchange', 'upgrade', 'return requests'] },
    { label: 'Employees', path: '/manager/employees', roles: ['manager'], keywords: ['staff', 'leave requests'] },
    { label: 'Attendance', path: '/manager/attendance', roles: ['manager'], keywords: ['check-in', 'check out'] },
    { label: 'Leaves', path: '/manager/leaves', roles: ['manager'], keywords: ['leave', 'leave requests'] },

    // Employee (cashier/staff)
    { label: 'My Portal', path: '/employee', roles: ['cashier', 'stockEmployee', 'deliveryGuy'], keywords: ['employee'] },
    { label: 'Attendance', path: '/employee/attendance', roles: ['cashier', 'stockEmployee', 'deliveryGuy'], keywords: ['check-in', 'check out'] },
    { label: 'Leaves', path: '/employee/leaves', roles: ['cashier', 'stockEmployee', 'deliveryGuy'], keywords: ['leave request'] },
    { label: 'Returns', path: '/employee/returns', roles: ['cashier'], keywords: ['customer return', 'exchange', 'store credit'] },
    { label: 'Stock View', path: '/employee/stock', roles: ['cashier', 'stockEmployee'], keywords: ['inventory', 'products'] },

    // Delivery
    { label: 'Deliveries', path: '/delivery', roles: ['deliveryGuy'], keywords: ['orders', 'assigned'] },
  ];

  const normalizedRole = role || 'guest';
  return items.filter((i) => i.roles.includes(normalizedRole) || (normalizedRole !== 'guest' && i.roles.includes('customer') && normalizedRole === 'customer'));
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.getCount());
  const fetchCart = useCartStore((s) => s.fetchCart);
  const { currency, toggleCurrency, fetchRate, getProductPrice } = useCurrencyStore();
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandLogoUrl = getImageUrl(settings?.logoUrl || settings?.logo) || '/logo.png';
  const brandPhone = settings?.phone || '+94 11 255 5000';
  const freeDeliveryThreshold = Number(settings?.deliveryFeeThreshold || 5000).toLocaleString();

  useEffect(() => {
    if (user) fetchCart();
    fetchRate();
  }, [user]);

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [featureResults, setFeatureResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  // Handle search with debounce
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);

    if (value.length < 2) {
      setSearchResults([]);
      setFeatureResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const q = value.trim().toLowerCase();
        const index = buildFeatureIndex(user?.role);
        const featureMatches = index
          .filter((i) => {
            const hay = [i.label, ...(i.keywords || [])].join(' ').toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 6);
        setFeatureResults(featureMatches);

        const res = await searchProducts(value);
        setSearchResults(res.data.products.slice(0, 6));
        setShowSearchResults(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    // Clear cart state so next user doesn't see old cart
    useCartStore.getState().clearItems();
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Navigation links with role visibility
  const shouldHidePublicTabs = !!user && ['admin', 'manager', 'cashier', 'deliveryGuy', 'stockEmployee'].includes(user.role);
  const isCustomer = !user || user.role === 'customer';
  const getSettingsLink = () => {
    if (!user) return null;
    return '/settings';
  };
  const settingsLink = getSettingsLink();
  const navLinks = [
    { path: '/', label: 'Home', icon: Home, show: !shouldHidePublicTabs },
    { path: '/shop', label: 'Shop', icon: ShoppingBag, show: !shouldHidePublicTabs },
    { path: '/deals', label: 'Deals', icon: Tag, show: !shouldHidePublicTabs },
    { path: '/stores', label: 'Stores', icon: MapPin, show: !shouldHidePublicTabs },
  ];

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return { path: '/admin', label: 'Admin Panel', emoji: '🛡️' };
      case 'manager': return { path: '/manager', label: 'Dashboard', emoji: '📊' };
      case 'cashier': return { path: '/employee', label: 'My Portal', emoji: '👤' };
      case 'deliveryGuy': return { path: '/employee', label: 'My Portal', emoji: '👤' };
      case 'stockEmployee': return { path: '/employee', label: 'My Portal', emoji: '👤' };
      default: return null;
    }
  };

  const dashLink = getDashboardLink();
  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm sticky top-0 z-50">
      {/* Top Utility Bar */}
      <div className="bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia text-white text-[11px] font-semibold tracking-wide">
        <div className="base-container py-2 flex items-center justify-between">
          <span className="hidden sm:inline">✨ {brandName} — Next-Gen Technology & Accessories Store</span>
          <span className="sm:hidden">✨ {brandName}</span>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">📞 {brandPhone}</span>
            {/* Currency Toggle */}
            <button
              onClick={toggleCurrency}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 transition-all backdrop-blur-sm text-[10px] font-bold shadow-sm"
              title="Toggle currency"
            >
              <RefreshCw size={10} className="animate-spin-slow" />
              <span>{currency === 'LKR' ? 'LKR 🇱🇰' : 'USD 🇺🇸'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="base-container py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-black text-slate-900 flex-shrink-0 flex items-center gap-2 sm:gap-3 group max-w-[180px] xs:max-w-[240px] sm:max-w-none">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-indigo via-brand-violet to-brand-fuchsia p-[2px] shadow-[0_8px_20px_-4px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
            <img
              src={brandLogoUrl}
              alt={brandName}
              className="w-full h-full rounded-[10px] sm:rounded-[14px] object-cover bg-white"
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
            />
          </div>
          <span className="tracking-tight font-black text-sm xs:text-base sm:text-xl md:text-2xl bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent truncate drop-shadow-sm">
            {brandName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.filter((l) => l.show).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs font-black uppercase tracking-wider transition-all py-1.5 border-b-2 ${
                isActive(link.path)
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-600 hover:text-blue-600 border-transparent'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {dashLink && (
            <Link
              to={dashLink.path}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                isActive(dashLink.path)
                  ? 'text-blue-700 bg-blue-100 shadow-xs'
                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              {dashLink.emoji} {dashLink.label}
            </Link>
          )}
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-indigo pointer-events-none" />
            <input
              type="text"
              placeholder="Search smartphones, laptops, accessories..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 hover:border-brand-indigo/60 rounded-2xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-4 focus:ring-brand-indigo/15 focus:bg-white focus:border-brand-indigo transition-all text-xs font-semibold text-slate-800 shadow-sm placeholder:text-slate-400 placeholder:font-medium"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-fuchsia text-white w-8 h-8 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
            >
              <Search size={15} />
            </button>

            {/* Search Dropdown Results */}
            {showSearchResults && (featureResults.length > 0 || searchResults.length > 0) && (
              <div className="absolute top-full mt-2 w-full bg-white border border-card-border rounded-xl shadow-xl z-50 overflow-hidden">
                {featureResults.length > 0 && (
                  <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-text bg-gray-50 border-b border-card-border">
                    Pages & Features
                  </div>
                )}
                {featureResults.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => {
                      navigate(f.path);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-card-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-navy m-0 truncate">{f.label}</p>
                      <p className="text-xs text-muted-text m-0 truncate">{f.path}</p>
                    </div>
                    <span className="text-xs text-primary-blue font-semibold">Open</span>
                  </button>
                ))}

                {searchResults.length > 0 && (
                  <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-text bg-gray-50 border-b border-card-border">
                    Products
                  </div>
                )}
                {searchResults.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-card-border last:border-b-0"
                  >
                    <img
                      src={getImageUrl(product.productLink || product.images?.[0]) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => handleImageError(e, 'Product')}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-navy m-0 truncate">{product.name}</p>
                      <p className="text-xs text-muted-text m-0">{product.storeId?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary-blue flex-shrink-0">
                      {getProductPrice(product)}
                    </span>
                  </Link>
                ))}
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2.5 text-sm text-primary-blue hover:bg-blue-50 transition-colors font-medium"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {user && <NotificationBell />}

          {/* Wishlist */}
          {user && isCustomer && (
            <Link to="/wishlist" className="hidden sm:flex relative text-slate-600 hover:text-brand-violet hover:bg-brand-violet/10 transition-all p-2.5 rounded-xl border border-slate-200/60 shadow-sm" title="Wishlist">
              <Heart size={18} />
            </Link>
          )}

          {/* Cart */}
          {isCustomer && (
            <Link to="/cart" className="relative text-slate-700 hover:text-brand-indigo hover:bg-brand-indigo/10 transition-all p-2.5 rounded-xl border border-slate-200/60 shadow-sm" title="Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black rounded-full h-4 w-4 min-w-[20px] h-[20px] flex items-center justify-center shadow-md animate-bounce">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/70 border border-slate-200/60 transition-colors shadow-sm">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-brand-indigo/30 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-indigo to-brand-violet rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-[10px] text-slate-400 m-0 leading-tight">Hello, {user.name.split(' ')[0]}</p>
                  <p className="text-xs font-black text-slate-800 m-0 leading-tight flex items-center gap-0.5">Account <ChevronDown size={12} /></p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-brand-indigo/10 to-brand-violet/10 border-b border-slate-100">
                  <p className="text-sm font-black text-slate-800 m-0">{user.name}</p>
                  <p className="text-[11px] text-slate-500 m-0 truncate">{user.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-wider bg-brand-indigo text-white px-2.5 py-0.5 rounded-full shadow-sm">{user.role}</span>
                </div>
                <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-indigo transition-colors font-medium">
                  <User size={14} className="text-slate-400" /> My Profile
                </Link>
                {isCustomer && (
                  <>
                    <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-indigo transition-colors font-medium">
                      <Package size={14} className="text-slate-400" /> Orders
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-indigo transition-colors font-medium">
                      <Heart size={14} className="text-slate-400" /> Wishlist
                    </Link>
                    <Link to="/loyalty" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors font-medium">
                      🎁 <span>Loyalty & Rewards</span>
                    </Link>
                  </>
                )}
                {settingsLink && (
                  <Link to={settingsLink} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-indigo transition-colors font-medium">
                    <Settings size={14} className="text-slate-400" /> Settings
                  </Link>
                )}
                {dashLink && (
                  <>
                    <hr className="my-1 border-slate-100" />
                    <Link to={dashLink.path} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-violet hover:bg-brand-violet/5 font-black transition-colors">
                      <LayoutDashboard size={14} /> {dashLink.emoji} {dashLink.label}
                    </Link>
                  </>
                )}
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5 font-bold"
                >
                  ↪ Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors px-2 py-1">
                Sign In
              </Link>
              <Link to="/register" className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-full transition-all shadow-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-slate-700 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-100 animate-slideDown shadow-xl rounded-b-3xl">
          <div className="base-container py-5 px-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tech devices..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/30 focus:border-brand-indigo bg-slate-50 transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-indigo">
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Nav Links */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.filter((l) => l.show).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl text-xs font-bold transition-all border ${
                    isActive(link.path)
                      ? 'text-brand-indigo bg-brand-indigo/5 border-brand-indigo/10 shadow-sm'
                      : 'text-slate-600 bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <link.icon size={18} className="mb-1.5 opacity-80" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Dashboard Link */}
            {dashLink && (
              <Link
                to={dashLink.path}
                className="flex items-center justify-between p-3.5 rounded-2xl text-sm font-bold text-brand-violet bg-brand-violet/5 border border-brand-violet/10 hover:bg-brand-violet/10 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard size={18} />
                  <span>{dashLink.emoji} {dashLink.label}</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            )}

            {/* User Links */}
            {user && isCustomer && (
              <div className="bg-slate-50 rounded-2xl p-2.5 space-y-1 border border-slate-100">
                <Link to="/orders" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white transition-all">
                  <Package size={16} className="text-slate-400" /> My Orders
                </Link>
                <Link to="/wishlist" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white transition-all">
                  <Heart size={16} className="text-slate-400" /> Wishlist
                </Link>
                <Link to="/loyalty" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white transition-all">
                  🎁 Loyalty & Rewards
                </Link>
              </div>
            )}

            {/* Currency & Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleCurrency}
                className="flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all w-full"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-slate-400" />
                  <span>Currency: {currency}</span>
                </div>
                <span className="text-[10px] text-brand-indigo uppercase">Switch to {currency === 'LKR' ? 'USD' : 'LKR'}</span>
              </button>
            </div>

            {/* Login/Logout */}
            {user ? (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 m-0 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-400 m-0 leading-tight">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/profile" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                    <User size={14} /> Profile
                  </Link>
                  <Link to={settingsLink} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                    <Settings size={14} /> Settings
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                >
                  ↪ Logout Account
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1 text-center border border-slate-200 text-slate-700 text-sm font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="flex-1 text-center bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-indigo/10">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
