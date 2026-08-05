import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, User, Settings, LayoutDashboard, ChevronDown, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import { adminNavGroups, getAdminNavGroups } from '../pages/admin/adminNavItems';
import useAdminStoreStore from '../store/adminStoreStore';
import { getAdminStores } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';
import useThemeStore, { THEME_ACCENTS } from '../store/themeStore';
import NotificationBell from './NotificationBell';

const NavLink = ({ item, location, collapsed, onNavigate, userRole }) => {
  const { accent } = useThemeStore();
  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.indigo;
  const primaryColor = themeConfig.primary || '#6366f1';

  const isRoot = item.path === '/admin' || item.path === '/manager' || item.path === '/employee';
  const isActive = isRoot
    ? location.pathname === item.path
    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      title={item.label}
      style={
        isActive
          ? {
              backgroundColor: primaryColor,
              color: '#ffffff',
              boxShadow: `0 10px 22px -5px ${primaryColor}80`,
            }
          : {}
      }
      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all group ${
        isActive
          ? 'text-white shadow-lg'
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-xs" />
      )}
      <item.icon
        size={16}
        className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-400'
        }`}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate tracking-tight">{item.label}</span>
          {isActive && <ChevronRight size={13} className="opacity-90 flex-shrink-0 text-white" />}
        </>
      )}
    </Link>
  );
};

const SidebarContent = ({ navItems = [], collapsed, location, onNavigate, userRole }) => {
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      const savedScrollTop = sessionStorage.getItem('sidebar-scroll-top');
      if (savedScrollTop) {
        navRef.current.scrollTop = Number(savedScrollTop);
      }
    }
  }, []);

  const handleScroll = (e) => {
    sessionStorage.setItem('sidebar-scroll-top', e.target.scrollTop);
  };

  const safeNavItems = Array.isArray(navItems) ? navItems : [];
  const isGrouped = safeNavItems.length > 0 && safeNavItems[0]?.items;

  if (!isGrouped) {
    return (
      <nav ref={navRef} onScroll={handleScroll} className="p-3 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
        {safeNavItems.map((item) => (
          <NavLink key={item.path} item={item} location={location} collapsed={collapsed} onNavigate={onNavigate} userRole={userRole} />
        ))}
      </nav>
    );
  }

  return (
    <nav ref={navRef} onScroll={handleScroll} className="p-2.5 flex-1 overflow-y-auto scrollbar-hide">
      {safeNavItems.map((group, gi) => (
        <div key={gi} className="mb-2">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 select-none">
                {group.label}
              </span>
            </div>
          )}
          {collapsed && gi > 0 && <div className="border-t border-slate-100 my-2 mx-2" />}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.path} item={item} location={location} collapsed={collapsed} onNavigate={onNavigate} userRole={userRole} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

const DashboardLayout = ({ children, navItems, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isStaff = user && ['admin', 'manager', 'cashier', 'deliveryGuy', 'stockEmployee'].includes(user.role);
  const path = location.pathname;
  const showDashboardHeader = isStaff && (
    path.startsWith('/admin') ||
    path.startsWith('/manager') ||
    path.startsWith('/employee') ||
    path.startsWith('/delivery') ||
    path.startsWith('/barcode')
  );
  const headerHeightClass = showDashboardHeader ? 'top-14 sm:top-16' : 'top-[100px]';
  const sidebarHeight = showDashboardHeader ? 'calc(100dvh - 3.5rem)' : 'calc(100vh - 100px)';
  const mainMinHeight = showDashboardHeader ? 'calc(100dvh - 3.5rem)' : 'calc(100vh - 100px)';
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const { selectedStoreId, setSelectedStoreId } = useAdminStoreStore();
  const [stores, setStores] = useState([]);

  let finalNavItems = navItems;
  if (!finalNavItems && (user?.role === 'admin' || location.pathname.startsWith('/admin'))) {
    finalNavItems = adminNavGroups;
  }
  const isAdminNav = user?.role === 'admin' && (finalNavItems === adminNavGroups || (Array.isArray(finalNavItems) && finalNavItems.length > 0 && finalNavItems[0]?.label === 'Dashboard'));
  if (isAdminNav) {
    finalNavItems = getAdminNavGroups(user);
  }

  useEffect(() => {
    fetchSettings();
    if (isAdminNav && user?.role === 'admin') {
      getAdminStores().then((res) => setStores(res.data)).catch(() => { });
    }
  }, [fetchSettings, isAdminNav, user?.role]);

  useEffect(() => {
    fetchSettings(true);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const brandName = settings?.shopName || 'Mobile Hub';
  const logoSrc = getImageUrl(settings?.logoUrl || settings?.logo || '') || '/logo.png';

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const getSettingsLink = () => {
    if (!user) return null;
    if (user.role === 'admin') return '/admin/settings';
    if (user.role === 'manager') return '/manager';
    if (['cashier', 'deliveryGuy', 'stockEmployee'].includes(user.role)) return '/employee/profile';
    return '/profile';
  };
  const settingsLink = getSettingsLink();
  const profilePath = ['cashier', 'deliveryGuy', 'stockEmployee'].includes(user?.role) ? '/employee/profile' : '/profile';

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin': return { path: '/admin', label: 'Admin Panel' };
      case 'manager': return { path: '/manager', label: 'Dashboard' };
      case 'cashier':
      case 'deliveryGuy':
      case 'stockEmployee':
        return { path: '/employee', label: 'My Portal' };
      default: return null;
    }
  };
  const dashLink = getDashboardLink();

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarW = collapsed ? 'w-[72px]' : 'w-[min(100%,16rem)] sm:w-64';
  const mainML = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <div className="admin-dashboard-container min-h-[100dvh] flex flex-col bg-slate-50/70 overflow-x-hidden">
      {showDashboardHeader && (
        <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3 sticky top-0 z-50 flex-shrink-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            type="button"
            className="hidden lg:flex p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu size={18} />
          </button>

          <Link
            to={user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/employee'}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 no-underline min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-fuchsia p-[2px] shadow-md flex items-center justify-center flex-shrink-0">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-lg bg-white"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
              ) : (
                <span className="text-white text-xs font-black">MH</span>
              )}
            </div>
            <span className="hidden sm:inline font-black text-xs sm:text-sm tracking-tight text-slate-800 bg-gradient-to-r from-brand-indigo to-brand-violet bg-clip-text text-transparent truncate max-w-[120px] md:max-w-[180px] lg:max-w-none">
              {brandName}
            </span>
          </Link>

          <div className="flex-1 min-w-0" />

          {user?.role === 'admin' && stores.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5">
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer border-0 max-w-[160px]"
              >
                <option value="all">Global (All Stores)</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {title && (
            <span className={`hidden xl:inline-flex items-center text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl whitespace-nowrap ${user?.role === 'admin'
                ? 'role-badge-admin'
                : user?.role === 'manager'
                  ? 'role-badge-manager'
                  : 'role-badge-employee'
              }`}>
              {user?.role === 'admin' ? 'Executive' : user?.role === 'manager' ? 'Operations' : 'Staff'} • {title}
            </span>
          )}

          <div className="flex items-center p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            <NotificationBell />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="sm:hidden w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 p-0 cursor-pointer bg-transparent"
              aria-label="User menu"
            >
              {user?.avatar ? (
                <img src={getImageUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-400 text-[10px] font-black">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="hidden sm:flex items-center gap-2 sm:gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-slate-100/70 transition-all select-none"
            >
              {user?.avatar ? (
                <img src={getImageUrl(user.avatar)} alt="" className="w-7 h-7 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 text-[10px] font-black shadow-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-[11px] font-extrabold text-slate-800 leading-tight m-0 flex items-center gap-1 max-w-[120px] truncate">
                  {user?.name}
                  <ChevronDown size={11} className="text-slate-400 flex-shrink-0" />
                </p>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider leading-tight m-0 mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 md:hidden" />
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-[min(calc(100vw-1.5rem),14rem)] sm:w-56 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-[100] py-1 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-white">
                  <p className="text-sm font-black text-white m-0 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 m-0 truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full">{user?.role}</span>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-extrabold uppercase tracking-wide no-underline"
                >
                  <User size={14} className="text-slate-400" /> My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-extrabold uppercase tracking-wide no-underline"
                >
                  <Settings size={14} className="text-slate-400" /> Settings & Customizer
                </Link>
                {dashLink && (
                  <>
                    <hr className="my-1 border-slate-100" />
                    <Link
                      to={dashLink.path}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-blue-600 hover:bg-blue-50 font-black transition-colors uppercase tracking-wide no-underline"
                    >
                      <LayoutDashboard size={14} /> {dashLink.label}
                    </Link>
                  </>
                )}
                <hr className="my-1 border-slate-100" />
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5 font-black uppercase tracking-wide border-0 bg-transparent cursor-pointer"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <div className="flex flex-1 min-w-0">
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`
            fixed ${headerHeightClass} left-0 z-40
            ${sidebarW}
            bg-white border-r border-slate-200/80
            flex flex-col transition-transform duration-250 ease-out shadow-sm
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ height: sidebarHeight }}
        >
          <SidebarContent
            navItems={finalNavItems}
            collapsed={collapsed}
            location={location}
            onNavigate={() => setSidebarOpen(false)}
            userRole={user?.role}
          />
        </aside>

        <main className={`flex-1 min-w-0 transition-all duration-250 ${mainML} overflow-x-hidden`}>
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto" style={{ minHeight: mainMinHeight }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
