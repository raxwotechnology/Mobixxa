'use client';

import { useState, useEffect } from 'react';
import { Link } from '../../utils/navigation';
import { Users, Store as StoreIcon, Tag, ShoppingBag, DollarSign, Package, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Sparkles, Monitor, CreditCard, Zap, ShoppingCart, Barcode, Clock, BarChart2, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStats, getStores, getFinancialDashboard } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import useCurrencyStore from '../../store/currencyStore';
import useAdminStoreStore from '../../store/adminStoreStore';
import useThemeStore, { THEME_ACCENTS } from '../../store/themeStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrencyStore();
  const { selectedStoreId } = useAdminStoreStore();
  const { accent, customColor } = useThemeStore();

  const themeConfig = THEME_ACCENTS[accent] || THEME_ACCENTS.sapphire;
  const primaryColor = accent === 'custom' ? (customColor || '#2563eb') : (themeConfig.primary || '#2563eb');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const storeParam = selectedStoreId !== 'all' ? selectedStoreId : undefined;
        const [statsRes, storesRes, finRes] = await Promise.allSettled([
          getAdminStats(storeParam),
          getStores(),
          getFinancialDashboard({ period: 'monthly', storeId: storeParam })
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (storesRes.status === 'fulfilled') setStores(storesRes.value.data.stores || storesRes.value.data);
        if (finRes.status === 'fulfilled') setFinancials(finRes.value.data);
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedStoreId]);

  const cards = [
    { label: 'Total Revenue', value: `${currency} ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', change: '+14.2%' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+8.5%' },
    { label: 'Products Listed', value: stats?.products || 0, icon: Package, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+12' },
    { label: 'Active Boutiques', value: stats?.stores || 0, icon: StoreIcon, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', change: 'Live' },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-slate-800', bg: 'bg-slate-100 border-slate-200', change: '+5' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Overview">
      <div className="max-w-7xl mx-auto pb-10 space-y-8">
        
        {/* Executive Command Center Banner */}
        <div 
          className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, #0f172a 0%, #1e293b 45%, ${primaryColor} 100%)`,
            borderColor: `${primaryColor}40`
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-40" 
            style={{ background: `radial-gradient(circle at top right, ${primaryColor}, transparent 70%)` }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span 
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border shadow-xs"
                style={{ backgroundColor: `${primaryColor}30`, color: '#ffffff', borderColor: `${primaryColor}60` }}
              >
                <ShieldCheck size={12} /> Executive Command Center
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white m-0">Enterprise Overview</h1>
              <p className="text-slate-300 text-xs md:text-sm font-normal m-0 mt-2 max-w-xl leading-relaxed">
                Real-time insights across store network, sales revenues, inventory assets, and group profit performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 border border-slate-700/80 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full pulse-live-dot" style={{ backgroundColor: primaryColor }} /> Live System Active
              </span>
            </div>
          </div>
        </div>

        {/* Executive Quick Operations Console */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 m-0 tracking-tight flex items-center gap-2">
                <Zap size={16} className="text-blue-600 fill-blue-600" /> Executive Quick Access
              </h3>
              <p className="text-xs font-semibold text-slate-500 m-0 mt-0.5">Instant access to key enterprise management modules</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              Admin Shortcuts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Products & Inventory', desc: 'Manage stock items & categories', path: '/admin/products', icon: Package, gradient: 'from-emerald-600 to-teal-600', badge: 'Inventory' },
              { title: 'All Sales Orders', desc: 'View customer order history', path: '/admin/orders', icon: ShoppingBag, gradient: 'from-violet-600 to-purple-600', badge: 'Sales' },
              { title: 'Barcode Generator', desc: 'Generate & print product labels', path: '/barcode-generator', icon: Barcode, gradient: 'from-amber-500 to-orange-600', badge: 'Labels' },
              { title: 'My Attendance & Clocking', desc: 'Clock in, break & daily logs', path: '/admin/attendance', icon: Clock, gradient: 'from-sky-500 to-blue-600', badge: 'Attendance' },
              { title: 'Staff & User Access', desc: 'Manage employees & permissions', path: '/admin/users', icon: Users, gradient: 'from-fuchsia-600 to-pink-600', badge: 'Users' },
              { title: 'Branch Stores', desc: 'Multi-store setup & managers', path: '/admin/stores', icon: StoreIcon, gradient: 'from-indigo-600 to-blue-600', badge: 'Stores' },
              { title: 'Payroll & Salaries', desc: 'Employee salary calculations', path: '/admin/payroll', icon: DollarSign, gradient: 'from-teal-600 to-emerald-600', badge: 'Payroll' },
              { title: 'Profit & Loss Reports', desc: 'Revenue & margin analytics', path: '/admin/profit-reports', icon: BarChart2, gradient: 'from-rose-600 to-pink-600', badge: 'Financials' },
            ].map((q) => (
              <Link
                key={q.title}
                to={q.path}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/70 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all duration-300 no-underline shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${q.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <q.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{q.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 flex-shrink-0">{q.badge}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 truncate m-0 mt-0.5">{q.desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: primaryColor }} />
          </div>
        ) : (
          /* Metrics Top 5 Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between enterprise-card shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl ${card.bg} border flex items-center justify-center shadow-xs`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <span 
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 border"
                    style={{ backgroundColor: `${primaryColor}12`, color: primaryColor, borderColor: `${primaryColor}30` }}
                  >
                    <ArrowUpRight size={10} /> {card.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 m-0 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-slate-900 truncate m-0">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && financials && (
          <>
            {/* Financial Overview Matrix Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Net Revenue</p>
                <p className="text-2xl font-black text-emerald-600 m-0">Rs. {(financials.totalRevenue || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Total Expenses</p>
                <p className="text-2xl font-black text-rose-600 m-0">Rs. {(financials.totalExpenses || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Other Income</p>
                <p className="text-2xl font-black text-sky-600 m-0">Rs. {(financials.totalAdditionalIncome || 0).toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden enterprise-card shadow-xs">
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/5 rounded-bl-full pointer-events-none" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0 mb-1">Net Profit</p>
                <p className={`text-2xl font-black m-0 ${(financials.netProfit || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  Rs. {(financials.netProfit || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Recharts Graphical Visualizations */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart: Revenue vs Expenses */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 text-base m-0">Revenue vs Expenses Breakdown</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">Monthly Comparative</span>
                </div>

                {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={financials.series || financials.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                      <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" fill="#475569" name="Expenses" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-slate-400 font-semibold text-xs">No graphical series data found</div>
                )}
              </div>

              {/* Line Chart: Net Profit Trend */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 text-base m-0">Net Profit Trend Line</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Trajectory</span>
                </div>

                {financials && Array.isArray(financials.series || financials.monthlyData) ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={financials.series || financials.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                      <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3.5} dot={{ r: 5, fill: '#059669' }} name="Net Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-slate-400 font-semibold text-xs">No trend series data found</div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
